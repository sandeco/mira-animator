/* =====================================================================
   lib/memoria/consolidacao.js  ·  De evidência repetida a preferência
   ---------------------------------------------------------------------
   Lê o evidencia.jsonl, traduz em fichas (eixos.js) e decide o que já
   se repetiu o bastante para virar nota candidata.

   O limiar é o da spec: ≥3 episódios, em ≥3 decks distintos, em ≥2
   sessões. Existe para separar "corrigi um slide" de "eu gosto assim":
   se o gesto sobreviveu a três decks diferentes em dias diferentes, já
   não é a foto daquele slide, é o usuário.

   Nada aqui apaga evidência nem nota. Consolidar duas vezes não duplica:
   nota que já existe é atualizada no reforço, com o texto do usuário
   preservado (ele edita à mão, e a mão dele ganha da máquina).
   ===================================================================== */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MEMORY_DIR, lerNotas, criarNota, atualizarNota } from './notas.js';
import { fichasDoLog } from './eixos.js';

export const LIMIAR = { episodios: 3, decks: 3, sessoes: 2 };

/* gesto e contragesto: correção inversa em contexto equivalente é
   contraevidência, não um gosto novo (consolidacao-perfil RF-11) */
const INVERSOS = {
    'moveu para cima': 'moveu para baixo',
    'moveu para baixo': 'moveu para cima',
    'moveu para a esquerda': 'moveu para a direita',
    'moveu para a direita': 'moveu para a esquerda',
    'aumentou o elemento': 'diminuiu o elemento',
    'diminuiu o elemento': 'aumentou o elemento',
    'encurtou o texto': 'alongou o texto',
    'alongou o texto': 'encurtou o texto',
    'cortou a imagem': 'devolveu o corte',
    'devolveu o corte': 'cortou a imagem'
};

const FRASES = {
    cor: (c) => 'Você costuma ' + c + ' os textos',
    posicao: (c) => 'Você costuma ' + c + ' os elementos',
    tamanho: (c) => 'Você costuma ' + c,
    rotacao: () => 'Você costuma girar os elementos',
    texto: (c) => 'Você costuma ' + c,
    enquadramento: (c) => 'Você costuma ' + c,
    remocao: () => 'Você costuma remover elementos que o builder gera',
    duplicacao: () => 'Você costuma duplicar elementos'
};

function frase(eixo, classe, papel) {
    const base = (FRASES[eixo] || ((c) => 'Você costuma ' + c))(classe);
    if (!papel) return base + '.';
    const onde = papel === 'capa' ? 'Na capa' : papel === 'encerramento' ? 'No slide de encerramento' : 'Nos slides de conteúdo';
    return onde + ', ' + base.charAt(0).toLowerCase() + base.slice(1) + '.';
}

function contar(fichas, campo) {
    return new Set(fichas.map((f) => f[campo]).filter(Boolean)).size;
}

/* ---------- escopo por ganho preditivo (RF-03, RF-05) ----------
   `papel` só vira condição se a ação for mais frequente dentro dele do que
   no eixo inteiro. Campo que não prevê a ação não entra, e a condição mais
   curta ganha: sem ganho, a nota vale em qualquer papel.

   Hoje `papel` é o ÚNICO campo elegível derivável da evidência: o log não
   carrega tema nem formato. Quando a captura passar a carregar, o mesmo
   teste se aplica a eles (e aí entra a regra dos 30% para o 2º campo). */
export const GANHO_MINIMO = 0.15;
export const CONCENTRACAO_MINIMA = 0.6;

function escopoPorGanho(doGrupo, doEixo) {
    const total = doEixo.length;
    if (!total) return {};
    const shareGeral = doGrupo.length / total;

    const porPapel = {};
    for (const f of doGrupo) {
        const p = f.papel || 'indefinido';
        (porPapel[p] = porPapel[p] || []).push(f);
    }
    let melhor = null;
    for (const [papel, fichas] of Object.entries(porPapel)) {
        if (papel === 'indefinido') continue;
        const comparaveis = doEixo.filter((f) => f.papel === papel).length;
        if (!comparaveis) continue;
        const dentro = fichas.length / comparaveis;
        const ganho = dentro - shareGeral;
        /* Sem nenhum contraste (o gesto só foi visto num papel), o ganho dá
           zero por falta de comparação, não por o papel ser irrelevante.
           Nesse caso vale o que se observou: só vimos na capa, então vale
           para a capa. Errar para o lado estreito custa uma lembrança que
           não aparece; errar para o largo aplica gosto onde nunca se viu.
           Quando surgir evidência em outro papel, a condição cai sozinha. */
        const soNessePapel = fichas.length === doGrupo.length;
        if (dentro >= CONCENTRACAO_MINIMA && (ganho >= GANHO_MINIMO || soNessePapel)) {
            if (!melhor || ganho > melhor.ganho) melhor = { papel, ganho, fichas };
        }
    }
    return melhor ? { escopo: { papel: melhor.papel }, fichas: melhor.fichas, ganho: melhor.ganho }
        : { escopo: {}, fichas: doGrupo, ganho: 0 };
}

