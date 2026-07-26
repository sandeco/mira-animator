/* =====================================================================
   memoria-consolidacao.test.mjs
   ---------------------------------------------------------------------
   Tradutor de eixos e consolidador (memória semântica, slice 3).
   O ciclo inteiro: evidência crua → ficha canônica → nota candidata →
   ativada → aplicada na geração.

   Rodar:  node --test tests/memoria-consolidacao.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* cada teste em memória própria: consolidar lê o log inteiro, então um
   log compartilhado faria um teste enxergar a evidência do outro */
function memoria() {
    const dir = mkdtempSync(join(tmpdir(), 'mira-cons-'));
    return {
        dir,
        env: (extra = {}) => ({ ...process.env, MIRA_MEMORY_DIR: dir, ...extra }),
        mira: (...args) => execFileSync(process.execPath, [join(RAIZ, 'bin/mira.js'), 'memoria', ...args],
            { env: { ...process.env, MIRA_MEMORY_DIR: dir }, encoding: 'utf8' }),
        gravar: (linhas) => writeFileSync(join(dir, 'evidencia.jsonl'),
            linhas.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8'),
        limpar: () => rmSync(dir, { recursive: true, force: true })
    };
}

/* um Salvar que moveu um elemento para cima no slide `slide` */
function subiu(episodio, deck, dia, slide = 0, total = 5, dy = -40) {
    return {
        schema: 'delta-cru-v1', id: episodio + '-0', episodio, ts: dia + 'T10:00:00.000Z',
        fonte: 'edicao', deck, titulo: 'x', slides_total: total,
        op_id: 'me-' + slide + '-3', slide, tipo: 'alterado',
        antes: { ty: 0 }, depois: { ty: dy }
    };
}

/* ---------- tradutor ---------- */
const { fichasDaLinha, papelDoSlide, fichaCanonica } = await import('../lib/memoria/eixos.js');

test('ordinal vira papel, nunca condição crua', () => {
    assert.equal(papelDoSlide(0, 5), 'capa');
    assert.equal(papelDoSlide(4, 5), 'encerramento');
    assert.equal(papelDoSlide(2, 5), 'conteudo');
    /* sem o total não dá para saber quem é o último: o honesto é conteudo */
    assert.equal(papelDoSlide(4, null), 'conteudo');
});

test('um delta que mexeu em dois eixos vira duas fichas', () => {
    const fichas = fichasDaLinha({
        id: 'a-0', episodio: 'a', ts: '2026-07-01T10:00:00Z', deck: 'd1', slide: 1, slides_total: 4,
        tipo: 'alterado', antes: { ty: 0, sx: 1, sy: 1 }, depois: { ty: -30, sx: 1.4, sy: 1.4 }
    });
    assert.deepEqual(fichas.map((f) => f.eixo).sort(), ['posicao', 'tamanho']);
    assert.equal(fichas.find((f) => f.eixo === 'posicao').classe, 'moveu para cima');
    assert.equal(fichas.find((f) => f.eixo === 'tamanho').classe, 'aumentou o elemento');
});

test('encurtar texto é classe própria, separada de reescrever', () => {
    const curto = fichasDaLinha({ tipo: 'alterado', slide: 1, slides_total: 3, ts: '2026-07-01T10:00:00Z', deck: 'd', episodio: 'e', antes: { text: 'a'.repeat(100) }, depois: { text: 'a'.repeat(20) } });
    const outro = fichasDaLinha({ tipo: 'alterado', slide: 1, slides_total: 3, ts: '2026-07-01T10:00:00Z', deck: 'd', episodio: 'e', antes: { text: 'a'.repeat(100) }, depois: { text: 'b'.repeat(95) } });
    assert.equal(curto[0].classe, 'encurtou o texto');
    assert.equal(outro[0].classe, 'reescreveu o texto');
});

test('ficha canônica é determinística e sem HTML', () => {
    const linha = { tipo: 'alterado', slide: 0, slides_total: 3, ts: '2026-07-01T10:00:00Z', deck: 'd', episodio: 'e', antes: {}, depois: { html: '<b>oi</b> <i>tudo</i>' } };
    const um = fichasDaLinha(linha)[0].ficha_canonica;
    const dois = fichasDaLinha(linha)[0].ficha_canonica;
    assert.equal(um, dois);
    assert.doesNotMatch(um, /</);
    assert.equal(fichaCanonica({ eixo: 'posicao', papel: 'capa', classe: 'moveu para cima', detalhe: 'dx=0 dy=-40' }),
        'eixo=posicao | papel=capa | acao=moveu para cima | delta=dx=0 dy=-40');
});

/* ---------- limiar ---------- */
test('duas repetições não viram nota; a terceira em deck novo vira', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02')]);
        let saida = m.mira('consolidar');
        assert.match(saida, /abaixo do limiar/);
        assert.doesNotMatch(saida, /\[candidato\]/);

        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03')]);
        saida = m.mira('consolidar');
        assert.match(saida, /\[candidato\] posicao/);
    } finally { m.limpar(); }
});

