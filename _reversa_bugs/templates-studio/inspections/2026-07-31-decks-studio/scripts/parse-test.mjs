import { readFileSync } from 'node:fs';
const D='/tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/pentefino/decks/2026-07-31 pente-fino-studio';
// parse() e palco() COPIADOS VERBATIM do deck gerado (index.html), sem alteracao.
const HEAD = /^##[ \t]+/;
function parse(raw) {
    var linhas = String(raw).split(/\r?\n/);
    var intro = [], headers = [], slides = [], corpo = null;
    for (var i = 0; i < linhas.length; i++) {
        if (HEAD.test(linhas[i])) {
            headers.push(linhas[i]);
            var campos = linhas[i].replace(HEAD, '').split('|');
            corpo = [];
            slides.push({ layout: (campos[1] || '').trim().toLowerCase(), titulo: (campos[2] || '').trim(), linhas: corpo });
        } else if (corpo) corpo.push(linhas[i]);
        else intro.push(linhas[i]);
    }
    slides.forEach(function (s) { s.texto = s.linhas.join('\n').replace(/^\s+|\s+$/g, ''); delete s.linhas; });
    return { intro: intro.join('\n'), headers: headers, slides: slides };
}
function palco(n) {
    return '<div class="anim-stage"><svg id="sv-slide-' + n + '" preserveAspectRatio="xMidYMid meet"></svg></div>';
}
const R = parse(readFileSync(D + '/roteiro.md','utf8'));
console.log('slides parseados:', R.slides.length);
// capaBase seria null: o deck nao tem section.capa
const temCapaBase = /section class="capa"/.test(readFileSync(D + '/index.html','utf8'));
console.log('capaBase (body > section.capa) existe no deck?', temCapaBase);
for (const [i, s] of R.slides.entries()) {
    const n = i + 1;
    let ramo, htmlPalco = '(sem palco)';
    if (s.layout === 'capa' && temCapaBase) ramo = 'clone da capa';
    else if (s.layout === 'split') { ramo = 'split'; htmlPalco = palco(n); }
    else if (s.layout === 'full') { ramo = 'full'; htmlPalco = palco(n); }
    else ramo = 'camera (queda de layout desconhecido)';
    console.log(`slide ${n} layout=${s.layout.padEnd(7)} -> ramo=${ramo.padEnd(38)} ${htmlPalco}`);
}
// ids que o montador procura
const out = readFileSync(D + '/index.html','utf8');
const ids = [...out.matchAll(/stageId:\s*"([^"]+)"/g)].map(m=>m[1]);
console.log('\nstageId que miraFastBindAnimations procura:', ids);
console.log('esses ids sobrevivem a reconstrucao?', ids.map(id => palco(3).includes(id) || palco(4).includes(id)));
