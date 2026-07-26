/* =====================================================================
   lib/memoria/notas.js  ·  Notas de preferência do Mira
   ---------------------------------------------------------------------
   Uma nota é um markdown legível e editável na mão (o usuário abre,
   corrige e revoga no editor dele). O frontmatter carrega eixo, escopo,
   estado e as duas confianças; o corpo é a frase em português.

   Mora em MIRA_MEMORY_DIR/notas/, o mesmo diretório do evidencia.jsonl
   que os servidores de autoria alimentam. Fora do deck, sempre: deck
   publicado é drop-and-run e levaria o perfil do usuário junto.

   Este módulo é o único que lê e escreve nota. Os servidores continuam
   burros, só apendam evidência.
   ===================================================================== */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const MEMORY_DIR = process.env.MIRA_MEMORY_DIR || join(homedir(), '.mira-memory');
export const NOTAS_DIR = join(MEMORY_DIR, 'notas');

/* estados possíveis de uma preferência (consolidacao-perfil RF-08):
   observado → candidato → ativo → suspenso → revogado. Só ativo entra
   no pacote; reversão é estado, nunca delete. */
export const ESTADOS = ['observado', 'candidato', 'ativo', 'suspenso', 'revogado'];

/* campos de escopo elegíveis: vocabulário de design, nunca acidente
   (id de deck, data, ordinal de slide) — consolidacao-perfil RF-04 */
export const CAMPOS_ESCOPO = ['papel', 'tipo_slide', 'tema', 'formato', 'relacao_texto_imagem'];

/* ---------- frontmatter: subconjunto mínimo de YAML, sem dependência ----------
   chave: valor
   escopo:
     papel: capa
   Nota malformada é PULADA com aviso, nunca derruba a leitura: o arquivo
   é editado à mão, quebrar é o caso esperado. */
