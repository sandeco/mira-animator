import puppeteer from 'puppeteer';
const URL='http://127.0.0.1:5200/index.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({args:['--no-sandbox']});
const page=await b.newPage();await page.setViewport({width:1366,height:768});
await page.goto(URL,{waitUntil:'networkidle0'});await sleep(1500);
await page.keyboard.press('e');await sleep(400);

const alvos=await page.evaluate(()=>{const EDIT='h1,h2,h3,h4,h5,h6,p,blockquote,li,figure,img,svg,video,canvas,iframe,span,button,[data-me-editable]';
 const out=[];let i=0;
 document.querySelectorAll(EDIT).forEach(el=>{if(el.closest('#me-bar,#me-toast,#mef-overlay,#mef-actions,[data-me-chrome]'))return;
  const r=el.getBoundingClientRect();if(r.width<40||r.height<20)return;if(r.y<0||r.y>innerHeight)return;
  const id='p'+(i++);el.setAttribute('data-probe',id);
  out.push({id,tag:el.tagName,area:Math.round(r.width*r.height/1000),w:Math.round(r.width),h:Math.round(r.height)});});
 return out.sort((a,c)=>c.area-a.area);});
console.log('editaveis (por area, mil px2):',alvos.slice(0,8));

async function click(p){const c=await page.evaluate(p=>{const r=document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},p);
 await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.up();await sleep(200);
 return page.evaluate(p=>{const ov=document.getElementById('mef-overlay');const el=document.querySelector(`[data-probe="${p}"]`);
  const o=ov.getBoundingClientRect(),r=el.getBoundingClientRect();
  const bloqueio=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return{selecionou:!ov.classList.contains('mef-hide')&&Math.abs(o.x-r.x)<25&&Math.abs(o.y-r.y)<25,
   quemRecebeuOClique:bloqueio?bloqueio.tagName+'.'+(typeof bloqueio.className==='string'?bloqueio.className:''):null}},p);}

const maior=alvos[0];
console.log(`\n1) seleciona o MAIOR elemento (${maior.tag}, ${maior.w}x${maior.h})`);
console.log('  ',await click(maior.id));
console.log('   overlay:',await page.evaluate(()=>{const r=document.getElementById('mef-overlay').getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height)}}));

console.log('\n2) tenta selecionar os outros com ele ainda selecionado:');
for(const a of alvos.slice(1,5)){
  const r=await click(a.id);
  console.log(`   ${a.id} (${a.tag} ${a.w}x${a.h}):`, r);
}
console.log('\n3) Escape e tenta de novo:');
await page.keyboard.press('Escape');await sleep(200);
console.log('   editando ainda?',await page.evaluate(()=>document.body.classList.contains('me-on')));
console.log('   ',alvos[1].id,await click(alvos[1].id));
await b.close();
