import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function renderBoard(deckPath) {
  const deckDir = resolve(deckPath);
  const plan = JSON.parse(readFileSync(join(deckDir, 'mira', 'fast', 'plano.json'), 'utf8'));
  const animated = plan.slides.filter((slide) => slide.modo_folha === 'animada');
  const lines = ['# Quadro de metáforas', '', '| Slide | Conceito | Família | Metáfora | Assinatura |', '|---:|---|---|---|---|'];
  for (const slide of animated) {
    const signature = `${slide.familia} | ${slide.verbo_causal} | ${slide.silhueta} | ${slide.espaco} | ${slide.movimento} | ${slide.tempo}`;
    lines.push(`| ${slide.n} | ${slide.conceito} | ${slide.familia} | ${slide.metafora} | ${signature} |`);
  }
  lines.push('', '## Ledger anticolisão', '');
  for (const slide of animated) {
    const signature = plan.ledger.find((item) => item.n === slide.n)?.assinatura ?? '';
    lines.push(`- Slide ${slide.n}: ${signature}`);
  }
  const output = join(deckDir, 'references', 'quadro-metaforas.md');
  writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('uso: render-board.mjs <deck_dir>');
  process.stdout.write(`${renderBoard(process.argv[2])}\n`);
}
