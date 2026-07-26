/* =====================================================================
   memoria-notas.test.mjs
   ---------------------------------------------------------------------
   Notas de preferência e recuperação (memória semântica, slice 2).
   Tudo redirecionado por MIRA_MEMORY_DIR para um diretório temporário,
   o mesmo env que os servidores de autoria usam.

   Rodar:  node --test tests/memoria-notas.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEM = mkdtempSync(join(tmpdir(), 'mira-notas-'));
process.env.MIRA_MEMORY_DIR = MEM;

/* o módulo lê o env no import, então importa depois de setar */
const { lerNotas, selecionar, formatarPacote, criarNota, NOTAS_DIR } = await import('../lib/memoria/notas.js');

function escrever(arquivo, conteudo) {
    mkdirSync(NOTAS_DIR, { recursive: true });
    writeFileSync(join(NOTAS_DIR, arquivo), conteudo, 'utf8');
}
function nota(frente, corpo) {
    return '---\n' + frente.trim() + '\n---\n\n' + corpo + '\n';
}

test.after(() => rmSync(MEM, { recursive: true, force: true }));

test('ordem explícita do usuário entra ativa na hora', () => {
    const r = criarNota({
        texto: 'na capa o título fica na metade de cima',
        eixo: 'posicao', escopo: { papel: 'capa' }, fonte: 'ordem'
    });
    assert.equal(r.estado, 'ativo');
    const { notas } = lerNotas();
    const criada = notas.find(n => n.arquivo === r.arquivo);
    assert.equal(criada.eixo, 'posicao');
    assert.equal(criada.escopo.papel, 'capa');
    assert.equal(criada.confianca_padrao, 'alta');
    /* a causa nunca sobe sozinha (consolidacao-perfil RF-07) */
    assert.equal(criada.confianca_causa, 'baixa');
});

test('delta implícito entraria como candidato, não ativo', () => {
    const r = criarNota({ texto: 'títulos em caixa alta', eixo: 'tipografia', fonte: 'edicao' });
    assert.equal(r.estado, 'candidato');
});

test('campo de escopo que é acidente é recusado', () => {
    assert.throws(
        () => criarNota({ texto: 'x', eixo: 'cor', escopo: { slide: '1' }, fonte: 'ordem' }),
        /não elegível/
    );
});

test('nota malformada é pulada com aviso, sem derrubar a leitura', () => {
    escrever('sem-frontmatter.md', 'só texto solto, sem cabeçalho');
    escrever('estado-torto.md', nota('eixo: cor\nestado: mais_ou_menos', 'texto'));
    escrever('corpo-vazio.md', nota('eixo: cor\nestado: ativo', ''));
    const { notas, avisos } = lerNotas();
    assert.ok(avisos.length >= 3, 'avisou sobre as três');
    assert.ok(notas.every(n => !['sem-frontmatter.md', 'estado-torto.md', 'corpo-vazio.md'].includes(n.arquivo)));
});

test('só nota ativa entra no pacote', () => {
    escrever('revogada.md', nota('eixo: cor\nestado: revogado', 'fundo branco em tudo'));
    const { notas } = lerNotas();
    const { aplicadas, ignoradas } = selecionar(notas, { papel: 'capa', formato: '16x9' });
    assert.ok(!aplicadas.some(n => n.arquivo === 'revogada.md'));
    assert.ok(ignoradas.some(i => i.arquivo === 'revogada.md' || i.nota.arquivo === 'revogada.md'));
});

test('escopo filtra: nota de capa não vaza para slide de conteúdo', () => {
    const { notas } = lerNotas();
    const capa = selecionar(notas, { papel: 'capa' });
    const conteudo = selecionar(notas, { papel: 'conteudo' });
    assert.ok(capa.aplicadas.some(n => n.escopo.papel === 'capa'));
    assert.ok(!conteudo.aplicadas.some(n => n.escopo.papel === 'capa'));
    assert.ok(conteudo.ignoradas.some(i => /não bate com capa/.test(i.motivo)));
});

