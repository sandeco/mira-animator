/* =====================================================================
   mira-record-sync.test.mjs
   ---------------------------------------------------------------------
   Alinhamento entre as trilhas de áudio e vídeo na gravação nativa
   (tecla R), nos dois gravadores.

   BUG-20260815-HYRG: as duas trilhas são zeradas SEPARADAMENTE. O vídeo
   ancora no primeiro VideoFrame (slotT0) e o áudio ancora no próprio
   primeiro AudioData, porque o muxer roda com firstTimestampBehavior
   'offset', que no mp4-muxer subtrai de cada trilha o primeiro
   timestamp DAQUELA trilha. A distância real entre o início das duas
   capturas é descartada e reaparece no arquivo como deslocamento fixo.

   Mesma técnica de mira-record-cfr.test.mjs: extrai o corpo de
   recordWorkerBody() do arquivo distribuído e roda num sandbox com
   stubs de WebCodecs. É o mesmo código que o deck executa.

   Rodar:  node --test test/mira-record-sync.test.mjs
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

/* As duas origens de relógio do relato: a captura de tela chega no
   relógio de uptime (valor alto) e o microfone chega perto de zero.
   A diferença entre elas é EXATAMENTE o que o arquivo deveria
   preservar e hoje perde. */
/* Valores REAIS medidos na máquina do autor em 2026-08-16 (diagnóstico JSON):
   firstVideoUs 290846800 e firstAudioUs 290845672, ou seja o áudio começou
   30,4 ms ANTES do vídeo na segunda gravação. É essa distância que o arquivo
   descartava. */
const T0_VIDEO_US = 290_846_800;
const T0_AUDIO_US = 290_816_442;   /* 30,358 ms antes do vídeo */
const DELTA_US = T0_AUDIO_US - T0_VIDEO_US;

function corpoDoWorker(nome) {
    const src = readFileSync(join(RAIZ, 'templates', 'authoring', nome), 'utf8').replace(/\r\n/g, '\n');
    const ini = src.indexOf('    function recordWorkerBody() {');
    assert.ok(ini >= 0, `recordWorkerBody() não encontrado em ${nome}`);
    const fim = src.indexOf('\n    }\n', ini);
    assert.ok(fim > ini, `fim de recordWorkerBody() não encontrado em ${nome}`);
    return src.slice(ini, fim + 6).trim();
}

