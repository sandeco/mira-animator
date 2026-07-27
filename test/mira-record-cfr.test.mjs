/* =====================================================================
   mira-record-cfr.test.mjs
   ---------------------------------------------------------------------
   A grade CFR da gravação nativa (tecla R), nos dois gravadores:
   templates/authoring/mira-record-16x9.js e mira-record.js.

   O defeito que este teste tranca: a trilha de vídeo saía VFR
   (timestamps de captura + descarte por backpressure), o VLC e o Chrome
   tocavam certo porque honram PTS, e o Adobe Premiere — que conforma
   VFR numa grade fixa — deslocava o áudio PROGRESSIVAMENTE ao longo do
   clipe. Cada buraco na linha do tempo virava drift acumulado.

   Testa o Worker DE VERDADE: extrai o corpo de recordWorkerBody() do
   arquivo fonte (é ele que vira Blob Worker no navegador) e roda dentro
   de um sandbox com stubs de WebCodecs. Não é uma reimplementação da
   regra — é o mesmo código que o deck executa.

   Rodar:  node --test test/mira-record-cfr.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAVADORES = [
    { nome: 'mira-record-16x9.js', out: { w: 1920, h: 1080 } },
    { nome: 'mira-record.js', out: { w: 1080, h: 1920 } }
];
const FPS = 30;
/* timescale que o mp4-muxer usa na trilha de vídeo quando o deck não
   declara frameRate. É NELE que o PTS vira número inteiro no arquivo, e
   é dele que o ffprobe tira r_frame_rate/avg_frame_rate. */
const TIMESCALE = 57600;
const UNIDADES_POR_FRAME = TIMESCALE / FPS;   /* 1920 */

/* corpo do Worker, direto do arquivo distribuído */
function corpoDoWorker(nome) {
    const src = readFileSync(join(RAIZ, 'templates', 'authoring', nome), 'utf8').replace(/\r\n/g, '\n');
    const ini = src.indexOf('    function recordWorkerBody() {');
    assert.ok(ini >= 0, `recordWorkerBody() não encontrado em ${nome}`);
    const fim = src.indexOf('\n    }\n', ini);
    assert.ok(fim > ini, `fim de recordWorkerBody() não encontrado em ${nome}`);
    return src.slice(ini, fim + 6).trim();
}

/* Roda uma "gravação" inteira no sandbox.
   `frames`: timestamps de captura (µs) que a track entrega.
   `drain`: quantos frames o encoder tira da fila por frame lido — é o
   que simula backpressure (0.7 = encoder mais lento que a captura). */
