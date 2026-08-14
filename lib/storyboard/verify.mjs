/**
 * `mira storyboard verify <deck>`
 *
 * Responde uma pergunta só: o conceito aprovado atravessou a cadeia até o slide?
 *
 * Existe porque este repositório já mediu a falha contrária. No deck
 * `2026-08-07 O Reversa New 2` havia um storyboard de 16 quadros em disco às
 * 16:03, a cadeia rodou às 17:37, e ele foi citado ZERO vezes na única peça que
 * chega em quem anima. E o `@MIRA:FOCO` mostrou o que acontece quando ninguém
 * confere: 27 chamadas de câmera, 1 marcador emitido.
 *
 * Instrução em SKILL.md não é mecanismo. Isto é.
 *
 * Duas regras que não podem ser afrouxadas:
 *   1. NUNCA escreve nem corrige nada. Só relata.
 *   2. Deck NÃO VINCULADO não é defeito: relata em uma linha e sai com 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const MARCADOR = /<!--\s*@MIRA:CONCEPT\s+([^>]*?)-->/g;

/** Extrai atributos `chave="valor"` do corpo do marcador. */
function atributos(corpo) {
  const out = {};
  for (const m of corpo.matchAll(/(\w+)\s*=\s*"([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/**
 * Um deck está VINCULADO quando existem, ao mesmo tempo:
 *   storyboard/concept-brief.md  e  storyboard/approved/ com pelo menos um .svg
 *
 * O quadro de registro é sempre o `.svg`. O `.png` é a renderização dele.
 * Consequência deliberada: rodar com --no-png, ou o Chrome falhar, NUNCA muda
 * um deck de vinculado para não vinculado.
 */
export function detectarVinculo(deckDir) {
  const sb = path.join(deckDir, 'storyboard');
  const brief = path.join(sb, 'concept-brief.md');
  const approved = path.join(sb, 'approved');

  const temBrief = fs.existsSync(brief);
  let quadros = [];
  if (fs.existsSync(approved)) {
    quadros = fs
      .readdirSync(approved)
      .filter((f) => f.toLowerCase().endsWith('.svg'))
      .sort();
  }
  return { sb, brief, approved, temBrief, quadros, vinculado: temBrief && quadros.length > 0 };
}

export function verify(deckDir) {
  const index = path.join(deckDir, 'index.html');
  if (!fs.existsSync(index)) {
    throw new Error(`não parece um deck: ${path.join(deckDir, 'index.html')} não existe`);
  }

  const v = detectarVinculo(deckDir);
  const r = {
    deck: deckDir,
    vinculado: v.vinculado,
    conforme: true,
    quadrosAprovados: v.quadros,
    slides: 0,
    marcados: 0,
    slidesSemMarcador: [],
    marcadoresQuebrados: [],
    quadrosOrfaos: [],
    briefingsSemSecao: [],
    nota: null,
  };

  if (!v.vinculado) {
    // Ausência de vínculo não é defeito. Mas vale dizer qual metade falta,
    // porque brief sem storyboard aprovado é validação visual pulada.
    if (v.temBrief && !v.quadros.length) {
      r.nota = 'deck NÃO VINCULADO: existe concept-brief.md, mas storyboard/approved/ não tem nenhum .svg. O alinhamento foi feito e a validação visual não.';
    } else if (!v.temBrief && v.quadros.length) {
      r.nota = 'deck NÃO VINCULADO: existe storyboard aprovado, mas falta storyboard/concept-brief.md. O conceito não foi fechado.';
    } else {
      r.nota = 'deck NÃO VINCULADO: sem storyboard/concept-brief.md e sem storyboard/approved/. Comportamento normal, nada a verificar.';
    }
    return r;
  }

  const html = fs.readFileSync(index, 'utf8');
  const secoes = html.split(/<section\b/i).slice(1);
  r.slides = secoes.length;

  const referenciados = new Set();
  secoes.forEach((sec, i) => {
    const n = i + 1;
    const achados = [...sec.matchAll(MARCADOR)];
    if (!achados.length) {
      r.slidesSemMarcador.push(n);
      return;
    }
    r.marcados += 1;
    for (const a of achados) {
      const attr = atributos(a[1]);
      const quadro = attr.quadro || '';
      if (!quadro || quadro === 'none') continue; // slide sem quadro correspondente é caso previsto
      const nome = path.basename(quadro);
      referenciados.add(nome);
      if (!v.quadros.includes(nome)) {
        r.marcadoresQuebrados.push({ slide: n, quadro });
      }
    }
  });

  r.quadrosOrfaos = v.quadros.filter((q) => !referenciados.has(q));

  // Briefings de cena, quando existirem: cada slide precisa da seção obrigatória.
  const refs = path.join(deckDir, 'references');
  if (fs.existsSync(refs)) {
    for (const f of fs.readdirSync(refs)) {
      if (!/briefing/i.test(f) || !f.endsWith('.md')) continue;
      const txt = fs.readFileSync(path.join(refs, f), 'utf8');
      if (!/##\s+Conceito aprovado/i.test(txt)) {
        r.briefingsSemSecao.push(f);
      }
    }
  }

  r.conforme =
    r.slidesSemMarcador.length === 0 &&
    r.marcadoresQuebrados.length === 0 &&
    r.briefingsSemSecao.length === 0;

  return r;
}

export function formatarRelatorio(r) {
  const L = [];
  L.push(`deck: ${r.deck}`);
  if (!r.vinculado) {
    L.push(r.nota);
    return L.join('\n');
  }

  L.push(`vinculado: sim | quadros aprovados: ${r.quadrosAprovados.length} | slides: ${r.slides}`);
  L.push(`slides com marcador @MIRA:CONCEPT: ${r.marcados} de ${r.slides}`);

  if (r.slidesSemMarcador.length) {
    L.push(`FALTA marcador nos slides: ${r.slidesSemMarcador.join(', ')}`);
  }
  for (const m of r.marcadoresQuebrados) {
    L.push(`REFERÊNCIA QUEBRADA no slide ${m.slide}: aponta para "${m.quadro}", que não está em approved/`);
  }
  if (r.briefingsSemSecao.length) {
    L.push(`BRIEFING sem a seção "## Conceito aprovado": ${r.briefingsSemSecao.join(', ')}`);
  }
  if (r.quadrosOrfaos.length) {
    // Órfão pode ser normal: o Concept Storyboard representa o conceito, não o deck.
    L.push(`quadros aprovados que nenhum slide cita: ${r.quadrosOrfaos.join(', ')} (pode ser normal, quem julga é você)`);
  }

  L.push(r.conforme ? 'CONFERE.' : 'NÃO CONFERE. Nada foi corrigido: corrigir é decisão sua.');
  return L.join('\n');
}
