import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFragment, validateRun } from '../../mira-fast/scripts/validate-run.mjs';

export * from '../../mira-fast/scripts/validate-run.mjs';

export function validateUltrafastSlide(deckDir, slideNumber) {
  try {
    const plan = JSON.parse(readFileSync(join(deckDir, 'mira', 'fast', 'plano.json'), 'utf8'));
    const slide = plan.slides?.find((item) => item.n === slideNumber);
    if (!slide) return { ok: false, slide: slideNumber, errors: [`slide ${slideNumber}: ausente no plano`] };
    const fragment = readFileSync(join(deckDir, 'mira', 'fast', `slide-${String(slideNumber).padStart(2, '0')}.html`), 'utf8');
    const errors = validateFragment(slide, fragment, plan);
    return { ok: errors.length === 0, slide: slideNumber, errors };
  } catch (error) {
    return { ok: false, slide: slideNumber, errors: [error.message] };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const deckDir = process.argv[2];
  const flag = process.argv.indexOf('--slide');
  const slide = flag >= 0 ? Number(process.argv[flag + 1]) : null;
  if (!deckDir || (flag >= 0 && !Number.isInteger(slide))) {
    process.stderr.write('uso: validate-run.mjs <deck_dir> [--slide N]\n');
    process.exitCode = 2;
  } else {
    const result = slide === null ? validateRun(resolve(deckDir)) : validateUltrafastSlide(resolve(deckDir), slide);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  }
}