/* Roda uma gravação com AS DUAS trilhas, cada uma com o próprio t0. */
function gravarComAudio(nome, { out, framesVideo, framesAudio }) {
    const videoChunks = [], audioChunks = [], posts = [];
    let muxerOpts = null;
    const muxV = [], muxA = [];
    let pendente = 0;

    class FakeVideoFrame {
        constructor(source, init = {}) {
            this.timestamp = init.timestamp !== undefined ? init.timestamp : (source && source.timestamp) || 0;
            this.duration = init.duration;
            this.displayWidth = (source && (source.displayWidth || source.width)) || out.w;
            this.displayHeight = (source && (source.displayHeight || source.height)) || out.h;
            this.closed = false;
        }
        clone() { return new FakeVideoFrame(this, { timestamp: this.timestamp }); }
        close() { this.closed = true; }
    }
    class FakeAudioData {
        constructor(ts) { this.timestamp = ts; this.closed = false; }
        close() { this.closed = true; }
    }
    class FakeVideoEncoder {
        constructor(init) { this.init = init; this.state = 'unconfigured'; }
        get encodeQueueSize() { return pendente; }
        configure() { this.state = 'configured'; }
        encode(vf) {
            videoChunks.push({ ts: vf.timestamp });
            this.init.output({ byteLength: 100, timestamp: vf.timestamp }, null);
        }
        flush() { return Promise.resolve(); }
        close() { this.state = 'closed'; }
    }
    class FakeAudioEncoder {
        constructor(init) { this.init = init; this.state = 'unconfigured'; this.encodeQueueSize = 0; }
        configure(cfg) { this.state = 'configured'; this.cfg = cfg; }
        encode(ad) {
            audioChunks.push({ ts: ad.timestamp });
            this.init.output({ byteLength: 40, timestamp: ad.timestamp }, null);
        }
        flush() { return Promise.resolve(); }
        close() { this.state = 'closed'; }
    }

    const leitorDe = (itens, faz) => {
        let i = 0;
        return {
            getReader() {
                return {
                    read() {
                        pendente = 0;
                        if (i >= itens.length) return Promise.resolve({ done: true });
                        return Promise.resolve({ done: false, value: faz(itens[i++]) });
                    },
                    cancel() { return Promise.resolve(); }
                };
            }
        };
    };

    const self_ = { postMessage(m) { posts.push(m); }, performance: { now: () => 0 } };
    const sandbox = {
        self: self_, VideoFrame: FakeVideoFrame, VideoEncoder: FakeVideoEncoder,
        AudioEncoder: FakeAudioEncoder, AudioData: FakeAudioData,
        OffscreenCanvas: class {
            constructor(w, h) { this.width = w; this.height = h; }
            getContext() { return { drawImage() { }, imageSmoothingEnabled: true, imageSmoothingQuality: '' }; }
        },
        setInterval: () => 0, clearInterval: () => { },
        Math, Promise, Date, Object, Array, String, Number, JSON,
        importScripts() {
            sandbox.Mp4Muxer = {
                ArrayBufferTarget: class { constructor() { this.buffer = new ArrayBuffer(8); } },
                Muxer: class {
                    constructor(o) { muxerOpts = o; this.target = o.target; }
                    /* o 3o argumento é o timestamp com que o chunk REALMENTE entra
                       no arquivo; é ele que decide o alinhamento */
                    addVideoChunk(c, m, ts) { muxV.push(ts === undefined ? c.timestamp : ts); }
                    addAudioChunk(c, m, ts) { muxA.push(ts === undefined ? c.timestamp : ts); }
                    finalize() { }
                }
            };
        }
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext('(' + corpoDoWorker(nome) + ')();', sandbox);

    self_.onmessage({
        data: {
            type: 'start', muxerUrl: 'stub', forceCanvas: false,
            config: {
                out, video: { codec: 'avc1.640028', width: out.w, height: out.h },
                audio: { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 1, bitrate: 128000 },
                cfr: true, fps: FPS
            },
            videoReadable: leitorDe(framesVideo, ts => new FakeVideoFrame(null, { timestamp: ts })),
            audioReadable: leitorDe(framesAudio, ts => new FakeAudioData(ts))
        }
    });

    return new Promise(res => setTimeout(() => {
        self_.onmessage({ data: { type: 'stop' } });
        setTimeout(() => res({
            videoChunks, audioChunks, posts, muxerOpts, muxV, muxA,
            stats: (posts.find(p => p.type === 'done') || {}).stats || null
        }), 30);
    }, 30));
}

function serie(n, t0, passoUs) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(t0 + Math.round(i * passoUs));
    return a;
}

