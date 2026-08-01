import { readFileSync, writeFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { assembleRun } from '/workspaces/.mira/agents/mira-fast/scripts/assemble-run.mjs';
import { validateSlideFile } from '/workspaces/.mira/agents/mira-fast/scripts/validate-run.mjs';
const ROOT='/workspaces/.mira';
const B='/tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/pentefino';
const src = join(B,'decks','2026-07-31 pente-fino-studio');

console.log('=== EXP 4: fragmento cujo JS contem a string "<section" ===');
const d4 = join(B,'exp4'); rmSync(d4,{recursive:true,force:true}); cpSync(src,d4,{recursive:true});
for (const f of ['mira/mira-camera.js','mira/mira-studio-server.cjs','mira-studio-windows.bat','assets/vendor/d3.v7.min.js','index.html'])
  rmSync(join(d4,f),{recursive:true,force:true});
let f3 = readFileSync(join(d4,'mira/fast/slide-03.html'),'utf8');
// uso legitimo: a folha comenta a estrutura que desenha
f3 = f3.replace('const svg =', '// o palco vive dentro da <section> data-layout=split\n  const svg =');
writeFileSync(join(d4,'mira/fast/slide-03.html'), f3);
const v = validateSlideFile(d4, 3);
console.log('validate-run --slide 3 aprova o fragmento?', v.ok, v.errors);
try { const r = assembleRun(d4,{projectRoot:ROOT}); console.log('montou:', r.ok); }
catch(e){ console.log('assemble FALHOU:', e.message); }
console.log('efeitos colaterais deixados pela falha:');
for (const f of ['mira/mira-camera.js','mira/mira-studio-server.cjs','mira-studio-windows.bat','assets/vendor/d3.v7.min.js','index.html'])
  console.log('   ', f, existsSync(join(d4,f)) ? 'CRIADO' : 'ausente');