function gravar(nome, { cfr, frames, out, forceCanvas = false, drain = 99 }) {
    const chunks = [];    /* o que chegaria ao muxer: {ts, dur, key} */
    const posts = [];
    let pendente = 0;

    class FakeVideoFrame {
        constructor(source, init = {}) {
            this.timestamp = init.timestamp !== undefined ? init.timestamp : (source && source.timestamp) || 0;
            this.duration = init.duration;
            this.displayWidth = (source && (source.displayWidth || source.width)) || out.w;
            this.displayHeight = (source && (source.displayHeight || source.height)) || out.h;
            this.closed = false;
            FakeVideoFrame.abertos.add(this);
        }
        clone() { return new FakeVideoFrame(this, { timestamp: this.timestamp }); }
        close() { this.closed = true; FakeVideoFrame.abertos.delete(this); }
    }
    FakeVideoFrame.abertos = new Set();

    class FakeVideoEncoder {
        constructor(init) { this.init = init; this.state = 'unconfigured'; }
        get encodeQueueSize() { return pendente; }
        configure() { this.state = 'configured'; }
        encode(vf, opts) {
            /* codificar frame já fechado é bug de ciclo de vida, não detalhe */
            assert.equal(vf.closed, false, 'encode() recebeu um VideoFrame fechado');
            chunks.push({ ts: vf.timestamp, dur: vf.duration, key: !!(opts && opts.keyFrame) });
            pendente++;
            this.init.output({ byteLength: 100, timestamp: vf.timestamp }, null);
        }
        flush() { return Promise.resolve(); }
        close() { this.state = 'closed'; }
    }

    let idx = 0;
    const readable = {
        getReader() {
            return {
                read() {
                    pendente = Math.max(0, pendente - drain);
                    if (idx >= frames.length) return Promise.resolve({ done: true });
                    return Promise.resolve({ done: false, value: new FakeVideoFrame(null, { timestamp: frames[idx++] }) });
                },
                cancel() { return Promise.resolve(); }
            };
        }
    };

    const self_ = { postMessage(m) { posts.push(m); }, performance: { now: () => 0 } };
    const sandbox = {
        self: self_, VideoFrame: FakeVideoFrame, VideoEncoder: FakeVideoEncoder,
        AudioEncoder: class { }, OffscreenCanvas: class {
            constructor(w, h) { this.width = w; this.height = h; }
            getContext() { return { drawImage() { }, imageSmoothingEnabled: true, imageSmoothingQuality: '' }; }
        },
        setInterval: () => 0, clearInterval: () => { },
        Math, Promise, Date, Object, Array, String, Number, JSON,
        importScripts() {
            sandbox.Mp4Muxer = {
                ArrayBufferTarget: class { constructor() { this.buffer = new ArrayBuffer(8); } },
                Muxer: class {
                    constructor(o) { this.opts = o; this.target = o.target; }
                    addVideoChunk() { } addAudioChunk() { } finalize() { }
                }
            };
        }
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext('(' + corpoDoWorker(nome) + ')();', sandbox);

    self_.onmessage({
        data: {
            type: 'start', muxerUrl: 'stub', forceCanvas,
            config: {
                out, video: { codec: 'avc1.640028', width: out.w, height: out.h },
                audio: null, cfr, fps: FPS
            },
            videoReadable: readable
        }
    });

    return new Promise(res => setTimeout(() => {
        self_.onmessage({ data: { type: 'stop' } });
        setTimeout(() => res({
            chunks, posts,
            abertos: FakeVideoFrame.abertos.size,
            stats: (posts.find(p => p.type === 'done') || {}).stats || null
        }), 20);
    }, 20));
}

/* o que o MP4 realmente guarda: PTS convertido para o timescale da track */
function unidades(chunks) { return chunks.map(c => Math.round(c.ts / 1e6 * TIMESCALE)); }
function deltas(us) { return [...new Set(us.slice(1).map((u, i) => u - us[i]))]; }

/* captura ideal a 30 fps */
function capturaLimpa(n, base = 0) {
    const ts = [];
    for (let i = 0; i < n; i++) ts.push(base + Math.round(i * 1e6 / FPS));
    return ts;
}

for (const g of GRAVADORES) {
    test(`${g.nome} · CFR: captura limpa vira grade exata (30/1 no ffprobe)`, async () => {
        const r = await gravar(g.nome, { cfr: true, frames: capturaLimpa(90, 1000000), out: g.out });
        assert.equal(r.chunks.length, 90);
        assert.equal(r.chunks[0].ts, 0, 'a grade começa no slot 0');
        /* o critério que o Premiere usa: delta CONSTANTE na tabela de tempos.
           É por isso que o PTS é arredondado por slot e não n * 33333. */
        assert.deepEqual(deltas(unidades(r.chunks)), [UNIDADES_POR_FRAME]);
        assert.ok(r.chunks.every(c => c.dur > 0), 'todo frame sai com duração explícita');
        assert.equal(r.stats.mode, 'cfr');
        assert.equal(r.stats.dupFilled, 0, 'captura limpa não gera duplicata');
        assert.equal(r.abertos, 0, 'nenhum VideoFrame vazou');
    });

    test(`${g.nome} · CFR: buraco na captura é preenchido, sem furo na linha do tempo`, async () => {
        /* 1 frame a cada 3 some (é o que o backpressure/GPU ocupada causa) */
        const ts = capturaLimpa(90).filter((_, i) => i % 3 !== 1);
        const r = await gravar(g.nome, { cfr: true, frames: ts, out: g.out });
        assert.deepEqual(deltas(unidades(r.chunks)), [UNIDADES_POR_FRAME]);
        assert.equal(r.chunks.length, 90, 'todos os slots cobertos');
        assert.equal(r.stats.dupFilled, 30, 'os 30 slots vazios viraram duplicata');
    });

    test(`${g.nome} · CFR: buraco maior que 2 s é saltado e contabilizado`, async () => {
        /* aba congelada: duplicar minutos de tela parada custaria mais que o
           buraco — mas o salto não pode ser silencioso */
        const r = await gravar(g.nome, {
            cfr: true, out: g.out,
            frames: [0, 33333, 5000000, 5033333]
        });
        assert.equal(r.stats.gapJumped, 1);
        assert.equal(r.chunks.length, 4, 'não inventou 150 frames congelados');
    });

    test(`${g.nome} · CFR: dois frames no mesmo slot descartam o segundo`, async () => {
        const r = await gravar(g.nome, { cfr: true, out: g.out, frames: [0, 5000, 33333, 40000, 66667] });
        assert.equal(r.stats.dupDropped, 2);
        assert.equal(r.chunks.length, 3);
    });

    test(`${g.nome} · CFR: backpressure derruba frame mas não abre buraco`, async () => {
        const r = await gravar(g.nome, { cfr: true, out: g.out, frames: capturaLimpa(60), drain: 0.7 });
        assert.ok(r.stats.dropped > 0, 'o cenário precisa mesmo derrubar frames');
        assert.deepEqual(deltas(unidades(r.chunks)), [UNIDADES_POR_FRAME]);
        /* a grade cobre TODOS os slots até o último aceito; a cauda derrubada
           no fim não tem frame seguinte para preencher (perda de fração de
           segundo no final, não drift progressivo) */
        const ultimoSlot = Math.round(r.chunks[r.chunks.length - 1].ts / 1e6 * FPS);
        assert.equal(r.chunks.length, ultimoSlot + 1, 'nenhum slot faltando até o último aceito');
    });

    test(`${g.nome} · CFR: caminho canvas (recorte no worker) usa a mesma grade`, async () => {
        const ts = capturaLimpa(60).filter((_, i) => i % 4 !== 2);
        const r = await gravar(g.nome, { cfr: true, out: g.out, frames: ts, forceCanvas: true });
        assert.deepEqual(deltas(unidades(r.chunks)), [UNIDADES_POR_FRAME]);
        assert.equal(r.chunks.length, 60);
        assert.equal(r.abertos, 0);
    });

    test(`${g.nome} · CFR: keyframe a cada 2 s, alinhado à grade`, async () => {
        const r = await gravar(g.nome, { cfr: true, out: g.out, frames: capturaLimpa(300) });
        const keys = r.chunks.map((c, i) => (c.key ? i : -1)).filter(i => i >= 0);
        assert.deepEqual(keys, [0, 60, 120, 180, 240]);
    });

    test(`${g.nome} · VFR (chave desligada): comportamento antigo intacto`, async () => {
        const ts = [1000000, 1033333, 1077777, 1120000];
        const r = await gravar(g.nome, { cfr: false, out: g.out, frames: ts });
        assert.deepEqual(r.chunks.map(c => c.ts), ts, 'PTS de captura passam direto');
        assert.ok(r.chunks.every(c => c.dur === undefined), 'sem duração declarada, como antes');
        assert.equal(r.stats.mode, 'vfr');
        assert.equal(r.stats.dupFilled, 0);
        assert.equal(r.stats.gapJumped, 0);
    });
}

/* A chave do painel: LIGADA por padrão, persistida, e o config que vai ao
   Worker carrega cfr/fps. Sem isso o Worker cai no VFR mesmo com o código
   novo — o defeito voltaria calado. */
for (const g of GRAVADORES) {
    test(`${g.nome} · painel: chave "CFR (edição)" ligada por padrão e ligada ao config`, () => {
        const src = readFileSync(join(RAIZ, 'templates', 'authoring', g.nome), 'utf8');
        assert.match(src, /id="mrc-cfr"><input type="checkbox" checked>/, 'chave nasce marcada');
        assert.match(src, /localStorage\.getItem\('mira-rec-cfr'\)/, 'preferência é lida');
        assert.match(src, /localStorage\.setItem\('mira-rec-cfr'/, 'preferência é gravada');
        assert.match(src, /cfr: cfrWanted\(\)/, 'o config do Worker leva a chave');
        assert.match(src, /fps: FPS/, 'o config do Worker leva o FPS da grade');
        /* o defeito A (offset inicial) continua corrigido do jeito antigo */
        assert.match(src, /firstTimestampBehavior: 'offset'/);
        assert.doesNotMatch(src, /firstTimestampBehavior: 'cross-track-offset'/);
    });
}