for (const g of GRAVADORES) {

    /* ---------------------------------------------------------------
       CORREÇÃO (BUG-20260815-HYRG): as duas trilhas entram no muxer numa
       origem COMUM, então a distância real entre as capturas sobrevive
       no arquivo em vez de ser descartada.
       --------------------------------------------------------------- */
    test(`${g.nome} · HYRG: a distância entre as duas capturas sobrevive no arquivo`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: serie(30, T0_AUDIO_US, 1e6 / FPS)
        });
        assert.ok(r.muxV.length && r.muxA.length, 'as duas trilhas chegaram ao muxer');
        /* o áudio começou 30,358 ms antes: no arquivo ele tem que começar em 0
           e o vídeo 30,358 ms depois. Antes da correção AMBOS começavam em 0. */
        assert.equal(r.muxA[0], 0, 'a trilha que começou antes ancora em zero');
        assert.equal(r.muxV[0], -DELTA_US, 'o vídeo entra deslocado pela distância medida');
        assert.notEqual(r.muxV[0], 0, 'se o vídeo voltasse a zero, a distância teria sido descartada de novo');
    });

    test(`${g.nome} · HYRG: o muxer não pode voltar a zerar cada trilha sozinho`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: serie(30, T0_AUDIO_US, 1e6 / FPS)
        });
        /* 'offset' zera CADA trilha na própria origem e desfaz o basing acima.
           'cross-track-offset' subtrai o mínimo comum, que aqui já é zero. */
        assert.equal(r.muxerOpts.firstTimestampBehavior, 'cross-track-offset');
    });

    test(`${g.nome} · HYRG: relógios em bases incomparáveis não recebem alinhamento inventado`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: serie(30, 1_000, 1e6 / FPS)   /* áudio ~290 s "antes": outra base */
        });
        /* é o caso que produziu o commit 6e84363. A porta detecta e volta ao
           comportamento antigo em vez de jogar o áudio para 290 segundos. */
        assert.equal(r.muxV[0], 0, 'o vídeo volta a ancorar em zero');
        assert.ok(r.muxA[0] < 5_000_000, 'o áudio não é atirado para minutos adiante');
        const falha = (r.posts.find(p => p.type === 'done') || {});
        assert.ok(JSON.stringify(r.posts).includes('av-relogios'), 'a degradação é declarada, não silenciosa');
    });

    test(`${g.nome} · HYRG: a grade de vídeo continua regular depois do alinhamento`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: serie(30, T0_AUDIO_US, 1e6 / FPS)
        });
        /* O critério é o mesmo do mira-record-cfr.test.mjs: delta constante na
           tabela de tempos do MP4, medido no TIMESCALE da track (57600), não em
           microssegundos. Em µs o arredondamento por slot alterna 33333/33334 de
           propósito; é justamente isso que mantém o stts constante no arquivo. */
        const TIMESCALE = 57600;
        const u = r.muxV.map(t => Math.round(t / 1e6 * TIMESCALE));
        const d = [...new Set(u.slice(1).map((v, i) => v - u[i]))];
        assert.equal(d.length, 1, 'delta constante no timescale: ' + JSON.stringify(d));
        assert.equal(d[0], TIMESCALE / FPS, 'e igual a um quadro de 30 fps');
    });

    /* ---------------------------------------------------------------
       REPRODUÇÃO: falha HOJE. É o instrumento que o bug exige.
       Sem publicar a distância medida entre as duas âncoras, ninguém
       consegue verificar o alinhamento do arquivo — foi assim que a
       afirmação errada de SKILL.md:82 sobreviveu.
       --------------------------------------------------------------- */
    test(`${g.nome} · HYRG: o diagnóstico publica a distância medida entre as âncoras das duas trilhas`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: serie(30, T0_AUDIO_US, 1e6 / FPS)
        });
        assert.ok(r.stats, 'a gravação terminou e emitiu stats');
        assert.ok(r.stats.av, 'stats.av existe: é o instrumento de medição do alinhamento A/V');
        assert.equal(r.stats.av.firstVideoUs, T0_VIDEO_US, 'o primeiro timestamp de vídeo é registrado');
        assert.equal(r.stats.av.firstAudioUs, T0_AUDIO_US, 'o primeiro timestamp de áudio é registrado');
        /* a distância que o arquivo descarta, em ms, com sinal:
           negativa = áudio começou ANTES do vídeo */
        assert.equal(r.stats.av.deltaMs, (T0_AUDIO_US - T0_VIDEO_US) / 1000);
    });

    test(`${g.nome} · HYRG: sem microfone, o instrumento não inventa medição`, async () => {
        const r = await gravarComAudio(g.nome, {
            out: g.out,
            framesVideo: serie(30, T0_VIDEO_US, 1e6 / FPS),
            framesAudio: []
        });
        assert.ok(r.stats, 'a gravação terminou e emitiu stats');
        assert.ok(r.stats.av, 'stats.av existe mesmo sem áudio');
        assert.equal(r.stats.av.firstVideoUs, T0_VIDEO_US);
        assert.equal(r.stats.av.firstAudioUs, null, 'sem áudio, a âncora de áudio é null');
        assert.equal(r.stats.av.deltaMs, null, 'sem as duas âncoras não há distância a declarar');
    });
}