function confiancaPadrao(episodios, decks) {
    if (episodios >= 5 && decks >= 4) return 'alta';
    return 'media';
}

/* ---------- consolidação ---------- */
export function consolidar({ simular = false, agora } = {}) {
    const log = join(MEMORY_DIR, 'evidencia.jsonl');
    if (!existsSync(log)) {
        return { criadas: [], reforcadas: [], recusadas: [], erros: [], fichas: 0 };
    }
    const { fichas, erros } = fichasDoLog(readFileSync(log, 'utf8'));

    /* coesão semântica do v1, sem vetor: mesmo eixo e mesma classe de ação */
    const grupos = new Map();
    for (const f of fichas) {
        const chave = f.eixo + '|' + f.classe;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(f);
    }

    const { notas } = lerNotas();
    const criadas = [], reforcadas = [], recusadas = [];

    for (const [chave, doGrupo] of grupos) {
        const [eixo, classe] = chave.split('|');
        const doEixo = fichas.filter((f) => f.eixo === eixo);

        const { escopo, fichas: fichasEscopo } = escopoPorGanho(doGrupo, doEixo);
        const episodios = contar(fichasEscopo, 'episodio');
        const decks = contar(fichasEscopo, 'deck');
        const sessoes = contar(fichasEscopo, 'sessao');

        const motivo = [];
        if (episodios < LIMIAR.episodios) motivo.push(episodios + ' episódio(s), precisa de ' + LIMIAR.episodios);
        if (decks < LIMIAR.decks) motivo.push(decks + ' deck(s) distintos, precisa de ' + LIMIAR.decks);
        if (sessoes < LIMIAR.sessoes) motivo.push(sessoes + ' sessão(ões), precisa de ' + LIMIAR.sessoes);

        /* mais suporte que contradição (RF-02): o contragesto no mesmo
           escopo derruba o padrão em vez de virar nota separada */
        const inverso = INVERSOS[classe];
        let contra = 0;
        if (inverso) {
            const doContra = (grupos.get(eixo + '|' + inverso) || [])
                .filter((f) => !escopo.papel || f.papel === escopo.papel);
            contra = contar(doContra, 'episodio');
            if (contra >= episodios) motivo.push('contraevidência empata ou ganha (' + contra + ' vs ' + episodios + ')');
        }

        if (motivo.length) {
            recusadas.push({ eixo, classe, escopo, episodios, decks, sessoes, contra, motivo });
            continue;
        }

        const existente = notas.find((n) =>
            n.eixo === eixo && n.acao === classe && (n.escopo.papel || '') === (escopo.papel || ''));

        if (existente) {
            /* o texto e o estado são do usuário; a máquina só atualiza a
               contagem e a confiança que ela mesma calcula */
            if (existente.reforcos !== episodios || existente.confianca_padrao !== confiancaPadrao(episodios, decks)) {
                if (!simular) {
                    atualizarNota(existente.arquivo, {
                        reforcos: episodios,
                        confianca_padrao: confiancaPadrao(episodios, decks)
                    });
                }
                reforcadas.push({ arquivo: existente.arquivo, eixo, classe, escopo, episodios, decks, sessoes });
            }
            continue;
        }

        const nota = {
            texto: frase(eixo, classe, escopo.papel),
            eixo, escopo, acao: classe, fonte: 'edicao', estado: 'candidato',
            confianca_padrao: confiancaPadrao(episodios, decks), reforcos: episodios, agora
        };
        if (!simular) {
            const r = criarNota(nota);
            criadas.push({ arquivo: r.arquivo, ...nota, decks, sessoes });
        } else {
            criadas.push({ arquivo: '(simulado)', ...nota, decks, sessoes });
        }
    }

    return { criadas, reforcadas, recusadas, erros, fichas: fichas.length };
}
