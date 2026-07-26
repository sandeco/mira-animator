/* =====================================================================
   lib/memoria/eixos.js  ·  Tradutor de evidência crua em ficha canônica
   ---------------------------------------------------------------------
   O log de evidência guarda delta ESTRUTURADO CRU (`tx: 40`, `text: "..."`),
   que é fiel mas mudo: ninguém sabe que aquilo é "eixo=posicao". Este
   módulo faz a tradução, e é ele que responde a OQ-01 (lista de eixos e
   vocabulário) do jeito que dá para verificar: derivando do que o editor
   livre realmente sabe mexer, não de uma lista inventada.

   Uma linha de evidência pode virar VÁRIAS fichas: quem moveu e redimensionou
   no mesmo elemento mexeu em dois eixos (captura RF-01, por eixo).

   A ficha é determinística: mesma entrada, mesma string, sempre. É ela que
   um dia vai para o índice vetorial, nunca o HTML cru (captura RF-06, NG-03).
   ===================================================================== */

/* Eixos do MVP. Cada um é um campo que o mira-edit-free sabe produzir; a
   exceção declarada é `cor`, que não existe no editor ainda (é corte de
   escopo consciente, não esquecimento). */
export const EIXOS = ['cor', 'posicao', 'tamanho', 'rotacao', 'texto', 'enquadramento', 'remocao', 'duplicacao'];

/* ordinal é acidente, papel é vocabulário de design (captura RF-07).
   Sem o total de slides não dá para saber quem é o último: aí o que não é
   capa fica como conteudo, que é a leitura honesta do que se sabe. */
export function papelDoSlide(slide, total) {
    if (slide === null || slide === undefined || !Number.isFinite(slide)) return null;
    if (slide === 0) return 'capa';
    if (Number.isFinite(total) && total > 1 && slide === total - 1) return 'encerramento';
    return 'conteudo';
}

function num(v) { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }
function texto(op) {
    if (!op) return '';
    if (typeof op.text === 'string') return op.text;
    if (typeof op.html === 'string') return op.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return '';
}

/* classe da ação: a DIREÇÃO do gesto, sem a magnitude. É por ela que a
   consolidação agrupa, senão "moveu 38px" e "moveu 41px" nunca se somariam. */
