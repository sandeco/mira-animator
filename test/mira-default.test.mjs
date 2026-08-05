/* =====================================================================
   mira-default.test.mjs
   ---------------------------------------------------------------------
   O template PADRÃO do Mira: título em cima, animação ocupando o resto
   do quadro 16:9.

   Testa o deck GERADO, não o template fonte: o "new" injeta tema e
   camada responsiva por cima, e é esse resultado que o usuário abre.
   Foi assim que apareceu o defeito do base.css devolvendo altura fixa
   e glow ao palco, que o template fonte sozinho não mostrava.

   Rodar:  node --test test/mira-default.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIRA = join(RAIZ, 'bin', 'mira.js');

/* projeto limpo num diretório temporário: gerar deck dentro do repo
   sujaria decks/ e o mira.config.json de verdade.
   O "install" é interativo (menu de engines), então escrevo só o
   mira.config.json, que é tudo que o "new" precisa para rodar. */
function projeto() {
    const dir = mkdtempSync(join(tmpdir(), 'mira-tpl-'));
    writeFileSync(join(dir, 'mira.config.json'),
        JSON.stringify({ version: '0.0.0', defaultTheme: 'mira-dark', language: 'pt-BR', sources: [], decks: [] }, null, 2),
        'utf8');
    return {
        dir,
        novo(nome, ...flags) {
            execFileSync(process.execPath, [MIRA, 'new', nome, ...flags], { cwd: dir, stdio: 'ignore' });
            return readFileSync(join(dir, 'decks', nome, 'index.html'), 'utf8');
        },
        caminho: (nome) => join(dir, 'decks', nome),
        limpar: () => rmSync(dir, { recursive: true, force: true })
    };
}

/* roda as animações do deck fora do navegador. Um NaN num transform não
   dá erro: o elemento só some da tela, então varrer é a única forma de
   ver. As cores saem do tema via getComputedStyle, e o stub lê o :root
   do próprio HTML para enxergar a cor real daquele deck. */