function parseFrontmatter(texto, arquivo, avisos) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texto);
    if (!m) { avisos.push(arquivo + ': sem frontmatter, ignorada'); return null; }
    const dados = {};
    let bloco = null;
    for (const bruta of m[1].split(/\r?\n/)) {
        if (!bruta.trim() || bruta.trim().startsWith('#')) continue;
        const par = /^(\s*)([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(bruta);
        if (!par) { avisos.push(arquivo + ': linha ininteligível no frontmatter: ' + bruta.trim()); continue; }
        const [, espaco, chave, valorBruto] = par;
        const valor = valorBruto.trim().replace(/^["']|["']$/g, '');
        if (espaco.length > 0) {
            if (!bloco) { avisos.push(arquivo + ': ' + chave + ' indentado sem bloco pai'); continue; }
            dados[bloco][chave] = valor;
        } else if (valor === '') {
            bloco = chave; dados[chave] = {};
        } else {
            bloco = null; dados[chave] = valor;
        }
    }
    return { dados, corpo: m[2].trim() };
}

function serializarFrontmatter(dados) {
    const linhas = [];
    for (const [chave, valor] of Object.entries(dados)) {
        if (valor === null || valor === undefined || valor === '') continue;
        if (typeof valor === 'object') {
            const filhos = Object.entries(valor).filter(([, v]) => v !== null && v !== undefined && v !== '');
            if (!filhos.length) continue;
            linhas.push(chave + ':');
            for (const [k, v] of filhos) linhas.push('  ' + k + ': ' + v);
        } else {
            linhas.push(chave + ': ' + valor);
        }
    }
    return linhas.join('\n');
}

/* ---------- leitura ---------- */
export function lerNotas() {
    const avisos = [];
    if (!existsSync(NOTAS_DIR)) return { notas: [], avisos };
    const notas = [];
    for (const arquivo of readdirSync(NOTAS_DIR).filter(f => f.endsWith('.md')).sort()) {
        let texto;
        try { texto = readFileSync(join(NOTAS_DIR, arquivo), 'utf8'); }
        catch (e) { avisos.push(arquivo + ': não consegui ler (' + e.message + ')'); continue; }
        const lido = parseFrontmatter(texto, arquivo, avisos);
        if (!lido) continue;
        const { dados, corpo } = lido;
        if (!corpo) { avisos.push(arquivo + ': sem texto no corpo, ignorada'); continue; }
        const estado = String(dados.estado || '').toLowerCase();
        if (!ESTADOS.includes(estado)) {
            avisos.push(arquivo + ': estado "' + (dados.estado || '(vazio)') + '" desconhecido, ignorada');
            continue;
        }
        notas.push({
            arquivo,
            eixo: String(dados.eixo || 'indefinido').toLowerCase(),
            /* classe da ação que originou a nota; é por ela que a
               consolidação reconhece a própria nota e reforça em vez de
               criar uma segunda igual */
            acao: dados.acao ? String(dados.acao) : '',
            escopo: dados.escopo && typeof dados.escopo === 'object' ? dados.escopo : {},
            estado,
            fonte: String(dados.fonte || 'ordem'),
            confianca_padrao: String(dados.confianca_padrao || 'media').toLowerCase(),
            confianca_causa: String(dados.confianca_causa || 'baixa').toLowerCase(),
            reforcos: Number(dados.reforcos || 0) || 0,
            criada_em: dados.criada_em || '',
            texto: corpo
        });
    }
    return { notas, avisos };
}

/* ---------- filtro estruturado (recuperacao-aplicacao RF-02) ----------
   v1 não tem ranker: eixo, papel e formato batem ou não batem. O vetor
   entra quando o volume pedir. Campo que a nota exige e o contexto não
   traz não é "compatível por omissão": vira ignorada com motivo, que é o
   que a proveniência (RF-09) precisa registrar. */
export function selecionar(notas, contexto = {}, opcoes = {}) {
    const teto = opcoes.teto || 6;
    const ctx = {};
    for (const [k, v] of Object.entries(contexto)) if (v) ctx[k] = String(v).toLowerCase();

    const aplicadas = [], ignoradas = [];
    for (const nota of notas) {
        if (nota.estado !== 'ativo') {
            ignoradas.push({ nota, motivo: 'estado ' + nota.estado });
            continue;
        }
        if (ctx.eixo && nota.eixo !== ctx.eixo) {
            ignoradas.push({ nota, motivo: 'eixo ' + nota.eixo + ' fora da consulta' });
            continue;
        }
        let conflito = null;
        for (const [campo, esperado] of Object.entries(nota.escopo)) {
            const atual = ctx[campo];
            if (atual === undefined) { conflito = 'contexto não informou ' + campo; break; }
            if (atual !== String(esperado).toLowerCase()) {
                conflito = campo + '=' + atual + ' não bate com ' + esperado; break;
            }
        }
        if (conflito) { ignoradas.push({ nota, motivo: conflito }); continue; }
        aplicadas.push(nota);
    }

    /* uma nota por eixo+papel (RF-03): sem ranker, a mais reforçada ganha
       e o empate fica com a mais antiga, que é determinístico */
    aplicadas.sort((a, b) => b.reforcos - a.reforcos || a.arquivo.localeCompare(b.arquivo));
    const vistos = new Set(), escolhidas = [];
    for (const nota of aplicadas) {
        const chave = nota.eixo + '|' + (nota.escopo.papel || '*');
        if (vistos.has(chave)) { ignoradas.push({ nota, motivo: 'já há nota para ' + chave }); continue; }
        vistos.add(chave);
        escolhidas.push(nota);
    }
    /* teto do pacote (RF-04). Sem ranker, "quais 6" é arbitrário quando
       sobra mais que isso: corta e DIZ o que cortou, nunca em silêncio. */
    const cortadas = escolhidas.slice(teto);
    for (const nota of cortadas) ignoradas.push({ nota, motivo: 'acima do teto de ' + teto + ' lembranças' });
    return { aplicadas: escolhidas.slice(0, teto), ignoradas };
}

/* ---------- pacote legível (RF-05: texto, nunca embedding) ---------- */
export function formatarPacote({ aplicadas, ignoradas }, contexto = {}) {
    const ctx = Object.entries(contexto).filter(([, v]) => v).map(([k, v]) => k + '=' + v).join(', ');
    const linhas = [];
    linhas.push('# Lembranças do Mira' + (ctx ? ' (' + ctx + ')' : ''));
    linhas.push('');
    if (!aplicadas.length) {
        linhas.push('Nenhuma lembrança se aplica a esta situação. Gere pelo padrão do Mira.');
    } else {
        linhas.push('Orientações do gosto do usuário. A marca (#FF904D, capa, área segura) manda acima disto.');
        linhas.push('');
        for (const nota of aplicadas) {
            const escopo = Object.entries(nota.escopo).map(([k, v]) => k + '=' + v).join(', ') || 'geral';
            linhas.push('- **' + nota.eixo + '** (' + escopo + '): ' + nota.texto.split(/\r?\n/)[0]);
            linhas.push('  confiança do padrão: ' + nota.confianca_padrao +
                ' · reforços: ' + nota.reforcos + ' · fonte: ' + nota.fonte + ' · ' + nota.arquivo);
        }
    }
    if (ignoradas.length) {
        linhas.push('');
        linhas.push('Ignoradas nesta consulta:');
        for (const { nota, motivo } of ignoradas) linhas.push('- ' + nota.arquivo + ': ' + motivo);
    }
    return linhas.join('\n');
}

/* ---------- escrita ----------
   Ordem explícita do usuário entra ATIVA na hora (consolidacao-perfil
   RF-09); o que vier de delta implícito, quando o consolidador existir,
   entra como candidato. */
export function criarNota({ texto, eixo = 'indefinido', escopo = {}, fonte = 'ordem', estado,
    acao = '', confianca_padrao, reforcos, agora }) {
    if (!texto || !texto.trim()) throw new Error('a nota precisa de um texto');
    const estadoFinal = estado || (fonte === 'ordem' ? 'ativo' : 'candidato');
    if (!ESTADOS.includes(estadoFinal)) throw new Error('estado inválido: ' + estadoFinal);
    const data = agora || new Date().toISOString();

    const escopoLimpo = {};
    for (const [campo, valor] of Object.entries(escopo)) {
        if (!valor) continue;
        if (!CAMPOS_ESCOPO.includes(campo)) throw new Error('campo de escopo não elegível: ' + campo);
        escopoLimpo[campo] = String(valor).toLowerCase();
    }

    const base = slug(eixo + '-' + (escopoLimpo.papel || 'geral') + '-' + texto);
    mkdirSync(NOTAS_DIR, { recursive: true });
    let arquivo = base + '.md', n = 2;
    while (existsSync(join(NOTAS_DIR, arquivo))) arquivo = base + '-' + (n++) + '.md';

    const frontmatter = serializarFrontmatter({
        eixo: String(eixo).toLowerCase(),
        acao,
        escopo: escopoLimpo,
        estado: estadoFinal,
        fonte,
        /* ordem explícita é forte no padrão; a causa continua hipótese
           até o usuário dizer o porquê (RF-07), então nunca sobe sozinha */
        confianca_padrao: confianca_padrao || (fonte === 'ordem' ? 'alta' : 'media'),
        confianca_causa: 'baixa',
        reforcos: reforcos != null ? reforcos : (fonte === 'ordem' ? 1 : 0),
        criada_em: data
    });
    const caminho = join(NOTAS_DIR, arquivo);
    writeFileSync(caminho, '---\n' + frontmatter + '\n---\n\n' + texto.trim() + '\n', 'utf8');
    return { arquivo, caminho, estado: estadoFinal };
}

/* ---------- atualização em cima de arquivo editado à mão ----------
   Reescreve SÓ os campos pedidos do frontmatter e devolve o corpo intacto.
   O texto da nota é do usuário; a máquina mexe em contagem e confiança.
   Mudança de estado é a reversão da RF-08: suspender e revogar são estado,
   nunca delete, e por isso passam por aqui também. */
export function atualizarNota(arquivo, campos) {
    const caminho = join(NOTAS_DIR, arquivo);
    if (!existsSync(caminho)) throw new Error('nota não encontrada: ' + arquivo);
    const avisos = [];
    const lido = parseFrontmatter(readFileSync(caminho, 'utf8'), arquivo, avisos);
    if (!lido) throw new Error('nota sem frontmatter válido: ' + arquivo);
    if (campos.estado && !ESTADOS.includes(campos.estado)) throw new Error('estado inválido: ' + campos.estado);

    const dados = { ...lido.dados };
    for (const [chave, valor] of Object.entries(campos)) {
        if (valor === undefined) continue;
        dados[chave] = valor;
    }
    dados.atualizada_em = campos.agora || new Date().toISOString();
    delete dados.agora;
    writeFileSync(caminho, '---\n' + serializarFrontmatter(dados) + '\n---\n\n' + lido.corpo + '\n', 'utf8');
    return { arquivo, caminho, estado: String(dados.estado || '') };
}

function slug(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'nota';
}