function acoesDe(antes, depois, tipo) {
    if (tipo === 'removido') return [];   // op que sumiu do bloco é desfazer, não gesto novo
    const a = antes || {}, d = depois || {};
    const acoes = [];

    if (d.deleted && !a.deleted) acoes.push({ eixo: 'remocao', classe: 'removeu o elemento', detalhe: '' });
    if (d.dupOf && !a.dupOf) acoes.push({ eixo: 'duplicacao', classe: 'duplicou o elemento', detalhe: '' });

    /* a classe é a cor final, não "trocou a cor": trocar para laranja três
       vezes é um gosto, trocar para três cores diferentes não é */
    if (d.cor && d.cor !== a.cor) {
        acoes.push({ eixo: 'cor', classe: 'pintou de ' + String(d.cor).toLowerCase(), detalhe: (a.cor || 'padrão') + '->' + d.cor });
    }

    const dx = num(d.tx) - num(a.tx), dy = num(d.ty) - num(a.ty);
    if (dx || dy) {
        const partes = [];
        if (dy) partes.push(dy < 0 ? 'para cima' : 'para baixo');
        if (dx) partes.push(dx < 0 ? 'para a esquerda' : 'para a direita');
        acoes.push({
            eixo: 'posicao', classe: 'moveu ' + partes.join(' e '),
            detalhe: 'dx=' + Math.round(dx) + ' dy=' + Math.round(dy)
        });
    }

    const sxA = a.sx == null ? 1 : a.sx, syA = a.sy == null ? 1 : a.sy;
    const sxD = d.sx == null ? 1 : d.sx, syD = d.sy == null ? 1 : d.sy;
    const escalaA = (sxA + syA) / 2, escalaD = (sxD + syD) / 2;
    if (Math.abs(escalaD - escalaA) > 0.001) {
        acoes.push({
            eixo: 'tamanho', classe: escalaD > escalaA ? 'aumentou o elemento' : 'diminuiu o elemento',
            detalhe: 'escala=' + escalaA.toFixed(2) + '->' + escalaD.toFixed(2)
        });
    }

    const rot = num(d.rot) - num(a.rot);
    if (Math.abs(rot) > 0.001) {
        acoes.push({ eixo: 'rotacao', classe: 'girou o elemento', detalhe: 'graus=' + Math.round(rot) });
    }

    const tA = texto(a), tD = texto(d);
    if (tA !== tD && (tA || tD)) {
        /* encurtar é o gesto de densidade que mais se repete; separar isso de
           "reescreveu" é o que permite virar uma preferência de densidade */
        let classe = 'reescreveu o texto';
        if (tD.length && tA.length && tD.length <= tA.length * 0.7) classe = 'encurtou o texto';
        else if (tA.length && tD.length >= tA.length * 1.3) classe = 'alongou o texto';
        else if (!tA.length) classe = 'escreveu o texto';
        acoes.push({ eixo: 'texto', classe: classe, detalhe: 'chars=' + tA.length + '->' + tD.length });
    }

    const cropA = num(a.cropT) + num(a.cropR) + num(a.cropB) + num(a.cropL);
    const cropD = num(d.cropT) + num(d.cropR) + num(d.cropB) + num(d.cropL);
    if (Math.abs(cropD - cropA) > 0.001) {
        acoes.push({
            eixo: 'enquadramento', classe: cropD > cropA ? 'cortou a imagem' : 'devolveu o corte',
            detalhe: 'corte=' + Math.round(cropA) + '->' + Math.round(cropD)
        });
    }
    return acoes;
}

/* ---------- ficha canônica (RF-06) ----------
   Campos em ordem fixa, sem tag, sem HTML, sem id de deck, sem data: só o
   que pode virar vocabulário. Roda duas vezes, sai igual. */
export function fichaCanonica({ eixo, papel, classe, detalhe }) {
    const campos = [
        'eixo=' + eixo,
        'papel=' + (papel || 'indefinido'),
        'acao=' + classe
    ];
    if (detalhe) campos.push('delta=' + detalhe);
    return campos.join(' | ');
}

/* uma linha do evidencia.jsonl vira 0..N fichas */
export function fichasDaLinha(linha) {
    if (!linha || typeof linha !== 'object') return [];
    const papel = papelDoSlide(linha.slide, linha.slides_total);
    return acoesDe(linha.antes, linha.depois, linha.tipo).map((a) => ({
        id: linha.id,
        episodio: linha.episodio,
        deck: linha.deck || '',
        ts: linha.ts || '',
        /* sessão = dia. Duas correções na mesma tarde não são duas
           oportunidades independentes de confirmar um gosto. */
        sessao: String(linha.ts || '').slice(0, 10),
        slide: linha.slide,
        papel,
        eixo: a.eixo,
        classe: a.classe,
        detalhe: a.detalhe,
        ficha_canonica: fichaCanonica({ eixo: a.eixo, papel, classe: a.classe, detalhe: a.detalhe })
    }));
}

export function fichasDoLog(texto) {
    const fichas = [], erros = [];
    for (const linha of String(texto || '').split(/\r?\n/)) {
        if (!linha.trim()) continue;
        let obj;
        try { obj = JSON.parse(linha); }
        catch (e) { erros.push('linha ilegível ignorada'); continue; }
        /* só o schema que este tradutor entende; rótulo futuro passa batido
           em vez de ser interpretado errado */
        if (obj.schema && obj.schema !== 'delta-cru-v1') { erros.push('schema ' + obj.schema + ' ignorado'); continue; }
        fichas.push(...fichasDaLinha(obj));
    }
    return { fichas, erros };
}
