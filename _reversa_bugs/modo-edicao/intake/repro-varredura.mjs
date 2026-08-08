import puppeteer from 'puppeteer';
const URL=process.argv[2];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({args:['--no-sandbox']});
const page=await b.newPage();await page.setViewport({width:1366,height:768});
const erros=[];page.on('pageerror',e=>erros.push(e.message));
await page.goto(URL,{waitUntil:'networkidle0'});await sleep(2500);
await page.keyboard.press('e');await sleep(500);

const marca=()=>page.evaluate(()=>{const EDIT='h1,h2,h3,h4,h5,h6,p,blockquote,li,figure,img,svg,video,canvas,iframe,span,button,[data-me-editable]';
 const out=[];let i=0;document.querySelectorAll(EDIT).forEach(el=>{if(el.closest('#me-bar,#me-toast,#mef-overlay,#mef-actions,#md-bar,[data-me-chrome]'))return;
 const r=el.getBoundingClientRect();if(r.width<70||r.height<25)return;if(r.y<50||r.y+r.height>innerHeight-80)return;
 // so o mais externo: descarta se um ancestral ja foi marcado
 if(el.parentElement&&el.parentElement.closest('[data-probe]'))return;
 const id='z'+(i++);el.setAttribute('data-probe',id);out.push(id);});return out;});

async function sel(p){const c=await page.evaluate(p=>{const r=document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},p);
 await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.up();await sleep(400);
 return page.evaluate(p=>{const ov=document.getElementById('mef-overlay');const el=document.querySelector(`[data-probe="${p}"]`);
 const o=ov.getBoundingClientRect(),r=el.getBoundingClientRect();
 return !ov.classList.contains('mef-hide')&&Math.abs(o.x-r.x)<30&&Math.abs(o.y-r.y)<30},p);}

async function mover(p,dx,dy){
 const antes=await page.evaluate(p=>document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect().x,p);
 const o=await page.evaluate(()=>{const r=document.getElementById('mef-overlay').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
 await page.mouse.move(o.x,o.y);await page.mouse.down();
 for(let i=1;i<=6;i++){await page.mouse.move(o.x+dx*i/6,o.y+dy*i/6);await sleep(25)}await page.mouse.up();await sleep(400);
 const dep=await page.evaluate(p=>document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect().x,p);
 // checa de novo 1,5s depois: animacao pode sobrescrever o transform
 await sleep(1500);
 const tarde=await page.evaluate(p=>document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect().x,p);
 return {moveu:Math.abs(dep-antes)>10, voltou:Math.abs(tarde-dep)>5, dx:Math.round(dep-antes), depoisDe1s:Math.round(tarde-dep)};}

const btn=()=>page.evaluate(()=>{const s=document.getElementById('me-save');return s.lastChild.textContent+(s.disabled?' [off]':'')});
async function salvar(){if(await page.evaluate(()=>document.getElementById('me-save').disabled))return'BOTAO OFF';
 await page.click('#me-save');await sleep(1800);return page.evaluate(()=>document.getElementById('me-toast').textContent)}

const alvos=await marca();
console.log('alvos:',alvos.length,'| botao:',await btn());
if(alvos.length<2){console.log('poucos alvos');await b.close();process.exit(0)}

for(const rodada of [1,2,3]){
  const p=alvos[(rodada-1)%alvos.length];
  const ok=await sel(p);
  const m=ok?await mover(p,35,-25):null;
  console.log(`rodada ${rodada} [${p}] selecionou=${ok} mover=${JSON.stringify(m)} botao=${await btn()}`);
  console.log(`   salvar -> ${await salvar()} | botao pos-save=${await btn()}`);
}
if(erros.length)console.log('erros de pagina:',erros.slice(0,3));
await b.close();