test('três episódios no MESMO deck não bastam', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd1', '2026-07-02'), subiu('e3', 'd1', '2026-07-03')]);
        assert.match(m.mira('consolidar'), /deck\(s\) distintos/);
    } finally { m.limpar(); }
});

test('tudo no mesmo dia não basta: precisa de 2 sessões', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-01'), subiu('e3', 'd3', '2026-07-01')]);
        assert.match(m.mira('consolidar'), /sess/);
    } finally { m.limpar(); }
});

test('contragesto empatando derruba o padrão', () => {
    const m = memoria();
    try {
        m.gravar([
            subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03'),
            subiu('e4', 'd4', '2026-07-04', 0, 5, 40), subiu('e5', 'd5', '2026-07-05', 0, 5, 40),
            subiu('e6', 'd6', '2026-07-06', 0, 5, 40)
        ]);
        assert.match(m.mira('consolidar'), /contraevid/);
    } finally { m.limpar(); }
});

test('escopo entra só quando o papel prevê a ação', () => {
    const m = memoria();
    try {
        /* só na capa: papel concentra a ação, então vira condição */
        m.gravar([subiu('e1', 'd1', '2026-07-01', 0), subiu('e2', 'd2', '2026-07-02', 0), subiu('e3', 'd3', '2026-07-03', 0)]);
        assert.match(m.mira('consolidar'), /papel=capa/);
    } finally { m.limpar(); }
});

test('espalhado por todos os papéis, a nota fica geral (condição mais curta)', () => {
    const m = memoria();
    try {
        m.gravar([
            subiu('e1', 'd1', '2026-07-01', 0), subiu('e2', 'd2', '2026-07-02', 2),
            subiu('e3', 'd3', '2026-07-03', 4), subiu('e4', 'd4', '2026-07-04', 2)
        ]);
        const saida = m.mira('consolidar');
        assert.match(saida, /\[candidato\] posicao \(geral\)/);
    } finally { m.limpar(); }
});

/* ---------- idempotência e estado ---------- */
test('consolidar duas vezes não duplica nota', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03')]);
        m.mira('consolidar');
        const primeira = m.mira('listar').match(/\.md/g).length;
        m.mira('consolidar');
        assert.equal(m.mira('listar').match(/\.md/g).length, primeira);
    } finally { m.limpar(); }
});

test('reforço atualiza a contagem sem tocar no texto do usuário', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03')]);
        m.mira('consolidar');
        const arquivo = m.mira('listar').match(/([\w-]+\.md)/)[1];
        const caminho = join(m.dir, 'notas', arquivo);
        const original = readFileSync(caminho, 'utf8');
        writeFileSync(caminho, original.replace(/\n\n[\s\S]*$/, '\n\nTexto que eu escrevi na mão.\n'), 'utf8');

        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'),
        subiu('e3', 'd3', '2026-07-03'), subiu('e4', 'd4', '2026-07-04'), subiu('e5', 'd5', '2026-07-05')]);
        m.mira('consolidar');
        const depois = readFileSync(caminho, 'utf8');
        assert.match(depois, /Texto que eu escrevi na mão\./, 'a mão do usuário ganha da máquina');
        assert.match(depois, /reforcos: 5/);
    } finally { m.limpar(); }
});