test('campo que a nota exige e o contexto não traz vira ignorada com motivo', () => {
    escrever('precisa-formato.md', nota('eixo: animacao\nescopo:\n  formato: 9x16\nestado: ativo', 'animação sobe de baixo'));
    const { notas } = lerNotas();
    const { aplicadas, ignoradas } = selecionar(notas, { papel: 'conteudo' });
    assert.ok(!aplicadas.some(n => n.arquivo === 'precisa-formato.md'));
    assert.ok(ignoradas.some(i => /não informou formato/.test(i.motivo)));
});

test('teto do pacote corta e diz o que cortou', () => {
    for (let i = 0; i < 8; i++) {
        escrever('teto-' + i + '.md', nota('eixo: eixo' + i + '\nestado: ativo', 'regra ' + i));
    }
    const { notas } = lerNotas();
    const r = selecionar(notas, {}, { teto: 6 });
    assert.equal(r.aplicadas.length, 6);
    assert.ok(r.ignoradas.some(i => /acima do teto/.test(i.motivo)), 'corte é declarado, não silencioso');
});

test('pacote é texto legível, nunca vetor', () => {
    const { notas } = lerNotas();
    const texto = formatarPacote(selecionar(notas, { papel: 'capa' }), { papel: 'capa' });
    assert.match(texto, /Lembranças do Mira/);
    assert.match(texto, /metade de cima/);
    assert.match(texto, /A marca .*manda acima/);
});

test('memória vazia responde sem quebrar o builder', () => {
    const vazio = mkdtempSync(join(tmpdir(), 'mira-vazio-'));
    try {
        const saida = execFileSync(process.execPath, [join(RAIZ, 'bin/mira.js'), 'memoria', 'lembrancas'],
            { env: { ...process.env, MIRA_MEMORY_DIR: vazio }, encoding: 'utf8' });
        assert.match(saida, /Nenhuma lembrança se aplica/);
    } finally {
        rmSync(vazio, { recursive: true, force: true });
    }
});

/* as consultas do Passo 1.5 do mira-builder, exatamente como estão na
   SKILL.md. Nota de escopo só aparece quando o papel dela é informado:
   uma chamada genérica não alcança nenhuma, e foi assim que a primeira
   versão da skill deixou toda nota de conteúdo inalcançável. */
test('as consultas da SKILL alcançam nota de cada papel', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mira-skill-'));
    const env = { ...process.env, MIRA_MEMORY_DIR: dir };
    try {
        const mira = (...args) => execFileSync(process.execPath, [join(RAIZ, 'bin/mira.js'), 'memoria', ...args],
            { env, encoding: 'utf8' });
        mira('nota', 'título de conteúdo alinhado à esquerda', '--eixo', 'posicao', '--papel', 'conteudo');
        mira('nota', 'na capa o título fica em cima', '--eixo', 'posicao', '--papel', 'capa');

        const capa = mira('lembrancas', '--papel', 'capa', '--formato', '16x9');
        const conteudo = mira('lembrancas', '--papel', 'conteudo', '--formato', '16x9');
        assert.match(capa, /na capa o título fica em cima/);
        assert.doesNotMatch(capa, /alinhado à esquerda/);
        assert.match(conteudo, /alinhado à esquerda/);
        assert.doesNotMatch(conteudo, /fica em cima/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('CLI grava a ordem e a devolve na consulta seguinte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mira-cli-'));
    const env = { ...process.env, MIRA_MEMORY_DIR: dir };
    try {
        const mira = (...args) => execFileSync(process.execPath, [join(RAIZ, 'bin/mira.js'), 'memoria', ...args],
            { env, encoding: 'utf8' });
        mira('nota', 'menos texto por slide', '--eixo', 'densidade');
        /* a frase não pode engolir o valor da flag */
        const listado = mira('listar');
        assert.match(listado, /menos texto por slide$/m);
        assert.match(listado, /\[ativo\] densidade/);
        assert.match(mira('lembrancas', '--papel', 'capa'), /menos texto por slide/);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
