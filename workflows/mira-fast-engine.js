export const meta = {
  name: 'mira-fast-engine',
  description: 'Planeja um deck e gera uma folha validada por slide em paralelo para montagem determinística.',
};

const invocation = typeof args === 'string' ? args : JSON.stringify(args ?? {});

const plan = await agent(`
Execute somente a Fase 1 do Mira Fast para esta invocação:
${invocation}

A Fase 0 já rodou na sessão principal: a pasta do deck existe, com references/,
assets/ e mira/ criadas, e o slug já está decidido. Se a invocação informar o
slug ou o deck_dir resolvido, use exatamente esse, não escolha outro nome nem
crie uma segunda pasta. Não recrie a estrutura e não apague nem sobrescreva
nada que já esteja em references/: pode haver material que o usuário colocou
lá, e esse material é fonte. Leia o que houver antes de planejar.

Leia .claude/skills/mira-fast/SKILL.md,
.claude/skills/mira-fast/references/plano-schema.md e
.claude/skills/mira-fast/references/quadro-metaforas.md.
Crie mira/fast/esqueleto.html com os seis slots determinísticos exigidos pela skill.
Se o formato for mira, use obrigatoriamente mira-templates/decks/mira-default/index.html
como fonte canônica. Preserve o marcador MIRA-DEFAULT, o runtime e o CSS
.slide-main/.slide-centro; remova somente os slides e a animação de exemplo.
Não pergunte por template.
Grave mira/fast/plano.json e references/quadro-metaforas.md.
Não gere fragmentos nem monte o deck. Retorne o plano completo no schema solicitado.
`, {
  label: 'mira-fast: plano',
  schema: {
    type: 'object',
    properties: {
      versao: { type: 'number' },
      slug: { type: 'string' },
      deck_dir: { type: 'string' },
      formato: { type: 'string' },
      arquivo_saida: { type: 'string' },
      titulo_deck: { type: 'string' },
      subtitulo_deck: { type: 'string' },
      paleta: { type: 'object' },
      tom: { type: 'string' },
      total_slides: { type: 'number' },
      ledger: { type: 'array' },
      lembrancas: {},
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            n: { type: 'number' },
            slug_stage: { type: 'string' },
            tipo: { type: 'string' },
            modo_folha: { type: 'string' },
          },
          required: ['n', 'slug_stage', 'tipo', 'modo_folha'],
          additionalProperties: true,
        },
      },
    },
    required: [
      'versao', 'slug', 'deck_dir', 'formato', 'arquivo_saida', 'titulo_deck',
      'paleta', 'tom', 'total_slides', 'ledger', 'slides',
    ],
    additionalProperties: true,
  },
});

const globals = {
  deck_dir: plan.deck_dir,
  formato: plan.formato,
  arquivo_saida: plan.arquivo_saida,
  titulo_deck: plan.titulo_deck,
  subtitulo_deck: plan.subtitulo_deck,
  paleta: plan.paleta,
  tom: plan.tom,
  lembrancas: plan.lembrancas,
};

const leafSchema = {
  type: 'object',
  properties: {
    n: { type: 'number' },
    ok: { type: 'boolean' },
    validation: { type: 'string' },
  },
  required: ['n', 'ok', 'validation'],
  additionalProperties: false,
};

async function runLeaf(slide, attempt) {
  const modeReference = slide.modo_folha === 'animada'
    ? 'references/contrato-animado.md'
    : 'references/contrato-estatico.md';
  const formatReference = `references/formato-${plan.formato}.md`;
  const fragmentPath = `${plan.deck_dir}/mira/fast/slide-${String(slide.n).padStart(2, '0')}.html`;

  return agent(`
Você é a folha isolada ${slide.n} do Mira Fast, tentativa ${attempt} de 2.
Leia somente estes três contratos:
- .claude/skills/mira-fast/references/contrato-base.md
- .claude/skills/mira-fast/${modeReference}
- .claude/skills/mira-fast/${formatReference}

Não leia o plano completo, o deck final, fragmentos vizinhos ou outras skills.
Na tentativa 2, você pode ler somente seu próprio fragmento anterior para repará-lo.

CAMPOS GLOBAIS:
${JSON.stringify(globals)}

SEU SLIDE:
${JSON.stringify(slide)}

Grave ou corrija somente:
${fragmentPath}
e seu status exclusivo:
${plan.deck_dir}/mira/fast/result-${String(slide.n).padStart(2, '0')}.json

Depois rode obrigatoriamente:
node .claude/skills/mira-fast/scripts/validate-run.mjs "${plan.deck_dir}" --slide ${slide.n}

Se falhar, corrija seu fragmento e rode novamente. Grave no status
{"n":${slide.n},"ok":true|false,"validation":"pass ou motivo","attempts":${attempt}}.
Não escreva em nenhum outro arquivo.
Retorne {"n":${slide.n},"ok":true,"validation":"pass"} somente após exit code 0.
Se não conseguir corrigir, retorne {"n":${slide.n},"ok":false,"validation":"motivo curto"}.
`, { label: `mira-fast: slide ${slide.n} tentativa ${attempt}`, schema: leafSchema });
}

async function buildWithRetry(slide) {
  const failures = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await runLeaf(slide, attempt);
      if (result.ok) return { ...result, attempts: attempt };
      failures.push(result.validation);
    } catch (error) {
      failures.push(String(error));
    }
  }
  return { n: slide.n, ok: false, validation: failures.join(' | '), attempts: 2 };
}

const leaves = await pipeline(plan.slides, (slide) => buildWithRetry(slide));
const failedLeaves = leaves.filter((leaf) => !leaf.ok);

return {
  deck_dir: plan.deck_dir,
  arquivo_saida: plan.arquivo_saida,
  folhas: leaves.length,
  total_slides: plan.slides.length,
  falhas: failedLeaves,
  pronto_para_montar: failedLeaves.length === 0,
  comando_montagem: `node .claude/skills/mira-fast/scripts/assemble-run.mjs "${plan.deck_dir}"`,
};