test('candidata não é aplicada; ativar é ato separado', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03')]);
        m.mira('consolidar');
        const arquivo = m.mira('listar').match(/([\w-]+\.md)/)[1];
        assert.doesNotMatch(m.mira('lembrancas', '--papel', 'capa'), /costuma mover/i);

        m.mira('estado', arquivo, 'ativo');
        assert.match(m.mira('lembrancas', '--papel', 'capa'), /moveu para cima|mover para cima/i);

        /* revogar é estado, não delete: some do pacote, o arquivo fica */
        m.mira('estado', arquivo, 'revogado');
        assert.doesNotMatch(m.mira('lembrancas', '--papel', 'capa'), /moveu para cima/i);
        assert.ok(existsSync(join(m.dir, 'notas', arquivo)));
    } finally { m.limpar(); }
});

test('--simular não grava nada', () => {
    const m = memoria();
    try {
        m.gravar([subiu('e1', 'd1', '2026-07-01'), subiu('e2', 'd2', '2026-07-02'), subiu('e3', 'd3', '2026-07-03')]);
        assert.match(m.mira('consolidar', '--simular'), /simula/);
        assert.match(m.mira('listar'), /Nenhuma nota/);
    } finally { m.limpar(); }
});

test('proveniência sobrevive à geração, e FORA do deck', () => {
    const m = memoria();
    try {
        m.mira('nota', 'na capa o título fica em cima', '--eixo', 'posicao', '--papel', 'capa');
        /* --registro é o slug do deck, não um caminho: o pacote tem o perfil
           do usuário e deck publicado é drop-and-run, subiria junto */
        m.mira('lembrancas', '--papel', 'capa', '--registro', 'meu-deck');
        const destino = join(m.dir, 'proveniencia', 'meu-deck.md');
        assert.ok(existsSync(destino), 'gravou na pasta de memória');
        assert.match(readFileSync(destino, 'utf8'), /na capa o título fica em cima/);

        /* apenda com carimbo: deck regerado acumula blocos identificáveis */
        m.mira('lembrancas', '--papel', 'conteudo', '--registro', 'meu-deck');
        const dois = readFileSync(destino, 'utf8');
        assert.match(dois, /papel=capa/);
        assert.match(dois, /papel=conteudo/);
        assert.equal((dois.match(/<!-- \d{4}-/g) || []).length, 2, 'um carimbo por build');
    } finally { m.limpar(); }
});

test('--registro não escapa da pasta de memória nem com caminho', () => {
    const m = memoria();
    try {
        m.mira('nota', 'x', '--eixo', 'cor');
        m.mira('lembrancas', '--registro', '../../fora/deck.md');
        assert.ok(!existsSync(join(m.dir, '..', '..', 'fora')), 'não saiu da pasta');
        const gravados = readdirSync(join(m.dir, 'proveniencia'));
        assert.equal(gravados.length, 1);
        assert.doesNotMatch(gravados[0], /[/\\]/, 'nome achatado, sem separador de caminho');
    } finally { m.limpar(); }
});

/* ---------- eixo cor (existe desde que o editor livre ganhou o seletor) ---------- */
test('troca de cor vira ficha do eixo cor, pela cor final', () => {
    const fichas = fichasDaLinha({
        id: 'a-0', episodio: 'a', ts: '2026-07-01T10:00:00Z', deck: 'd1', slide: 0, slides_total: 4,
        tipo: 'alterado', antes: {}, depois: { cor: '#FF904D' }
    });
    assert.equal(fichas.length, 1);
    assert.equal(fichas[0].eixo, 'cor');
    /* a classe é a cor final: três laranjas somam, três cores diferentes não */
    assert.equal(fichas[0].classe, 'pintou de #ff904d');
});

test('cor repetida em três decks vira nota candidata', () => {
    const m = memoria();
    try {
        const pintou = (ep, deck, dia) => ({
            schema: 'delta-cru-v1', id: ep + '-0', episodio: ep, ts: dia + 'T10:00:00.000Z',
            fonte: 'edicao', deck, titulo: 'x', slides_total: 5,
            op_id: 'me-0-1', slide: 0, tipo: 'alterado', antes: {}, depois: { cor: '#ff904d' }
        });
        m.gravar([pintou('e1', 'd1', '2026-07-01'), pintou('e2', 'd2', '2026-07-02'), pintou('e3', 'd3', '2026-07-03')]);
        assert.match(m.mira('consolidar'), /\[candidato\] cor/);
    } finally { m.limpar(); }
});

