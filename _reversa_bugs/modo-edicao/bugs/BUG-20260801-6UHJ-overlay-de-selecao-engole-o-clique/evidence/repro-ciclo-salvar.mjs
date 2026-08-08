import puppeteer from 'puppeteer';
const URL='http://127.0.0.1:5200/index.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({args:['--no-sandbox']});
const page=await b.newPage();
await page.setViewport({width:1366,height:768});
await page.goto(URL,{waitUntil:'networkidle0'});await sleep(1500);
await page.keyboard.press('e');await sleep(400);

const st=()=>page.evaluate(()=>{const s=document.getElementById('me-save');const o=document.getElementById('mef-overlay');
 return{save:s.lastChild.textContent+(s.disabled?' [off]':''),dirty:window.miraEditFree?.hasChanges(),hidden:o.classList.contains('mef-hide'),
 crop:document.body.classList.contains('mef-crop-mode'),txtEdit:document.body.classList.contains('mef-text-editing'),
 toast:document.getElementById('me-toast').textContent}});

await page.evaluate(()=>{const EDIT='h1,h2,h3,h4,h5,h6,p,blockquote,li,figure,img,svg,video,canvas,iframe,span,button,[data-me-editable]';let i=0;
 document.querySelectorAll(EDIT).forEach(el=>{if(el.closest('#me-bar,#me-toast,#mef-overlay,#mef-actions,[data-me-chrome]'))return;
 const r=el.getBoundingClientRect();if(r.width<40||r.height<20)return;if(r.y<40||r.y+r.height>innerHeight-60)return;el.setAttribute('data-probe','p'+(i++));});});

async function click(p){const c=await page.evaluate(p=>{const r=document.querySelector(`[data-probe="${p}"]`).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},p);
 await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.up();await sleep(250);}
async function handle(dir,dx,dy,alt){const h=await page.evaluate(d=>{const e=document.querySelector('#mef-overlay .mef-h.'+d);const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},dir);
 if(alt)await page.keyboard.down('Alt');await page.mouse.move(h.x,h.y);await page.mouse.down();
 for(let i=1;i<=6;i++){await page.mouse.move(h.x+dx*i/6,h.y+dy*i/6);await sleep(20)}await page.mouse.up();await sleep(150);if(alt)await page.keyboard.up('Alt');await sleep(200);}
async function save(){const off=await page.evaluate(()=>document.getElementById('me-save').disabled);
 if(off)return'BOTAO DESABILITADO';await page.click('#me-save');await sleep(1500);return(await st()).toast;}

console.log('\n[A] mesmo elemento: resize -> save -> resize -> save');
await click('p0'); console.log(' sel:',await st());
await handle('se',25,25,false); console.log(' resize1:',await st());
console.log(' save1:',await save());
await handle('se',25,25,false); console.log(' resize2:',await st());
console.log(' save2:',await save());

console.log('\n[B] crop -> save -> crop -> save (mesmo elemento)');
await handle('e',-30,0,true); console.log(' crop1:',await st());
console.log(' save3:',await save());
await handle('e',-20,0,true); console.log(' crop2:',await st());
console.log(' save4:',await save());

console.log('\n[C] depois de tudo, seleciona outro elemento e move');
await page.keyboard.press('Escape'); await sleep(200);
console.log(' apos Escape:',await st());
await click('p2'); console.log(' sel p2:',await st());
const o=await page.evaluate(()=>{const r=document.getElementById('mef-overlay').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
await page.mouse.move(o.x,o.y);await page.mouse.down();for(let i=1;i<=6;i++){await page.mouse.move(o.x+40*i/6,o.y+10*i/6);await sleep(20)}await page.mouse.up();await sleep(250);
console.log(' move p2:',await st());
console.log(' save5:',await save());
await b.close();
