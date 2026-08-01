import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSkeleton } from '/workspaces/.mira/agents/mira-ultrafast/scripts/build-skeleton.mjs';
import { assembleRun } from '/workspaces/.mira/agents/mira-fast/scripts/assemble-run.mjs';
const ROOT='/workspaces/.mira';
const B='/tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/pentefino';
const deck = join(B,'decks','2026-07-31 pente-fino-studio');
try {
  const p = buildSkeleton('mira-studio', deck, { projectRoot: ROOT });
  console.log('esqueleto gerado:', p);
} catch (e) { console.log('build-skeleton FALHOU:', e.message); process.exit(0); }
try {
  const r = assembleRun(deck, { projectRoot: ROOT });
  console.log('MONTOU ok. slides=' + r.slides + ' saida=' + r.output);
} catch (e) { console.log('assemble FALHOU:\n' + e.message.split(' | ').map(x=>'  - '+x).join('\n')); }
