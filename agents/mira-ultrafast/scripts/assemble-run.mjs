import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleRun as assembleBaseline } from '../../mira-fast/scripts/assemble-run.mjs';
import { appendTiming, summarizeTimings } from './timings.mjs';

export function assembleRun(deckPath, options = {}) {
  const deckDir = resolve(deckPath);
  const start = new Date();
  try {
    return assembleBaseline(deckDir, options);
  } finally {
    const end = new Date();
    const timings = appendTiming(deckDir, { etapa: 'fase_3_montagem', inicio: start, fim: end });
    appendFileSync(`${deckDir}/mira/fast/montagem.log`, `timings: cpus=${timings.cpus}; vagas=${timings.vagas_efetivas}; ${summarizeTimings(timings)}\n`, 'utf8');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('uso: assemble-run.mjs <deck_dir>');
  try {
    const result = assembleRun(process.argv[2]);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`MIRA_ULTRAFAST_ASSEMBLY_FAILED: ${error.message}\n`);
    process.exitCode = 1;
  }
}