test('baseCor é bookkeeping: não vira evidência', () => {
    const src = readFileSync(join(RAIZ, 'templates/authoring/mira-edit.js'), 'utf8');
    const a = src.indexOf('/* --- delta de evidência: bloco puro (sem DOM) --- */');
    const b = src.indexOf('/* --- fim do bloco puro --- */');
    const { prefsDelta } = new Function(src.slice(a, b) + '; return { prefsDelta };')();
    const deck = (ops) => '<html><body><script id="mira-free-edits" type="application/json">' +
        JSON.stringify({ v: 1, ops }) + '</script></body></html>';
    assert.deepEqual(
        prefsDelta(deck([{ id: 'me-0-1', cor: '#ff904d', baseCor: '' }]),
            deck([{ id: 'me-0-1', cor: '#ff904d', baseCor: 'rgb(255,255,255)' }])),
        []
    );
});

/* ---------- seletor de cor: gesto que volta ao início não é episódio ----------
   O log de evidência é append-only. Um 'change' que fecha no mesmo valor em
   que abriu não pode marcar dirty nem empilhar undo, senão vira uma
   preferência inventada que não sai mais. */
function editorDeCor() {
    const src = readFileSync(join(RAIZ, 'templates/authoring/mira-edit-free.js'), 'utf8');
    const a = src.indexOf('/* --- bloco da cor (testado em Node com stubs) --- */');
    const b = src.indexOf('/* --- fim do bloco da cor --- */');
    assert.ok(a !== -1 && b > a, 'marcadores do bloco da cor');

    const estado = { ops: {}, hist: [], dirty: 0 };
    const fabrica = new Function('ctx', `
        var sel = ctx.sel;
        var getOp = ctx.getOp, pushHist = ctx.pushHist, markDirty = ctx.markDirty;
        var reselect = ctx.reselect, getComputedStyle = ctx.getComputedStyle;
        ${src.slice(a, b)}
        return { setCor: setCor, iniciarGestoCor: iniciarGestoCor,
                 setSel: function (s) { sel = s; } };
    `);
    const api = fabrica({
        sel: null,
        getOp: (id, criar) => estado.ops[id] || (criar ? (estado.ops[id] = { id }) : null),
        pushHist: (fn) => estado.hist.push(fn),
        markDirty: () => { estado.dirty++; },
        reselect: () => { },
        getComputedStyle: () => ({ color: 'rgb(255,255,255)' })
    });
    const el = { dataset: { meId: 'me-0-1' }, style: {} };
    api.setSel(el);
    return { api, estado, el };
}

test('cor: arrastar e voltar ao ponto de partida não grava nada', () => {
    const { api, estado } = editorDeCor();
    api.iniciarGestoCor();
    api.setCor('#ff0000', false);   // arrastando
    api.setCor('#00ff00', false);   // arrastando
    api.setCor('#ffffff', false);   // voltou ao inicial (op.cor era undefined)
    api.setCor('#ffffff', true);    // change
    assert.equal(estado.dirty, 0, 'não marcou sujo');
    assert.equal(estado.hist.length, 0, 'não empilhou undo');
    assert.equal(estado.ops['me-0-1'].cor, undefined, 'não deixou op de cor');
});

test('cor: undo volta para a cor de ANTES do gesto, não para a do meio do arraste', () => {
    const { api, estado, el } = editorDeCor();
    api.iniciarGestoCor();
    api.setCor('#111111', false);
    api.setCor('#222222', false);
    api.setCor('#ff904d', true);
    assert.equal(estado.ops['me-0-1'].cor, '#ff904d');
    assert.equal(estado.dirty, 1);

    estado.hist.pop()();
    assert.equal(estado.ops['me-0-1'].cor, undefined, 'voltou ao estado original, não a #222222');
    assert.equal(el.style.color, '');
});

test('cor: segundo gesto desfaz para a cor do primeiro', () => {
    const { api, estado } = editorDeCor();
    api.iniciarGestoCor();
    api.setCor('#ff904d', true);
    api.iniciarGestoCor();
    api.setCor('#3333ff', false);
    api.setCor('#3333ff', true);
    assert.equal(estado.ops['me-0-1'].cor, '#3333ff');
    estado.hist.pop()();
    assert.equal(estado.ops['me-0-1'].cor, '#ff904d');
});