function rodarAnimacoes(html, opcoes = {}) {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map((m) => m[1]).find((s) => /d3\.timer/.test(s));
    assert.ok(script, 'o deck tem um script de animação');

    const tema = {};
    for (const m of html.matchAll(/(--mira-[\w-]+)\s*:\s*([^;]+);/g)) tema[m[1]] = m[2].trim();

    const reg = [], ruins = [];
    let agora = 0, seq = 0;
    const timers = [];

    function sel(nome) {
        return {
            _n: nome,
            empty: () => false,
            node: () => ({ closest: () => ({ getBoundingClientRect: () => ({ width: 820, height: 400 }) }) }),
            selectAll: () => ({ remove: () => { } }),
            append: (tag) => sel(nome + '>' + tag + seq++),
            attr(k, v) {
                if (v === undefined) return this;
                const s = String(typeof v === 'function' ? v({ x: 1, y: 1 }) : v);
                if (/NaN|Infinity/.test(s)) ruins.push(`t=${agora} ${this._n}.${k}=${s}`);
                reg.push({ t: agora, k, v: s });
                return this;
            },
            style() { return this; }
        };
    }
    const d3 = {
        select: (s) => sel(s),
        easeCubicOut: (t) => 1 - Math.pow(1 - t, 3),
        easeCubicIn: (t) => t * t * t,
        curveCatmullRom: 'c',
        now: () => 0,
        timer: (fn) => { timers.push(fn); return { stop: () => { } }; },
        line: () => { const f = (p) => (p && p.length ? 'M0,0L1,1' : 'M0,0'); f.x = () => f; f.y = () => f; f.curve = () => f; return f; }
    };
    /* o regente só solta a animação quando o slide entra na tela; o
       observer falso me deixa dizer quando isso acontece */
    const observados = [];
    function IntersectionObserver(cb) {
        return { observe: (alvo) => observados.push({ cb, alvo }) };
    }
    const mostrar = (visivel) => observados.forEach(({ cb }) => cb([{ isIntersecting: visivel }]));

    new Function('d3', 'window', 'document', 'getComputedStyle', 'IntersectionObserver', script)(
        d3, { addEventListener: () => { } },
        {
            readyState: 'complete', addEventListener: () => { }, documentElement: {},
            getElementById: (id) => ({ id, closest: () => ({ tag: 'section', para: id }) })
        },
        () => ({ getPropertyValue: (k) => tema[k] || '' }),
        opcoes.semObserver ? undefined : IntersectionObserver);

    const t0 = opcoes.entraEm || 0;
    for (let ms = 0; ms <= t0 + 14400; ms += 40) {
        if (ms === t0 && !opcoes.semObserver && !opcoes.nuncaAparece) mostrar(true);
        agora = ms;
        timers.forEach((f) => f(ms));
    }

    const pintadas = new Set(reg.filter((r) => ['fill', 'stroke', 'stop-color'].includes(r.k))
        .map((r) => r.v.toLowerCase()).filter((v) => /^#[0-9a-f]{6}$/.test(v)));
    return {
        tema, ruins, timers: timers.length, pintadas, observados: observados.length,
        posicoes: new Set(reg.filter((r) => r.k === 'transform' && /translate/.test(r.v)).map((r) => r.v)),
        raios: new Set(reg.filter((r) => r.k === 'r').map((r) => r.v)),
        /* o que foi desenhado ANTES de o slide aparecer */
        antesDeAparecer: reg.filter((r) => r.t < t0),
        /* primeiro e último quadro depois da entrada, para comparar */
        noInstante: (ms) => reg.filter((r) => r.t === ms)
    };
}

test('mira-default é o template usado quando ninguém pede outro', () => {
    const p = projeto();
    try {
        const html = p.novo('sem-flag');
        assert.match(html, /MIRA-DEFAULT/, 'o deck saiu do mira-default');
        assert.match(html, /class="slide-main"/);
        assert.doesNotMatch(html, /data-layout="thirds"/, 'sem regra dos terços');
        assert.doesNotMatch(html, /cam-area/, 'sem câmera');
        assert.doesNotMatch(html, /mira-prompter/, 'sem teleprompter');
    } finally { p.limpar(); }
});

test('o palco ocupa o slide, mesmo com o base.css do tema injetado', () => {
    const p = projeto();
    try {
        const html = p.novo('palco');
        /* o base.css entra com .anim-stage de altura fixa + glow + cantos
           (linguagem de card). O template precisa neutralizar isso DEPOIS,
           senão o slide sai com uma caixinha arredondada no meio. */
        const regras = [...html.matchAll(/\.anim-stage\s*\{([^}]*)\}/g)];
        assert.ok(regras.length >= 2, 'o tema realmente injetou a regra de card');

        /* a última regra do arquivo é a da camada responsiva, dentro de
           @media (celular). No desktop quem vale é a última regra FORA de
           media query, e é essa que precisa vencer o base.css. */
        const fim = html.search(/@media/);
        const desktop = regras.filter((m) => m.index < fim);
        const vence = desktop[desktop.length - 1][1];
        assert.ok(desktop.length >= 2, 'a regra do template vem depois da do tema');
        /* o palco ocupa o QUADRO INTEIRO: absoluto, colado nas quatro bordas
           da <section>, por baixo do título. Antes ele era um item flex que
           crescia com o que sobrava depois do título; agora cobre tudo. */
        assert.match(vence, /position:\s*absolute/, 'o palco sai do fluxo para cobrir o quadro');
        assert.match(vence, /inset:\s*0/, 'colado nas quatro bordas da seção');
        assert.match(vence, /height:\s*auto/, 'anula a altura fixa do card');
        assert.match(vence, /background:\s*none/, 'anula o glow do card');
        assert.match(vence, /border-radius:\s*0/, 'anula os cantos do card');
    } finally { p.limpar(); }
});

test('o título fica por cima do palco, e a animação evita a faixa dele', () => {
    const p = projeto();
    try {
        const html = p.novo('titulo');

        /* 1. o título sobe acima do palco, mas NÃO acima dos módulos de
              autoria: mira-draw ocupa 99998 e mira-edit 100000, e o título
              acima deles impediria desenhar e editar sobre ele. */
        const regraH2 = html.match(/\.slide-main h2\s*\{([^}]*)\}/);
        assert.ok(regraH2, 'existe regra para o título do slide de conteúdo');
        const z = Number((regraH2[1].match(/z-index:\s*(\d+)/) || [])[1]);
        assert.ok(z > 0, 'o título tem z-index próprio');
        assert.ok(z < 99998, 'o título fica ABAIXO da faixa de mira-draw e mira-edit');
        assert.match(regraH2[1], /position:\s*relative/, 'z-index só vale com position');

        /* 2. o palco entrega a faixa livre para a animação */
        assert.match(html, /F\.topo/, 'o palco expõe onde a área livre começa');
        assert.match(html, /F\.alturaUtil/, 'o palco expõe a altura da área livre');
        assert.match(html, /F\.vy\s*=\s*function/, 'o palco expõe o mapeador F.vy');

        /* 3. as animações de exemplo são o contrato que os agentes copiam:
              se elas usarem F.H para coordenada vertical, todo deck gerado
              vai desenhar por trás do título. */
        const corpo = html.slice(html.indexOf('function animTempoVoa'));
        const usosCrus = corpo.match(/y:\s*F\.H\s*\*|var y = F\.H\s*\*/g) || [];
        assert.deepEqual(usosCrus, [],
            'nenhuma animação de exemplo posiciona em Y por F.H direto; use F.vy(k)');
        assert.ok((corpo.match(/F\.vy\(/g) || []).length >= 4,
            'as animações de exemplo usam F.vy de verdade');
    } finally { p.limpar(); }
});

test('o palco não quebra sem <section> nem sem título', () => {
    const p = projeto();
    try {
        const html = p.novo('sem-titulo');
        const fonte = html.slice(html.indexOf('function palco('));
        /* um palco avulso (template de card, teste, palco fora de section)
           não pode derrubar a animação inteira */
        assert.match(fonte, /caixa && caixa\.closest \? caixa\.closest/,
            'o closest é opcional');
        assert.match(fonte, /secao && secao\.querySelector/,
            'a busca do título é opcional');
        assert.match(fonte, /titulo && titulo\.getBoundingClientRect/,
            'a medição do título é opcional');
        assert.match(fonte, /caixa\.style && caixa\.style\.setProperty/,
            'a publicação da variável CSS é opcional');
    } finally { p.limpar(); }
});

test('mira-perfect não existe mais', () => {
    assert.ok(!existsSync(join(RAIZ, 'templates', 'decks', 'mira-perfect')),
        'o mira-perfect foi substituído pelo mira-default');
    const p = projeto();
    try {
        assert.throws(() => p.novo('morto', '--deck=mira-perfect'));
    } finally { p.limpar(); }
});

test('as animações rodam sem NaN e contam a história', () => {
    const p = projeto();
    try {
        const r = rodarAnimacoes(p.novo('anima'));
        assert.equal(r.timers, 2, 'as duas animações de exemplo ligaram');
        assert.deepEqual(r.ruins, [], 'nenhum NaN/Infinity em atributo');
        assert.ok(r.posicoes.size > 200, 'há movimento de verdade');
        assert.ok(r.raios.size > 50, 'a bola cresce ao longo da descida');
    } finally { p.limpar(); }
});

test('a cor da animação vem do tema, não de hex fixo no código', () => {
    const p = projeto();
    try {
        const padrao = rodarAnimacoes(p.novo('cor-padrao'));
        assert.equal(padrao.tema['--mira-primary'], '#FF904D');
        assert.ok(padrao.pintadas.has('#ff904d'), 'pinta com a marca no tema padrão');

        const azul = rodarAnimacoes(p.novo('cor-azul', '--theme=corporate-blue'));
        assert.equal(azul.tema['--mira-primary'].toLowerCase(), '#4da3ff');
        assert.ok(azul.pintadas.has('#4da3ff'), 'pinta com a cor do tema escolhido');
        assert.ok(!azul.pintadas.has('#ff904d'), 'não sobrou laranja fixo num deck azul');
    } finally { p.limpar(); }
});

test('o deck nasce offline, com edição, pintura e navegação', () => {
    const p = projeto();
    try {
        const html = p.novo('completo');
        assert.doesNotMatch(html, /https:\/\//, 'nenhuma CDN sobrou');
        for (const mod of ['mira/mira-edit.js', 'mira/mira-edit-free.js', 'mira/mira-draw.js']) {
            assert.ok(html.includes(mod), mod + ' presente');
            assert.ok(existsSync(join(p.caminho('completo'), mod)), mod + ' copiado');
        }
        assert.match(html, /ArrowRight/, 'navegação por seta');
        /* durante edição e pintura o teclado é dos modos, não da navegação:
           sem essa guarda, arrastar com a seta trocaria de slide */
        assert.match(html, /me-on/);
        assert.match(html, /md-on/);
        assert.match(html, /text-wrap:\s*balance/, 'diretiva do título da capa');
    } finally { p.limpar(); }
});

/* ---------- a animação começa quando o slide aparece ----------
   Um d3.timer solto dispara no load e nunca para: chegando no slide 3
   você pega a história no meio, e nunca vê o começo, que é onde a
   metáfora se explica. */
test('a animação fica congelada enquanto o slide não está na tela', () => {
    const p = projeto();
    try {
        const html = p.novo('congela');
        /* slide entra só aos 3000ms: tudo antes disso tem que ser o
           mesmo primeiro quadro, repetido */
        const r = rodarAnimacoes(html, { entraEm: 3000 });
        assert.ok(r.observados >= 2, 'cada animação observa o próprio slide');

        /* congelado não é "desenha pouco", é "desenha SEMPRE O MESMO".
           Alguns transforms são offsets fixos (as asas, por exemplo), então
           contar valores distintos não diz nada: o que importa é o quadro
           inteiro ser idêntico de um instante escondido para outro. */
        const quadroEm = (ms) => r.noInstante(ms).map((x) => x.k + '=' + x.v).join('|');
        assert.ok(quadroEm(1000).length > 0, 'desenhou o quadro inicial mesmo escondido');
        assert.equal(quadroEm(2000), quadroEm(1000), 'quadro parado enquanto escondido');
        assert.equal(quadroEm(2960), quadroEm(1000), 'ainda parado às vésperas de aparecer');
        /* e depois de aparecer tem que se mexer, senão o teste passaria
           com uma animação simplesmente quebrada */
        assert.notEqual(quadroEm(4000), quadroEm(1000), 'destrava ao aparecer');
    } finally { p.limpar(); }
});

test('ao aparecer, a história começa do zero e não do meio', () => {
    const p = projeto();
    try {
        const html = p.novo('do-zero');
        /* o mesmo instante relativo tem que dar o mesmo desenho,
           independentemente de quanto tempo o slide ficou escondido */
        /* as duas entradas são > 0 de propósito: em t=0 rodam também os
           desenhos de MONTAGEM (as marcas do mostrador), que não fazem
           parte do quadro e sujariam a comparação */
        const cedo = rodarAnimacoes(html, { entraEm: 1000 });
        const tarde = rodarAnimacoes(html, { entraEm: 6000 });
        const chave = (linhas) => linhas.filter((x) => x.k === 'transform').map((x) => x.v).join('|');

        assert.ok(chave(cedo.noInstante(1000)).length > 0, 'há quadro para comparar');
        assert.equal(chave(tarde.noInstante(6000)), chave(cedo.noInstante(1000)),
            'aparecer aos 6s dá o mesmo primeiro quadro de aparecer aos 1s');
        assert.equal(chave(tarde.noInstante(8000)), chave(cedo.noInstante(3000)),
            '2s depois de aparecer é sempre o mesmo momento da história');
        assert.equal(chave(tarde.noInstante(11000)), chave(cedo.noInstante(6000)),
            '5s depois de aparecer também');
    } finally { p.limpar(); }
});

test('sem IntersectionObserver a animação roda solta, sem quebrar', () => {
    const p = projeto();
    try {
        const r = rodarAnimacoes(p.novo('sem-io'), { semObserver: true });
        assert.deepEqual(r.ruins, [], 'nenhum NaN no caminho degradado');
        assert.ok(r.posicoes.size > 200, 'anima mesmo sem o observer');
    } finally { p.limpar(); }
});

/* ---------- a recomendação tem que ser VISÍVEL ---------- */
test('mira-default vem em primeiro na lista, marcado como recomendado', () => {
    const p = projeto();
    try {
        /* "new" sem nome imprime a lista de templates e sai com erro */
        let saida = '';
        try {
            execFileSync(process.execPath, [MIRA, 'new'], { cwd: p.dir, encoding: 'utf8', stdio: 'pipe' });
        } catch (e) { saida = (e.stdout || '') + (e.stderr || ''); }

        const linha = saida.split(/\r?\n/).find((l) => l.includes('Decks:'));
        assert.ok(linha, 'a lista de decks é impressa');
        const lista = linha.split('Decks:')[1].trim();
        assert.ok(lista.startsWith('mira-default'), 'vem em primeiro: ' + lista);
        assert.match(lista, /mira-default \(recomendado\)/, 'marcado como recomendado');
        /* alfabético esconderia o padrão no meio da lista */
        assert.ok(lista.indexOf('mira-default') < lista.indexOf('aula-capitulo'));
    } finally { p.limpar(); }
});

test('a skill do /mira-new manda listar o recomendado primeiro', () => {
    const skill = readFileSync(join(RAIZ, 'agents', 'mira-new', 'SKILL.md'), 'utf8');
    assert.match(skill, /mira-default.*SEMPRE em primeiro/s);
    assert.match(skill, /\(recomendado\)/);
});

test('o template mora na pasta de templates do Mira e viaja no pacote', () => {
    const dir = join(RAIZ, 'templates', 'decks', 'mira-default');
    assert.ok(existsSync(join(dir, 'index.html')), 'templates/decks/mira-default/index.html existe');
    /* package.json publica a pasta templates/ inteira: sem isso, o template
       não chegaria em quem instala pelo npm */
    const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
    assert.ok(pkg.files.includes('templates/'), 'templates/ está no files do package.json');
});

/* ---------- o desenho da caneta (P) pertence ao slide ----------
   O mira-draw pinta num canvas único fixo sobre a janela. Sem trocar os
   traços junto com o slide, o que você desenhou num slide fica pairando
   sobre todos os outros. */
function rodarNavegacao(html, alturaSlide = 500) {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
        .map((m) => m[1]).find((s) => /ArrowRight/.test(s));
    assert.ok(script, 'o deck tem o script de navegação');

    /* 4 seções; a "visível" é a que cobre o meio da janela */
    let topo = 0;
    const secoes = Array.from({ length: 4 }, (_, i) => ({
        getBoundingClientRect: () => ({ top: i * alturaSlide - topo, bottom: (i + 1) * alturaSlide - topo }),
        scrollIntoView: () => { topo = i * alturaSlide; }
    }));

    /* mira-draw falso: um canvas só, como o de verdade */
    let traços = [];
    const miraDraw = {
        getShapes: () => traços.slice(),
        setShapes: (s) => { traços = s.slice(); }
    };

    const ouvintes = {};
    const window = {
        innerHeight: alturaSlide,
        miraDraw,
        addEventListener: (ev, fn) => { (ouvintes[ev] = ouvintes[ev] || []).push(fn); }
    };
    const document = {
        querySelectorAll: () => secoes,
        addEventListener: () => { },
        body: { classList: { contains: () => false } }
    };
    new Function('window', 'document', script)(window, document);

    const disparar = (ev) => (ouvintes[ev] || []).forEach((f) => f());
    disparar('load');
    return {
        irPara(i) { topo = i * alturaSlide; disparar('scroll'); },
        desenhar(marca) { traços.push(marca); },
        get traçosVisiveis() { return traços.slice(); }
    };
}

test('o desenho feito num slide não aparece nos outros', () => {
    const p = projeto();
    try {
        const nav = rodarNavegacao(p.novo('desenho'));

        nav.desenhar('risco-do-slide-0');
        assert.deepEqual(nav.traçosVisiveis, ['risco-do-slide-0']);

        nav.irPara(1);
        assert.deepEqual(nav.traçosVisiveis, [], 'canvas limpo no slide seguinte');

        nav.desenhar('risco-do-slide-1');
        nav.irPara(2);
        assert.deepEqual(nav.traçosVisiveis, [], 'nem o do slide 0 nem o do slide 1');
    } finally { p.limpar(); }
});

test('voltando ao slide, o desenho dele volta', () => {
    const p = projeto();
    try {
        const nav = rodarNavegacao(p.novo('volta'));
        nav.desenhar('a');
        nav.irPara(1);
        nav.desenhar('b');
        nav.irPara(0);
        assert.deepEqual(nav.traçosVisiveis, ['a'], 'o traço do slide 0 voltou');
        nav.irPara(1);
        assert.deepEqual(nav.traçosVisiveis, ['b'], 'e o do slide 1 continua lá');
    } finally { p.limpar(); }
});
