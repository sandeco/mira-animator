import { readFileSync, writeFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { assembleRun } from '/workspaces/.mira/agents/mira-fast/scripts/assemble-run.mjs';
const ROOT='/workspaces/.mira';
const B='/tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/pentefino';
const src = join(B,'decks','2026-07-31 pente-fino-studio');

console.log('=== EXP 1: re-montagem sobrescreve o roteiro.md editado pelo usuario? ===');
const d1 = join(B,'exp1'); rmSync(d1,{recursive:true,force:true}); cpSync(src,d1,{recursive:true});
const editado = readFileSync(join(d1,'roteiro.md'),'utf8').replace('Fala da capa.','FALA REESCRITA PELO USUARIO NO EDITOR DELE.');
writeFileSync(join(d1,'roteiro.md'), editado);
assembleRun(d1,{projectRoot:ROOT});
const depois = readFileSync(join(d1,'roteiro.md'),'utf8');
console.log('edicao do usuario sobreviveu?', depois.includes('FALA REESCRITA PELO USUARIO'));
console.log('voltou para a fala do plano?', depois.includes('Fala da capa.'));

console.log('\n=== EXP 2: falha na montagem deixa efeitos colaterais no deck? ===');
const d2 = join(B,'exp2'); rmSync(d2,{recursive:true,force:true}); cpSync(src,d2,{recursive:true});
for (const f of ['mira/mira-camera.js','mira/mira-record.js','mira/mira-studio-server.cjs','mira-studio-windows.bat','assets/vendor/d3.v7.min.js','index.html'])
  rmSync(join(d2,f),{recursive:true,force:true});
// quebra o esqueleto DEPOIS do ponto onde os modulos ja foram instalados:
// duplica uma section fora do slot para estourar a contagem final (linha 339)
let esq = readFileSync(join(d2,'mira/fast/esqueleto.html'),'utf8');
writeFileSync(join(d2,'mira/fast/slide-02.html'),
  readFileSync(join(d2,'mira/fast/slide-02.html'),'utf8').replace('</section>','</section>').replace('<section data-layout="camera">','<section data-layout="camera">'));
// caminho mais direto: apaga o quadro-metaforas? nao, isso falha ANTES. Usa modulo faltante:
rmSync(join(ROOT,'nao-existe'),{force:true});
try {
  // forca falha tardia: plano pede 4 slides mas o esqueleto ja tem section fora do slot
  esq = esq.replace('<!-- @MIRA:FAST:SLIDES:START -->','<section id="intruso"></section>\n<!-- @MIRA:FAST:SLIDES:START -->');
  writeFileSync(join(d2,'mira/fast/esqueleto.html'), esq);
  assembleRun(d2,{projectRoot:ROOT});
  console.log('montou (inesperado)');
} catch(e){ console.log('falhou com:', e.message.slice(0,90)); }
for (const f of ['mira/mira-camera.js','mira/mira-studio-server.cjs','mira-studio-windows.bat','assets/vendor/d3.v7.min.js','index.html'])
  console.log('  criado mesmo com a falha?', f, existsSync(join(d2,f)));

console.log('\n=== EXP 3: result-NN.json ausente ou corrompido conta como sucesso? ===');
const d3 = join(B,'exp3'); rmSync(d3,{recursive:true,force:true}); cpSync(src,d3,{recursive:true});
rmSync(join(d3,'mira/fast/result-03.json'),{force:true});
writeFileSync(join(d3,'mira/fast/result-04.json'),'{ isto nao e json valido');
const r3 = assembleRun(d3,{projectRoot:ROOT});
console.log('montou apesar dos status ausente/corrompido?', r3.ok);
console.log('montagem.log:');
for (const l of readFileSync(join(d3,'mira/fast/montagem.log'),'utf8').split('\n').filter(x=>/slide|resultado/.test(x))) console.log('  '+l);
