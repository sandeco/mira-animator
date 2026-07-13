/* =====================================================================
   mira-record.js  ·  Gravação nativa do MIRA (decks mira-studio)
   ---------------------------------------------------------------------
   Painel de gravação no lado DIREITO da tela (fora da coluna 9:16,
   portanto fora do vídeo) que grava SOMENTE a área dos slides e baixa
   o arquivo pronto, sem OBS.

   ARQUITETURA (fluidez = tirar o trabalho por frame do main thread)
   -----------------------------------------------------------------
   O deck renderiza câmera ao vivo + animações no main thread. Se a
   gravação também disputar o main thread (drawImage, VideoFrame,
   encode), a página inteira engasga — câmera E slides travam — mesmo
   com encoder de hardware, porque o gargalo é a PREPARAÇÃO do frame,
   não a compressão. A solução definitiva move captura->escala->encode
   para um Worker dedicado:

     - Captura a própria aba via getDisplayMedia (preferCurrentTab).
     - Region Capture (CropTarget.fromElement + track.cropTo) recorta a
       coluna no compositor do navegador (GPU), quando disponível.
     - MediaStreamTrackProcessor puxa VideoFrame's DIRETO da track
       recortada — sem <video>, sem requestVideoFrameCallback, sem
       canvas 2D no main thread. O readable é TRANSFERIDO ao Worker.
     - No Worker: VideoEncoder codifica os frames direto (a escala pra
       1080x1920 é feita pelo próprio encoder; resolução constante na
       saída => avc1 aceito por WhatsApp/Instagram/YouTube sem reencode).
       Se o encoder recusar frames de tamanho diferente, o Worker cai
       para um OffscreenCanvas de escala — ainda fora do main thread.
       Backpressure real: descarta frames não-chave quando
       encodeQueueSize >= 2; timestamps preservados (VFR); keyframe a
       cada 2s. Áudio do microfone via MediaStreamTrackProcessor ->
       AudioEncoder AAC no mesmo Worker. Mux MP4 via mp4-muxer
       (importScripts no Worker), com firstTimestampBehavior
       'cross-track-offset' (preserva o offset real entre A/V).
     - O main thread só renderiza a página e recebe o MP4 pronto no fim.
       Zero callback de gravação por frame no main thread.

   Encoder selecionável no painel (estilo OBS):
     Auto — Worker/WebCodecs com hardwareAcceleration 'no-preference'
       (o Chrome escolhe hardware quando houver).
     Hardware preferido / Software (CPU) — Worker/WebCodecs com
       hardwareAcceleration 'prefer-hardware' / 'prefer-software'.
   hardwareAcceleration é uma PREFERÊNCIA, não garantia: o painel diz
   "hardware preferido" e reporta métricas reais (fps efetivo, frames
   descartados) em vez de afirmar qual GPU está ativa.

   Fallback (navegador sem WebCodecs/TrackProcessor/OffscreenCanvas):
   MediaRecorder com o canvas fixo 1080x1920 no main thread (caminho
   antigo, mantido só para compatibilidade).

   Microfone opcional (toggle no painel), mixado na gravação.
   Tecla R liga/desliga a gravação (quieta nos modos E/P e digitação).

   Requisitos: Chrome/Edge atuais. Ao iniciar, escolha "Esta guia"
   no seletor de captura do navegador.
   ===================================================================== */
(function () {
    'use strict';
    if (typeof document === 'undefined') return;

    var FPS = 30, BITRATE = 12000000, OUT_W = 1080, OUT_H = 1920, KEY_US = 2000000;

    /* pipeline em Worker disponível? (caminho primário) */
    var CAN_WORKER = typeof Worker !== 'undefined' && typeof VideoEncoder !== 'undefined' &&
        typeof MediaStreamTrackProcessor !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

    /* ---------- estilos ---------- */
    function injectCss() {
        if (document.getElementById('mira-record-css')) return;
        var st = document.createElement('style');
        st.id = 'mira-record-css';
        st.textContent = [
            '#mrc-panel { position: fixed; right: 18px; top: 50%; transform: translateY(-50%);',
            '  z-index: 2147483000; width: 216px; padding: 16px; border-radius: 14px;',
            '  background: rgba(13, 13, 15, .94); border: 1px solid rgba(255, 144, 77, .5);',
            '  color: #f4f4f5; font: 500 13px/1.5 Inter, system-ui, sans-serif;',
            '  display: flex; flex-direction: column; gap: 10px;',
            '  cursor: grab; touch-action: none; }',
            '#mrc-panel.mrc-drag { cursor: grabbing; user-select: none; }',
            '#mrc-panel h4 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .14em;',
            '  text-transform: uppercase; color: #FF904D; }',
            '#mrc-btn { border: 0; border-radius: 10px; padding: 12px 10px; cursor: pointer;',
            '  font: 800 15px Inter, system-ui, sans-serif; color: #0d0d0f; background: #FF904D; }',
            '#mrc-btn.rec { background: #e5484d; color: #fff; animation: mrcPulse 1.2s ease-in-out infinite; }',
            '@keyframes mrcPulse { 0%, 100% { opacity: 1; } 50% { opacity: .72; } }',
            '#mrc-status { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 15px; }',
            '#mrc-mic { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;',
            '  color: rgba(244, 244, 245, .8); }',
            '#mrc-enc, #mrc-qual { display: flex; align-items: center; gap: 8px; color: rgba(244, 244, 245, .8); }',
            '#mrc-enc select, #mrc-qual select { flex: 1 1 auto; min-width: 0; background: #1c1c20; color: #f4f4f5;',
            '  border: 1px solid rgba(255, 144, 77, .35); border-radius: 8px; padding: 5px 6px;',
            '  font: 500 12px Inter, system-ui, sans-serif; cursor: pointer; }',
            '#mrc-enc select:disabled, #mrc-qual select:disabled { opacity: .5; cursor: default; }',
            '#mrc-gpu { font-size: 11px; color: rgba(244, 244, 245, .6); overflow-wrap: break-word; }',
            '#mrc-gpu b { color: #FF904D; font-weight: 700; }',
            '#mrc-metrics { font-size: 11px; font-variant-numeric: tabular-nums; color: rgba(244, 244, 245, .7); }',
            '#mrc-metrics.warn { color: #FF904D; }',
            '#mrc-diag { font-size: 10px; font-variant-numeric: tabular-nums; color: rgba(244, 244, 245, .58); overflow-wrap: anywhere; }',
            '#mrc-diag-save { border: 1px solid rgba(255, 144, 77, .35); border-radius: 8px; padding: 6px;',
            '  background: #1c1c20; color: #f4f4f5; font: 600 11px Inter, system-ui, sans-serif; cursor: pointer; }',
            '#mrc-diag-save:disabled { display: none; }',
            '#mrc-note { font-size: 11.5px; color: rgba(244, 244, 245, .55); }',
            '#mrc-panel.mrc-tight { display: none; }',   /* painel sobreporia a coluna (e entraria no vídeo): some; tecla R continua */
            /* gravando, o snap "assenta" com animação smooth se o salto instant
               cair sub-pixel fora do ponto (zoom/DPI fracionário do Windows) e o
               micro-scroll entra no vídeo; navegação gravando já é instant */
            'html[data-mira-recording], html[data-mira-recording] body { scroll-snap-type: none !important; scroll-behavior: auto !important; }'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------- painel ---------- */
    var ui = {};
    function buildPanel() {
        var p = document.createElement('div');
        p.id = 'mrc-panel';
        p.innerHTML =
            '<h4>Gravação</h4>' +
            '<button id="mrc-btn" type="button">&#9679; Gravar</button>' +
            '<div id="mrc-status">pronto</div>' +
            '<label id="mrc-mic"><input type="checkbox" checked> microfone</label>' +
            '<label id="mrc-enc">encoder <select>' +
            '<option value="auto">Auto (navegador)</option>' +
            '<option value="gpu">Hardware preferido</option>' +
            '<option value="cpu">Software (CPU)</option>' +
            '</select></label>' +
            '<label id="mrc-qual">qualidade <select>' +
            '<option value="alta">Alta (1080x1920)</option>' +
            '<option value="desempenho">Desempenho (nativa)</option>' +
            '</select></label>' +
            '<div id="mrc-gpu"></div>' +
            '<div id="mrc-metrics"></div>' +
            '<div id="mrc-diag"></div>' +
            '<button id="mrc-diag-save" type="button" disabled>salvar diagnóstico JSON</button>' +
            '<div id="mrc-note">Grava só a coluna dos slides. Tecla R também liga/desliga. Ao iniciar, escolha "Esta guia".</div>';
        document.body.appendChild(p);
        ui.panel = p;
        ui.btn = p.querySelector('#mrc-btn');
        ui.status = p.querySelector('#mrc-status');
        ui.mic = p.querySelector('#mrc-mic input');
        ui.enc = p.querySelector('#mrc-enc select');
        ui.qual = p.querySelector('#mrc-qual select');
        ui.gpu = p.querySelector('#mrc-gpu');
        ui.metrics = p.querySelector('#mrc-metrics');
        ui.diag = p.querySelector('#mrc-diag');
        ui.diagSave = p.querySelector('#mrc-diag-save');
        ui.note = p.querySelector('#mrc-note');
        ui.btn.addEventListener('click', toggle);
        ui.diagSave.addEventListener('click', saveDiagnostics);
        setupEncoderSelect();
        setupQualitySelect();
        makeDraggable(p);
    }
    function note(msg) { ui.note.textContent = msg; }

    /* ---------- arrastar o painel ----------
       Pega em qualquer área "morta" do painel (botão, checkbox e label
       continuam clicáveis). No primeiro arrasto o posicionamento vira
       left/top em pixels (sai do right/top 50% do CSS) e fica limitado
       ao viewport. Atenção: sobre a coluna dos slides o painel ENTRA no
       vídeo gravado. */
    function makeDraggable(p) {
        var dx = 0, dy = 0, dragging = false;
        p.addEventListener('pointerdown', function (e) {
            if (e.target !== p && e.target.tagName !== 'H4' && e.target.id !== 'mrc-status' && e.target.id !== 'mrc-note') return;
            var r = p.getBoundingClientRect();
            dx = e.clientX - r.left; dy = e.clientY - r.top;
            p.style.left = r.left + 'px'; p.style.top = r.top + 'px';
            p.style.right = 'auto'; p.style.transform = 'none';
            dragging = true;
            p.classList.add('mrc-drag');
            p.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        p.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var x = Math.min(Math.max(e.clientX - dx, 0), window.innerWidth - p.offsetWidth);
            var y = Math.min(Math.max(e.clientY - dy, 0), window.innerHeight - p.offsetHeight);
            p.style.left = x + 'px'; p.style.top = y + 'px';
        });
        function end() { dragging = false; p.classList.remove('mrc-drag'); }
        p.addEventListener('pointerup', end);
        p.addEventListener('pointercancel', end);
    }

    /* ---------- formato de saída (fallback MediaRecorder) ----------
       A gravação por MediaRecorder passa por um canvas fixo de
       1080x1920, então a resolução NUNCA muda no meio do arquivo — avc1
       (parameter sets no header, a variante que WhatsApp e players
       exigem) é seguro e vem primeiro. avc3 fica de reserva. */
    function pickMime() {
        var prefs = [
            'video/mp4;codecs="avc1.640028,mp4a.40.2"',
            'video/mp4;codecs=avc1',
            'video/mp4;codecs="avc3.640028,mp4a.40.2"',
            'video/mp4;codecs=avc3',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm'
        ];
        for (var i = 0; i < prefs.length; i++) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(prefs[i])) return prefs[i];
        }
        return '';
    }

    /* ---------- encoder selecionável (estilo OBS) ----------
       Auto/Hardware/Software mapeiam para hardwareAcceleration do VideoEncoder
       no Worker. A escolha persiste em localStorage; opções que este
       computador não suporta são desabilitadas já no load
       (isConfigSupported). */
    var ENC_KEY = 'mira-record-encoder';
    function encMode() {
        var v = ui.enc ? ui.enc.value : 'auto';
        return v === 'gpu' || v === 'cpu' ? v : 'auto';
    }
    function hwAccel(mode) {
        return mode === 'gpu' ? 'prefer-hardware' : mode === 'cpu' ? 'prefer-software' : 'no-preference';
    }

    /* ---------- qualidade: Alta (1080x1920) x Desempenho (nativa) ----------
       No modo Desempenho o encoder é configurado na resolução NATIVA da
       coluna (geo × devicePixelRatio, sem upscale, limitado a 1080x1920),
       ~3x menos pixels a codificar em máquina fraca. Resolução constante
       (geometria congelada na gravação) mantém o avc1 válido. O alvo é
       CONGELADO no início da gravação (DPR/zoom/geo poderiam mudar). */
    var QUAL_KEY = 'mira-record-quality';
    function qualityMode() {
        try { return localStorage.getItem(QUAL_KEY) === 'desempenho' ? 'desempenho' : 'alta'; }
        catch (e) { return 'alta'; }
    }
    function even(n) { n = Math.round(n); return n % 2 ? n + 1 : n; }
    /* resolução-alvo: 'alta' = 1080x1920 fixo; 'desempenho' = geo×DPR com um
       ÚNICO fator de escala para caber em 1080x1920 preservando 9:16 */
    function targetOut() {
        if (qualityMode() !== 'desempenho' || !geo.ok || !geo.width) return { w: OUT_W, h: OUT_H };
        var dpr = window.devicePixelRatio || 1;
        var w0 = geo.width * dpr, h0 = w0 * 16 / 9;             /* a coluna é 9:16 cravado */
        var k = Math.min(OUT_W / w0, OUT_H / h0, 1);           /* nunca faz upscale além de 1080x1920 */
        /* deriva a largura da ALTURA já arredondada (formato vertical) para
           manter o 9:16 exato com dimensões pares */
        var h = even(h0 * k), w = even(h * 9 / 16);
        if (w < 2 || h < 2 || w > OUT_W || h > OUT_H) return { w: OUT_W, h: OUT_H };
        return { w: w, h: h };
    }
    /* bitrate proporcional aos pixels, com piso para não borrar texto:
       clamp(4 Mbps, 12 Mbps × pixelRatio, 12 Mbps) */
    function scaledBitrate(out) {
        var ratio = (out.w * out.h) / (OUT_W * OUT_H);
        return Math.max(4000000, Math.min(BITRATE, Math.round(BITRATE * ratio)));
    }
    function vencConfig(mode, out, bitrate) {
        out = out || { w: OUT_W, h: OUT_H };
        return {
            codec: 'avc1.640028', width: out.w, height: out.h,
            bitrate: bitrate || BITRATE, framerate: FPS,
            hardwareAcceleration: hwAccel(mode),
            latencyMode: 'realtime',
            bitrateMode: 'variable',
            alpha: 'discard',
            avc: { format: 'avc' }
        };
    }
    function setupQualitySelect() {
        var saved = qualityMode();
        ui.qual.value = saved;
        ui.qual.addEventListener('change', function () {
            var v = ui.qual.value === 'desempenho' ? 'desempenho' : 'alta';
            try { localStorage.setItem(QUAL_KEY, v); } catch (e) { }
            if (v === 'desempenho') {
                var o = targetOut();
                note('Qualidade Desempenho: grava na resolução nativa da coluna (~' + o.w + 'x' + o.h + '), menos carga de encode.');
            } else {
                note('Qualidade Alta: grava em 1080x1920 (padrão de reels).');
            }
        });
    }
    /* ---------- GPU: instalada x renderer ativo x encoder preferido -----
       O renderer WebGL é a GPU gráfica ATIVA do Chrome. A lista de GPUs
       instaladas vem do servidor local. WebCodecs só expõe uma preferência
       de hardware, não prova qual placa/encoder físico processou o vídeo. */
    var gpuName = '';
    function cleanGpuName(raw) {
        var s = String(raw || '');
        if (!s) return '';
        /* renderização por software = nenhuma GPU ativa para o Chrome */
        if (/SwiftShader|llvmpipe|Software\s?(Adapter|Rasterizer)/i.test(s)) return 'renderização por software (sem GPU)';
        /* "ANGLE (Intel, Intel(R) UHD Graphics (0x0000A788) Direct3D11 vs_5_0 ps_5_0, D3D11-32...)"
           -> "Intel UHD Graphics" */
        var m = s.match(/^ANGLE \((.*)\)$/);
        if (m) {
            var parts = m[1].split(', ');
            s = parts.length > 1 ? parts[1] : parts[0];
        }
        s = s.replace(/\s*\(0x[0-9A-Fa-f]+\)/g, '');
        s = s.replace(/(.+?)\s+(?:Direct3D\d+|D3D\d+|OpenGL|Vulkan|Metal)\b.*$/, '$1');
        s = s.replace(/\((R|TM|C)\)/gi, '');           /* Intel(R) -> Intel */
        s = s.replace(/\s+Laptop GPU$/i, '');          /* "RTX 4070 Laptop GPU" -> "RTX 4070" */
        return s.replace(/\s{2,}/g, ' ').trim();
    }
    function detectGpuName() {
        try {
            var c = document.createElement('canvas');
            var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
            if (!gl) return '';
            var dbg = gl.getExtension('WEBGL_debug_renderer_info');
            return cleanGpuName(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        } catch (e) { return ''; }
    }
    /* ---------- TODAS as GPUs da máquina (não só a ativa) ----------
       Páginas web SÓ enxergam a GPU onde o Chrome nasceu. A lista real
       das placas instaladas vem do servidor do launcher (/__mira/gpus, nomes do
       Windows via Win32_VideoController). Elas são exibidas como inventário,
       separadas do renderer ativo e do seletor de encoder: nenhuma página
       escolhe adaptador físico ou confirma NVENC em runtime. */
    function showGpuInventory(names, status) {
        if (!ui.gpu) return;
        var old = ui.gpu.querySelector('.mrc-installed');
        if (old) old.remove();
        var line = document.createElement('div');
        line.className = 'mrc-installed';
        if (location.protocol === 'file:') {
            line.textContent = 'GPUs instaladas: abra pelo mira-studio-windows.bat (file:// não consulta o Windows).';
        } else if (status === 'loading') {
            line.textContent = 'GPUs instaladas: consultando o Windows…';
        } else if (names && names.length) {
            line.textContent = 'GPUs instaladas: ' + names.join(' · ');
        } else if (status === 'error') {
            line.textContent = 'GPUs instaladas: consulta do Windows falhou; renderer ativo acima.';
        } else {
            line.textContent = 'GPUs instaladas: indisponíveis neste servidor.';
        }
        ui.gpu.appendChild(line);
    }
    function fetchSystemGpus(attempt) {
        attempt = attempt || 0;
        if (typeof fetch === 'undefined' || location.protocol === 'file:') {
            showGpuInventory([], 'file');
            return Promise.resolve([]);
        }
        if (!attempt) showGpuInventory([], 'loading');
        return fetch('/__mira/gpus', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
            .then(function (payload) {
                /* compatibilidade com servidor anterior, que devolvia array */
                if (Array.isArray(payload)) {
                    var legacy = payload.map(cleanGpuName).filter(Boolean);
                    showGpuInventory(legacy, 'ready'); return legacy;
                }
                var status = payload && payload.status || 'unavailable';
                var names = payload && Array.isArray(payload.gpus)
                    ? payload.gpus.map(cleanGpuName).filter(Boolean) : [];
                if (status === 'loading' && attempt < 12) {
                    showGpuInventory([], 'loading');
                    return new Promise(function (resolve) {
                        /* Cobre a janela de 15 s do PowerShell: o hint do
                           servidor é piso, não substitui o backoff crescente. */
                        var wait = Math.max(Number(payload && payload.retryAfterMs) || 0,
                            Math.min(250 * Math.pow(1.6, attempt), 2000));
                        setTimeout(function () { resolve(fetchSystemGpus(attempt + 1)); }, Math.max(100, Math.min(wait, 2000)));
                    });
                }
                showGpuInventory(names, status);
                return names;
            }).catch(function () {
                showGpuInventory([], 'error'); return [];
            });
    }
    /* linha do painel no formato "GPU - NVIDIA GeForce RTX 4070" */
    function showGpu() {
        gpuName = detectGpuName();
        ui.gpu.innerHTML = gpuName ? '<b></b>' : '';
        if (gpuName) ui.gpu.querySelector('b').textContent = 'Renderer ativo - ' + gpuName;
        else ui.gpu.textContent = 'Renderer ativo: não identificado.';
    }

    /* teste REAL do encoder ao selecionar GPU/CPU: configura um
       VideoEncoder com o hardwareAcceleration pedido e codifica frames
       de verdade — só passa se sair chunk codificado sem erro. Com
       prefer-hardware, passar significa hardware PREFERIDO aceito (não é
       garantia de NVENC específico: o Chrome escolhe o backend). */
    function testEncoder(mode) {
        return new Promise(function (done) {
            var chunks = 0, failed = '', enc;
            try {
                enc = new VideoEncoder({
                    output: function () { chunks++; },
                    error: function (e) { failed = failed || (e && e.message) || 'erro no encoder'; }
                });
                enc.configure(vencConfig(mode));
            } catch (e) { done({ ok: false, why: (e && e.message) || 'configure falhou' }); return; }
            var c = document.createElement('canvas');
            c.width = OUT_W; c.height = OUT_H;
            var x = c.getContext('2d');
            for (var i = 0; i < 5; i++) {
                x.fillStyle = i % 2 ? '#FF904D' : '#0d0d0f';
                x.fillRect(0, 0, OUT_W, OUT_H);
                var vf = new VideoFrame(c, { timestamp: i * 33333 });
                try { enc.encode(vf, { keyFrame: i === 0 }); }
                catch (e) { failed = failed || (e && e.message) || 'encode falhou'; }
                vf.close();
            }
            enc.flush().then(function () {
                try { enc.close(); } catch (e) { }
                done({ ok: !failed && chunks > 0, why: failed || (chunks ? '' : 'nenhum frame codificado') });
            }).catch(function (e) {
                try { enc.close(); } catch (e2) { }
                done({ ok: false, why: failed || (e && e.message) || 'flush falhou' });
            });
        });
    }

    function runEncTest(v) {
        note('Testando o encoder ' + (v === 'gpu' ? 'com hardware preferido' : 'em software') + '...');
        testEncoder(v).then(function (r) {
            if (ui.enc.value !== v) return;   /* usuário já trocou de novo */
            if (r.ok) {
                note('Encoder ' + (v === 'gpu' ? 'com hardware preferido' : 'em software') +
                    ' aceito. Isso não confirma uma GPU ou NVENC específicos.');
            } else {
                note('O encoder ' + (v === 'gpu' ? 'GPU' : 'CPU') + ' falhou no teste (' + r.why + '). Voltando para Auto.');
                ui.enc.value = 'auto';
                try { localStorage.setItem(ENC_KEY, 'auto'); } catch (e) { }
            }
        });
    }
    function setupEncoderSelect() {
        showGpu();
        var saved = '';
        try { saved = localStorage.getItem(ENC_KEY) || ''; } catch (e) { }
        if (saved === 'gpu' || saved === 'cpu') ui.enc.value = saved;

        ui.enc.addEventListener('change', function () {
            var v = ui.enc.value;
            try { localStorage.setItem(ENC_KEY, v); } catch (e) { }
            if (v !== 'gpu' && v !== 'cpu') {
                note('Encoder Auto: o navegador escolhe (hardware quando houver).');
                return;
            }
            if (isRec()) return;   /* o select fica desabilitado gravando; cinto de segurança */
            runEncTest(v);
        });

        function disableOpt(val, label) {
            var opt = ui.enc.querySelector('option[value="' + val + '"]');
            opt.disabled = true;
            if (label) opt.textContent = label;
            if (ui.enc.value === val) {
                ui.enc.value = 'auto';
                try { localStorage.setItem(ENC_KEY, 'auto'); } catch (e) { }
            }
        }
        if (typeof VideoEncoder === 'undefined') {
            disableOpt('gpu', 'Hardware (sem WebCodecs)');
            disableOpt('cpu', 'Software (sem WebCodecs)');
            return;
        }
        ['gpu', 'cpu'].forEach(function (mode) {
            VideoEncoder.isConfigSupported(vencConfig(mode)).then(function (r) {
                if (!r || !r.supported) disableOpt(mode, mode === 'gpu'
                    ? 'Hardware preferido (indisponível)'
                    : 'Software (indisponível)');
            }).catch(function () { disableOpt(mode); });
        });
        /* Inventário é somente informativo. Não vira opção do encoder: uma
           página não escolhe adaptador físico nem confirma NVENC. */
        fetchSystemGpus();
    }

    /* ---------- geometria: cacheada fora do loop de desenho ----------
       getBoundingClientRect força reflow; aqui ela roda só no init e em
       resize/scroll (com rAF-throttle), NUNCA a cada frame — e fica
       CONGELADA durante a gravação (o Region Capture segue o overlay;
       mexer na geometria no meio moveria a região gravada). */
    var geo = { left: 0, width: 0, ok: false };
    function readGeo() {
        var sec = document.querySelector('body > section');
        if (!sec) { geo.ok = false; return; }
        var r = sec.getBoundingClientRect();
        geo.left = r.left; geo.width = r.width; geo.ok = true;
        placeCropOverlay();
        /* o vídeo grava o que sobrepõe a coluna (z-index não protege no
           Region Capture): sem 240px livres à direita, o painel some */
        if (ui.panel) ui.panel.classList.toggle('mrc-tight', window.innerWidth - (geo.left + geo.width) < 240);
    }
    var geoRaf = 0;
    function queueGeo() {
        if (isRec()) return;   /* geometria congelada durante a gravação */
        if (geoRaf) return;
        geoRaf = requestAnimationFrame(function () { geoRaf = 0; readGeo(); });
    }

    /* ---------- crop target: overlay fixo com a geometria da coluna ----
       As <section> rolam verticalmente (recortar uma delas seguiria o
       slide para fora da tela); o overlay fixo cobre a coluna no
       viewport inteiro e o cropTo o acompanha em qualquer resize.
       NUNCA esconda o overlay com visibility/display: a spec do Region
       Capture não emite frame nenhum quando o alvo não é renderizado —
       um div transparente sem fundo já é invisível. */
    var cropEl = null;
    function ensureCropOverlay() {
        if (!cropEl) {
            cropEl = document.createElement('div');
            cropEl.id = 'mrc-crop';
            cropEl.style.cssText = 'position:fixed;top:0;bottom:0;pointer-events:none;';
            document.body.appendChild(cropEl);
        }
        placeCropOverlay();
        return cropEl;
    }
    function placeCropOverlay() {
        if (!cropEl || !geo.ok) return;
        cropEl.style.left = geo.left + 'px';
        cropEl.style.width = geo.width + 'px';
    }

    /* ---------- estado ---------- */
    var S = {
        worker: null, tab: null, vt: null, mic: null, stopping: false, busy: false, abort: false,
        t0: 0, timer: null, finalizeTimer: null, slowWarned: false, memWarned: false, gotMetrics: false, noAudio: false, out: null,
        diagRaf: 0, diagLastRaf: 0, navUntil: 0, maxNavRafMs: 0, maxNavLongMs: 0,
        maxNavPtsMs: 0, maxNavFirstFrameMs: 0, path: '', input: null, crop: null, lastStats: null,
        /* fallback MediaRecorder (só sem WebCodecs/TrackProcessor) */
        rec: null, vid: null, rvfc: 0, raf: 0, chunks: [], cvs: null
    };
    function isRec() { return !!(S.worker || S.rec || S.stopping); }

    function fmtTime(ms) {
        var s = Math.floor(ms / 1000);
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    /* ---------- diagnóstico de navegação e pipeline -------------------
       O medidor não prepara frames: observa apenas rAF/long tasks no main
       thread e recebe gaps PTS já calculados pelo Worker. A janela de 1,5 s
       começa no evento mira-navigation emitido pelo deck. */
    var longTaskObserver = null;
    function resetDiagnostics() {
        S.navUntil = 0; S.maxNavRafMs = 0; S.maxNavLongMs = 0; S.maxNavPtsMs = 0; S.maxNavFirstFrameMs = 0;
        S.path = ''; S.input = null; S.crop = null; S.out = null; S.lastStats = null;
        if (ui.diag) ui.diag.textContent = 'diagnóstico aguardando frames';
        if (ui.diagSave) ui.diagSave.disabled = true;
    }
    function diagObject(extra) {
        return Object.assign({
            generatedAt: new Date().toISOString(),
            renderer: gpuName || 'não identificado',
            encoderPreference: encMode(),
            quality: qualityMode(),
            output: S.out || null,
            input: S.input,
            crop: S.crop,
            path: S.path || 'aguardando',
            navigation: {
                maxLongTaskMs: Math.round(S.maxNavLongMs * 10) / 10,
                maxRafGapMs: Math.round(S.maxNavRafMs * 10) / 10,
                maxPtsGapMs: Math.round(S.maxNavPtsMs * 10) / 10,
                maxFirstFrameDelayMs: Math.round(S.maxNavFirstFrameMs * 10) / 10
            }
        }, extra || {});
    }
    function publishDiagnostics(extra) {
        var d = diagObject(extra);
        window.__miraLastRecordingDiagnostics = d;
        if (ui.diagSave) ui.diagSave.disabled = false;
        try { console.info('[Mira Studio] diagnóstico', d); } catch (e) { }
        return d;
    }
    function saveDiagnostics() {
        var d = window.__miraLastRecordingDiagnostics || publishDiagnostics();
        var blob = new Blob([JSON.stringify(d, null, 2) + '\n'], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'mira-record-diagnostics-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }
    function updateDiag() {
        if (!ui.diag) return;
        var input = S.input ? S.input.w + 'x' + S.input.h : '?';
        var crop = S.crop ? Math.round(S.crop.x) + ',' + Math.round(S.crop.y) + ' ' + Math.round(S.crop.w) + 'x' + Math.round(S.crop.h) : '?';
        var out = S.out ? S.out.w + 'x' + S.out.h : '?';
        ui.diag.textContent = (S.path || 'aguardando') + ' · in ' + input + ' · crop ' + crop + ' · out ' + out +
            ' · nav PTS/rAF/long/1º ' + Math.round(S.maxNavPtsMs) + '/' + Math.round(S.maxNavRafMs) + '/' +
            Math.round(S.maxNavLongMs) + '/' + Math.round(S.maxNavFirstFrameMs) + ' ms';
    }
    function startRafDiagnostics() {
        S.diagLastRaf = 0;
        function tick(t) {
            if (!isRec()) { S.diagRaf = 0; return; }
            if (S.diagLastRaf && t <= S.navUntil) S.maxNavRafMs = Math.max(S.maxNavRafMs, t - S.diagLastRaf);
            S.diagLastRaf = t;
            S.diagRaf = requestAnimationFrame(tick);
        }
        S.diagRaf = requestAnimationFrame(tick);
    }
    function onNavigation() {
        if (!isRec()) return;
        var now = performance.now();
        S.navUntil = now + 1500;
        if (S.worker) {
            try { S.worker.postMessage({ type: 'navigation' }); } catch (e) { }
        }
        updateDiag();
    }
    function setupNavigationDiagnostics() {
        window.addEventListener('mira-navigation', onNavigation);
        if (typeof PerformanceObserver === 'undefined') return;
        try {
            longTaskObserver = new PerformanceObserver(function (list) {
                if (!isRec()) return;
                list.getEntries().forEach(function (entry) {
                    if (entry.startTime <= S.navUntil && entry.startTime + entry.duration >= S.navUntil - 1500) {
                        S.maxNavLongMs = Math.max(S.maxNavLongMs, entry.duration);
                    }
                });
                updateDiag();
            });
            longTaskObserver.observe({ type: 'longtask', buffered: false });
        } catch (e) { longTaskObserver = null; }
    }

    /* =====================================================================
       WORKER: captura->escala->encode->mux, tudo fora do main thread.
       Definido como função e serializado (toString) para virar um Blob
       Worker — sem arquivo extra para instalar no deck. O mp4-muxer é
       carregado por importScripts a partir de uma URL absoluta.
       ===================================================================== */
    function recordWorkerBody() {
        'use strict';
        var muxer, venc, aenc, vReader, aReader;
        var cfg, stopping = false, muxDead = false, terminalPosted = false;
        var frames = 0, dropped = 0, encoded = 0, maxQ = 0, audioDropped = 0;
        var encBytes = 0, winBytes = 0;                 /* bytes reais emitidos (vídeo+áudio) */
        var lastKey = null, lastTs = -1;
        var scaleCanvas = null, scaleCtx = null, scaleMode = 'encoder', cropFrac = null, sourceViewport = null;
        var inputSize = null, cropRect = null, pathName = 'direct';
        var navUntil = 0, navMarkMs = 0, navLastTs = -1, maxNavPtsGapUs = 0, maxNavFirstFrameMs = 0;
        var metricsTimer = 0, winFrames = 0, winT0 = 0;

        self.onmessage = function (e) {
            var d = e.data || {};
            if (d.type === 'start') start(d);
            else if (d.type === 'stop') stop();
            else if (d.type === 'navigation') {
                navMarkMs = nowMs(); navUntil = navMarkMs + 1500; navLastTs = -1;
            }
        };
        function post(msg, transfer) { self.postMessage(msg, transfer || []); }
        function nowMs() { return (self.performance && self.performance.now) ? self.performance.now() : Date.now(); }
        /* erro FATAL: nada a salvar (init/mux quebrado). Para os pumps e
           avisa o main para encerrar de vez (não adianta pedir finalize). */
        function fatal(where, msg) {
            stopping = true;
            if (terminalPosted) return;   /* só uma mensagem terminal por sessão */
            terminalPosted = true;
            post({ type: 'error', where: where, message: String(msg && msg.message || msg), fatal: true });
        }
        /* o muxer pode lançar ao adicionar chunk (inclusive RangeError de
           memória); uma vez morto, não dá para finalizar */
        function onMuxError(e) { if (muxDead) return; muxDead = true; fatal('mux', e); }
        /* mismatch de dimensão no 1º frame: passa a escalar no OffscreenCanvas
           (ainda no Worker) e recria o encoder do zero */
        function switchToCanvas() {
            scaleMode = 'canvas';
            if (!cropFrac) cropFrac = cfg.cropFrac || null;
            ensureCanvas();
            try { if (venc && venc.state !== 'closed') venc.close(); } catch (e) { }
            makeVideoEncoder();
        }

        function ensureCanvas() {
            if (scaleCanvas) return;
            scaleCanvas = new OffscreenCanvas(cfg.out.w, cfg.out.h);
            scaleCtx = scaleCanvas.getContext('2d', { alpha: false, desynchronized: true });
            scaleCtx.imageSmoothingEnabled = true;
            scaleCtx.imageSmoothingQuality = 'high';
        }
        function isNineSixteen(frame) {
            var w = frame.displayWidth || frame.codedWidth;
            var h = frame.displayHeight || frame.codedHeight;
            return !!(w && h && Math.abs((w / h) - (9 / 16)) <= 0.005);
        }
        function computeCropRect(fw, fh, frac, viewport) {
            var full = { x: 0, y: 0, w: fw, h: fh, path: 'canvas-scale' };
            if (!fw || !fh) return full;
            if (Math.abs((fw / fh) - (9 / 16)) <= 0.005) return full;
            /* A fração CSS só é válida se o frame ainda representa o mesmo
               viewport (escala uniforme/DPR é aceita). Se a proporção mudou,
               não reutiliza coordenadas incompatíveis: faz crop central 9:16. */
            var compatible = frac && viewport && viewport.w && viewport.h &&
                Math.abs((fw / fh) - (viewport.w / viewport.h)) <= 0.03;
            if (compatible) {
                var x = Math.max(0, Math.min(fw, fw * frac.x));
                var y = Math.max(0, Math.min(fh, fh * (frac.y || 0)));
                var w = Math.max(1, Math.min(fw - x, fw * frac.w));
                var h = Math.max(1, Math.min(fh - y, fh * (frac.h || 1)));
                return { x: x, y: y, w: w, h: h, path: 'canvas-normalized-crop' };
            }
            var cw = Math.min(fw, fh * 9 / 16), ch = cw * 16 / 9;
            if (ch > fh) { ch = fh; cw = ch * 9 / 16; }
            return { x: (fw - cw) / 2, y: (fh - ch) / 2, w: cw, h: ch, path: 'canvas-center-crop' };
        }
        function makeVideoEncoder() {
            venc = new VideoEncoder({
                output: function (chunk, meta) {
                    encoded++; encBytes += chunk.byteLength; winBytes += chunk.byteLength;
                    if (muxer && !muxDead) { try { muxer.addVideoChunk(chunk, meta); } catch (e) { onMuxError(e); } }
                },
                error: function (err) { onVencError(err); }
            });
            venc.configure(cfg.video);
        }
        /* Falha no modo 'encoder' com 0 chunks: quase sempre é o encoder
           recusando escalar frame de tamanho != config → cai para o canvas.
           Já com chunks muxados, um erro do encoder é reportado (não-fatal):
           o main pede stop e o que já foi codificado ainda é finalizado. */
        function onVencError(err) {
            if (scaleMode === 'encoder' && encoded === 0 && !stopping) {
                switchToCanvas();
                post({ type: 'info', message: 'escala no worker (canvas)' });
                return;
            }
            if (!stopping) post({ type: 'error', where: 'video', message: String(err && err.message || err) });
        }

        function start(d) {
            cfg = d.config;
            cropFrac = cfg.cropFrac || null;
            sourceViewport = cfg.sourceViewport || null;
            scaleMode = d.forceCanvas ? 'canvas' : 'encoder';
            pathName = scaleMode === 'canvas' ? 'canvas-pending' : 'direct';
            try { importScripts(d.muxerUrl); }
            catch (e) { fatal('muxer', 'não carregou o mp4-muxer: ' + (e && e.message || e)); return; }
            try {
                muxer = new Mp4Muxer.Muxer({
                    target: new Mp4Muxer.ArrayBufferTarget(),
                    video: { codec: 'avc', width: cfg.out.w, height: cfg.out.h },
                    audio: cfg.audio ? { codec: 'aac', sampleRate: cfg.audio.sampleRate, numberOfChannels: cfg.audio.numberOfChannels } : undefined,
                    fastStart: 'in-memory',
                    /* 'offset' (por track), NUNCA 'cross-track-offset': mic
                       (AudioData ~0) e captura de tela (VideoFrame no relógio
                       de uptime) usam origens de relógio diferentes; o cross-
                       track preserva essa diferença e desloca o vídeo em horas
                       (vídeo congelado no 1º frame + duração absurda). Os dois
                       processors nascem juntos no start, então o desvio A/V do
                       offset por track é <= 1 frame. */
                    firstTimestampBehavior: 'offset'
                });
            } catch (e) { fatal('muxer', e); return; }
            if (scaleMode === 'canvas') ensureCanvas();
            try { makeVideoEncoder(); }
            catch (e) { fatal('video', 'configure falhou: ' + (e && e.message || e)); return; }
            if (cfg.audio && d.audioReadable) setupAudio(d.audioReadable);
            pumpVideo(d.videoReadable);
            startMetrics();
        }

        function drawCropScale(frame) {
            ensureCanvas();
            /* dimensões de APRESENTAÇÃO (não coded): padding/orientação do
               frame não deslocam o crop */
            var fw = frame.displayWidth || frame.codedWidth, fh = frame.displayHeight || frame.codedHeight;
            /* cropTo() resolver não garante que todo frame do Chromium no
               Windows já chegou recortado. Frame 9:16 usa tudo; frame da
               guia inteira usa a geometria normalizada. */
            cropRect = computeCropRect(fw, fh, cropFrac, sourceViewport);
            pathName = cropRect.path;
            scaleCtx.drawImage(frame, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cfg.out.w, cfg.out.h);
        }
        function encodeFrame(frame) {
            if (stopping || !venc || venc.state !== 'configured') { frame.close(); return; }
            frames++; winFrames++;
            var fw = frame.displayWidth || frame.codedWidth, fh = frame.displayHeight || frame.codedHeight;
            if (scaleMode === 'encoder' && isNineSixteen(frame)) {
                cropRect = { x: 0, y: 0, w: fw, h: fh, path: 'direct' };
                pathName = 'direct';
            }
            if (!inputSize || inputSize.w !== fw || inputSize.h !== fh) {
                inputSize = { w: fw, h: fh };
                post({ type: 'info', message: 'geometria de entrada', input: inputSize,
                    crop: cropRect, output: cfg.out, path: pathName });
            }
            /* Defesa do caminho cropTo no Windows: se a entrada real ainda
               for full-tab, muda para recorte no OffscreenCanvas do Worker.
               O encoder e a resolução AVC permanecem constantes. */
            if (scaleMode === 'encoder' && !isNineSixteen(frame)) {
                scaleMode = 'canvas'; ensureCanvas();
                pathName = 'canvas-normalized-crop';
                post({ type: 'info', message: 'entrada full-tab detectada; recorte 9:16 no worker',
                    input: { w: frame.displayWidth || frame.codedWidth, h: frame.displayHeight || frame.codedHeight } });
            }
            var q = venc.encodeQueueSize; if (q > maxQ) maxQ = q;
            var ts = frame.timestamp;
            /* AVC exige PTS monotônico; screen-capture raramente regride, mas
               se ts não avança, descarta (nos dois caminhos) — não inventa ts */
            if (ts <= lastTs) { dropped++; frame.close(); return; }
            var navNow = nowMs();
            if (navMarkMs && navNow <= navUntil) {
                if (navLastTs >= 0) maxNavPtsGapUs = Math.max(maxNavPtsGapUs, ts - navLastTs);
                else maxNavFirstFrameMs = Math.max(maxNavFirstFrameMs, navNow - navMarkMs);
                navLastTs = ts;
            }
            var key = lastKey === null || (ts - lastKey) >= 2000000;
            if (q >= 2 && !key) { dropped++; frame.close(); return; }
            lastTs = ts;
            if (scaleMode === 'canvas') {
                drawCropScale(frame); frame.close();
                var vf = new VideoFrame(scaleCanvas, { timestamp: ts });
                try { venc.encode(vf, { keyFrame: key }); if (key) lastKey = ts; } catch (e) { } finally { vf.close(); }
                return;
            }
            try { venc.encode(frame, { keyFrame: key }); if (key) lastKey = ts; frame.close(); }
            catch (e) {
                frame.close();
                /* só o 1º frame (mismatch de dimensão) migra para o canvas e
                   recria o encoder; erro com chunks já muxados é reportado */
                if (encoded === 0 && scaleMode === 'encoder') { switchToCanvas(); }
                else if (!stopping) post({ type: 'error', where: 'video', message: String(e && e.message || e) });
            }
        }
        function pumpVideo(readable) {
            vReader = readable.getReader();
            (function loop() {
                vReader.read().then(function (r) {
                    if (r.done || stopping) { if (r.value) r.value.close(); return; }
                    encodeFrame(r.value);
                    loop();
                }).catch(function () { });
            })();
        }
        function setupAudio(readable) {
            try {
                aenc = new AudioEncoder({
                    output: function (chunk, meta) {
                        encBytes += chunk.byteLength; winBytes += chunk.byteLength;
                        if (muxer && !muxDead) { try { muxer.addAudioChunk(chunk, meta); } catch (e) { onMuxError(e); } }
                    },
                    error: function (err) { if (!stopping) post({ type: 'error', where: 'audio', message: String(err && err.message || err) }); }
                });
                aenc.configure(cfg.audio);
            } catch (e) { aenc = null; return; }
            aReader = readable.getReader();
            (function loop() {
                aReader.read().then(function (r) {
                    if (r.done || stopping) { if (r.value) r.value.close(); return; }
                    /* AAC costuma acompanhar; se a fila estourar, descarta em
                       vez de crescer sem limite (áudio não trava o vídeo) */
                    if (aenc && aenc.state === 'configured' && aenc.encodeQueueSize < 40) {
                        try { aenc.encode(r.value); } catch (e) { }
                    } else if (aenc) { audioDropped++; }
                    r.value.close();
                    loop();
                }).catch(function () { });
            })();
        }
        function startMetrics() {
            winT0 = nowMs();
            metricsTimer = setInterval(function () {
                var t = nowMs(), dt = (t - winT0) / 1000;
                if (dt <= 0) return;
                var q = (venc && venc.state === 'configured') ? venc.encodeQueueSize : 0;
                post({
                    type: 'metrics', fps: winFrames / dt, frames: frames, dropped: dropped,
                    encoded: encoded, q: q, maxQ: maxQ, bytes: encBytes, mbps: (winBytes * 8) / dt / 1e6,
                    input: inputSize, crop: cropRect, output: cfg.out, path: pathName,
                    maxNavPtsGapMs: maxNavPtsGapUs / 1000, maxNavFirstFrameDelayMs: maxNavFirstFrameMs
                });
                winFrames = 0; winBytes = 0; winT0 = t;
            }, 1000);
        }
        function stop() {
            if (stopping) return;
            stopping = true;
            if (metricsTimer) { clearInterval(metricsTimer); metricsTimer = 0; }
            Promise.resolve()
                .then(function () { return vReader ? vReader.cancel().catch(function () { }) : null; })
                .then(function () { return aReader ? aReader.cancel().catch(function () { }) : null; })
                .then(function () { return (venc && venc.state === 'configured') ? venc.flush().catch(function () { }) : null; })
                .then(function () { return (aenc && aenc.state === 'configured') ? aenc.flush().catch(function () { }) : null; })
                .then(function () {
                    try { if (venc && venc.state !== 'closed') venc.close(); } catch (e) { }
                    try { if (aenc && aenc.state !== 'closed') aenc.close(); } catch (e) { }
                    if (terminalPosted) return;   /* fatal já encerrou; não posta 'done' duplicado */
                    terminalPosted = true;
                    var buffer = null, err = '';
                    if (muxer && !muxDead) {
                        try { muxer.finalize(); buffer = muxer.target.buffer; }
                        catch (e) { err = String(e && e.message || e); }
                    } else { err = 'mux indisponível'; }
                    if (err) post({ type: 'error', where: 'finalize', message: err, fatal: true });
                    else post({ type: 'done', buffer: buffer, stats: { frames: frames, dropped: dropped, encoded: encoded,
                        audioDropped: audioDropped, maxQ: maxQ, maxNavPtsGapMs: maxNavPtsGapUs / 1000,
                        maxNavFirstFrameDelayMs: maxNavFirstFrameMs,
                        input: inputSize, crop: cropRect, output: cfg.out, path: pathName } }, buffer ? [buffer] : []);
                });
        }

        if (self.__MIRA_RECORD_TEST__) {
            self.__miraRecordTest = {
                isNineSixteenSize: function (w, h) { return !!(w && h && Math.abs((w / h) - (9 / 16)) <= 0.005); },
                computeCropRect: computeCropRect
            };
        }
    }

    var workerUrl = null;
    function makeWorker() {
        if (!workerUrl) {
            var src = '(' + recordWorkerBody.toString() + ')();';
            workerUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
        }
        return new Worker(workerUrl);
    }

    /* ---------- diagnóstico de FPS (métricas reais do Worker) ----------
       O Worker conta os frames que realmente chegam da captura e reporta
       o fps efetivo a cada 1s. Captura de aba só emite frame quando a
       tela MUDA, então trechos estáticos naturalmente têm fps baixo — por
       isso o aviso "lenta" só dispara depois de 3s e uma vez. Se nenhum
       frame chegar em 10s, avisa que o arquivo pode sair sem vídeo. */
    /* limites APROXIMADOS: encBytes é payload comprimido; o ArrayBuffer real
       cresce por dobra + cópia no finalize (pico maior) e tem teto ~2 GB
       (RangeError). Parar em ~512 MB deixa margem folgada para esse pico. */
    var MEM_SOFT = 384 * 1024 * 1024, MEM_HARD = 512 * 1024 * 1024;
    function handleMetrics(d) {
        S.gotMetrics = true;
        if (d.input) S.input = d.input;
        if (d.crop) S.crop = d.crop;
        if (d.output) S.out = d.output;
        if (d.path) S.path = d.path;
        S.maxNavPtsMs = Math.max(S.maxNavPtsMs, Number(d.maxNavPtsGapMs) || 0);
        S.maxNavFirstFrameMs = Math.max(S.maxNavFirstFrameMs, Number(d.maxNavFirstFrameDelayMs) || 0);
        /* métricas reais ao vivo (honestas): fps efetivo, % descartado,
           fila atual/máxima do encoder, bitrate real e memória acumulada */
        if (ui.metrics) {
            var dropPct = d.frames > 0 ? Math.round(100 * d.dropped / d.frames) : 0;
            var mb = Math.round((d.bytes || 0) / (1024 * 1024));
            ui.metrics.textContent = Math.round(d.fps) + ' fps · ' + dropPct + '% desc · fila ' +
                (d.q || 0) + '/' + (d.maxQ || 0) + ' · ' + (d.mbps || 0).toFixed(1) + ' Mbps · ' + mb + ' MB';
            ui.metrics.classList.toggle('warn', (d.fps > 0 && d.fps < 20) || dropPct >= 25 || (d.bytes || 0) > MEM_SOFT);
        }
        updateDiag();
        if (!S.slowWarned && (Date.now() - S.t0) > 3000 && d.frames > 0 && d.fps > 0 && d.fps < 20) {
            S.slowWarned = true;
            note('Gravação lenta (' + Math.round(d.fps) + ' fps): verifique chrome://gpu (aceleração de hardware) e feche outras abas.');
        }
        /* guarda de memória: o mux é in-memory e o ArrayBuffer tem teto de
           ~2 GB (RangeError), com pico transitório maior no finalize. Para
           com elegância antes disso, salvando o que já foi gravado. */
        if ((d.bytes || 0) > MEM_HARD) {
            note('Gravação interrompida no limite de memória (~' + Math.round(d.bytes / (1024 * 1024)) + ' MB): salvando o que já foi gravado. Para clipes longos, grave em partes.');
            stopWorker(false);
            return;
        }
        if (!S.memWarned && (d.bytes || 0) > MEM_SOFT) {
            S.memWarned = true;
            note('Gravação longa (~' + Math.round(d.bytes / (1024 * 1024)) + ' MB em memória): vai parar sozinha perto de ~512 MB para não travar. Considere gravar em partes.');
        }
    }

    async function start() {
        if (S.busy || isRec()) return;
        S.busy = true;
        S.abort = false;
        resetDiagnostics();
        try {
            var mode = encMode();
            if (!CAN_WORKER) {
                /* sem WebCodecs/TrackProcessor: caminho MediaRecorder (fallback) */
                await startFallback(mode);
                S.busy = false; return;
            }
            /* pré-checagem do encoder ANTES de abrir o diálogo de captura */
            var supp = await VideoEncoder.isConfigSupported(vencConfig(mode)).catch(function () { return null; });
            if (!supp || !supp.supported) {
                note(mode === 'gpu'
                    ? 'Encoder de hardware indisponível neste computador (veja chrome://gpu). Use Auto ou CPU.'
                    : mode === 'cpu' ? 'Encoder de software indisponível neste navegador. Use Auto.'
                        : 'Encoder de vídeo indisponível neste navegador.');
                S.busy = false; return;
            }

            if (ui.mic.checked) {
                try { S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
                catch (e) { S.mic = null; note('Sem microfone: gravando só o vídeo.'); }
            }

            S.tab = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: FPS },
                audio: false,
                preferCurrentTab: true,
                selfBrowserSurface: 'include'
            });
            var vt = S.tab.getVideoTracks()[0];
            S.vt = vt;

            /* slides são conteúdo estático de alta nitidez: 'detail' manda o
               capturador preservar a RESOLUÇÃO e degradar framerate quando
               precisar — sem isso ele derruba a resolução da fonte no meio
               da gravação e o upscale sai borrado */
            try { vt.contentHint = 'detail'; } catch (eHint) { /* navegador sem contentHint */ }

            /* o recorte só é válido capturando ESTA guia: janela/tela teria outra geometria */
            var surface = vt.getSettings && vt.getSettings().displaySurface;
            if (surface && surface !== 'browser') {
                cleanup();
                note('Escolha "Esta guia" no seletor de captura (não janela nem tela inteira) e tente de novo.');
                ui.status.textContent = 'pronto';
                S.busy = false;
                return;
            }

            /* "Parar compartilhamento" do Chrome: durante o setup só sinaliza; gravando, para */
            vt.addEventListener('ended', function () { if (isRec()) { stop(); } else { S.abort = true; } });

            readGeo();
            /* Region Capture ANTES de qualquer clone (a track não pode ter
               clones no cropTo) e ANTES de criar o TrackProcessor. */
            var usedCrop = false;
            if (typeof CropTarget !== 'undefined' && typeof CropTarget.fromElement === 'function' &&
                typeof vt.cropTo === 'function' && geo.ok) {
                try {
                    var target = await CropTarget.fromElement(ensureCropOverlay());
                    await vt.cropTo(target);
                    usedCrop = true;
                } catch (eCrop) { /* falha em runtime: o Worker recorta via cropFrac no canvas */ }
            }

            if (S.abort || vt.readyState !== 'live') {
                cleanup();
                note('Captura encerrada antes de a gravação começar.');
                ui.status.textContent = 'pronto';
                S.busy = false;
                return;
            }

            await startWorkerPipeline(mode, vt, usedCrop);
            var od = S.out || { w: OUT_W, h: OUT_H };
            uiRecording('Saída: MP4 (H.264) ' + od.w + 'x' + od.h + ' · encoder ' +
                (mode === 'gpu' ? 'hardware preferido' : mode === 'cpu' ? 'software (CPU)' : 'Auto') +
                (S.noAudio ? ' · sem AAC neste Chrome: gravando sem áudio' : '') +
                (usedCrop ? ' · recorte na GPU · encode no worker.' : ' · recorte no worker.'));
        } catch (e) {
            cleanup();
            note(e && e.name === 'NotAllowedError' ? 'Captura cancelada.' : 'Falha ao iniciar: ' + (e && e.message || e));
            ui.status.textContent = 'pronto';
        }
        S.busy = false;
    }

    /* ---------- caminho primário: pipeline no Worker ---------- */
    async function startWorkerPipeline(mode, vt, usedCrop) {
        var videoProc = new MediaStreamTrackProcessor({ track: vt, maxBufferSize: 1 });
        var videoReadable = videoProc.readable;

        var audioCfg = null, audioReadable = null;
        var micTrack = S.mic && S.mic.getAudioTracks()[0];
        if (micTrack && typeof AudioEncoder !== 'undefined') {
            var ms = micTrack.getSettings ? micTrack.getSettings() : {};
            audioCfg = { codec: 'mp4a.40.2', sampleRate: ms.sampleRate || 48000, numberOfChannels: ms.channelCount || 1, bitrate: 128000 };
            var sup = await AudioEncoder.isConfigSupported(audioCfg).catch(function () { return null; });
            if (sup && sup.supported) {
                try { audioReadable = new MediaStreamTrackProcessor({ track: micTrack }).readable; }
                catch (e) { audioReadable = null; audioCfg = null; }
            } else { audioCfg = null; }
        }
        S.noAudio = !!(micTrack && !audioCfg);

        /* alvo de resolução CONGELADO aqui (geometria já congela na gravação):
           'alta' = 1080x1920; 'desempenho' = nativa da coluna, bitrate escalado */
        var out = targetOut();
        var vcfg = vencConfig(mode, out, scaledBitrate(out));
        /* revalida a config CONGELADA (o precheck do start() foi só em
           1080x1920); se a resolução nativa não passar, volta pra 1080x1920 */
        var okCfg = await VideoEncoder.isConfigSupported(vcfg).catch(function () { return null; });
        if (!okCfg || !okCfg.supported) {
            out = { w: OUT_W, h: OUT_H };
            vcfg = vencConfig(mode, out, scaledBitrate(out));
        }
        S.out = out;
        var config = {
            out: out,
            video: vcfg,
            audio: audioCfg,
            /* Sempre enviado: rede de segurança quando cropTo() resolve,
               mas a track real ainda entrega a guia inteira no Windows. */
            cropFrac: { x: geo.left / window.innerWidth, y: 0, w: geo.width / window.innerWidth, h: 1 },
            sourceViewport: { w: window.innerWidth, h: window.innerHeight }
        };
        var muxerUrl = new URL('assets/vendor/mp4-muxer.js', location.href).href;

        S.worker = makeWorker();
        S.worker.onmessage = onWorkerMsg;
        S.worker.onerror = function (e) { note('Erro no worker de gravação: ' + (e && e.message || 'desconhecido')); stopWorker(true); };

        var transfer = [videoReadable];
        var msg = { type: 'start', config: config, muxerUrl: muxerUrl, videoReadable: videoReadable, forceCanvas: !usedCrop };
        if (audioReadable) { msg.audioReadable = audioReadable; transfer.push(audioReadable); }
        S.worker.postMessage(msg, transfer);

        S.gotMetrics = false; S.slowWarned = false;
        setTimeout(function () {
            if (S.worker && !S.gotMetrics) note('Nenhum frame de vídeo capturado ainda: se continuar, o arquivo pode sair sem vídeo. Confira se escolheu "Esta guia".');
        }, 10000);
    }

    function onWorkerMsg(e) {
        if (!S.worker) return;   /* já encerrado (forceStop/finishWorker): ignora mensagem tardia */
        var d = e.data || {};
        if (d.type === 'metrics') { handleMetrics(d); }
        else if (d.type === 'info') {
            if (d.input) S.input = d.input;
            if (d.crop) S.crop = d.crop;
            if (d.output) S.out = d.output;
            if (d.path) S.path = d.path;
            updateDiag();
        }
        else if (d.type === 'error') {
            note('Erro na gravação (' + d.where + '): ' + d.message);
            /* erro fatal (init/mux quebrado) ou erro DURANTE a finalização:
               o Worker não vai (ou não pôde) entregar 'done' → encerra já.
               Erro não-fatal em gravação ativa → pede stop (salva parcial). */
            if (d.fatal || S.stopping) { forceStop(); }
            else { stopWorker(true); }
        }
        else if (d.type === 'done') { finishWorker(d); }
    }

    /* pede ao Worker para drenar e finalizar; o MP4 volta em 'done'. Um
       timeout garante que um Worker travado/morto não prenda S.stopping. */
    function stopWorker(hadError) {
        if (S.stopping) return;
        if (!S.worker) { cleanup(); ui.status.textContent = 'pronto'; return; }
        S.stopping = true;
        ui.status.textContent = hadError ? 'finalizando…' : 'salvando…';
        if (S.finalizeTimer) clearTimeout(S.finalizeTimer);
        S.finalizeTimer = setTimeout(function () {
            S.finalizeTimer = null;
            note('A finalização não respondeu; encerrando a gravação.');
            forceStop();
        }, 10000);
        try { S.worker.postMessage({ type: 'stop' }); }
        catch (e) { forceStop(); }
    }
    /* encerramento duro: usado quando o Worker não vai entregar 'done'
       (fatal, timeout, postMessage falhou). Termina o Worker e reseta. */
    function forceStop() {
        if (S.finalizeTimer) { clearTimeout(S.finalizeTimer); S.finalizeTimer = null; }
        cleanup();
        S.stopping = false;
        ui.status.textContent = 'pronto';
    }
    function finishWorker(d) {
        if (S.finalizeTimer) { clearTimeout(S.finalizeTimer); S.finalizeTimer = null; }
        var blob = null;
        if (d.buffer && d.buffer.byteLength) blob = new Blob([d.buffer], { type: 'video/mp4' });
        S.lastStats = d.stats || null;
        if (S.lastStats) {
            if (S.lastStats.input) S.input = S.lastStats.input;
            if (S.lastStats.crop) S.crop = S.lastStats.crop;
            if (S.lastStats.output) S.out = S.lastStats.output;
            if (S.lastStats.path) S.path = S.lastStats.path;
            S.maxNavPtsMs = Math.max(S.maxNavPtsMs, Number(S.lastStats.maxNavPtsGapMs) || 0);
            S.maxNavFirstFrameMs = Math.max(S.maxNavFirstFrameMs, Number(S.lastStats.maxNavFirstFrameDelayMs) || 0);
        }
        var finalDiag = diagObject({ worker: S.lastStats });
        cleanup();
        S.stopping = false;
        window.__miraLastRecordingDiagnostics = finalDiag;
        if (ui.diagSave) ui.diagSave.disabled = false;
        if (blob) deliver(blob, 'mp4');
        else { note('Nada gravado.'); ui.status.textContent = 'pronto'; }
    }

    /* ---------- fallback MediaRecorder (sem WebCodecs/TrackProcessor) ----
       Caminho antigo: canvas fixo 1080x1920 alimentado por
       requestVideoFrameCallback, captureStream -> MediaRecorder. Roda
       SÓ quando o pipeline em Worker não existe (navegador sem as APIs);
       aí não há caminho melhor. */
    async function startFallback(mode) {
        var mime = pickMime();
        if (!mime) { note('MediaRecorder indisponível neste navegador.'); return; }
        if (ui.mic.checked) {
            try { S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
            catch (e) { S.mic = null; note('Sem microfone: gravando só o vídeo.'); }
        }
        S.tab = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: FPS }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include'
        });
        var vt = S.tab.getVideoTracks()[0];
        S.vt = vt;
        try { vt.contentHint = 'detail'; } catch (e) { }
        var surface = vt.getSettings && vt.getSettings().displaySurface;
        if (surface && surface !== 'browser') {
            cleanup(); note('Escolha "Esta guia" no seletor de captura e tente de novo.'); ui.status.textContent = 'pronto'; return;
        }
        vt.addEventListener('ended', function () { if (isRec()) { stop(); } else { S.abort = true; } });
        readGeo();
        var usedCrop = false;
        if (typeof CropTarget !== 'undefined' && typeof CropTarget.fromElement === 'function' &&
            typeof vt.cropTo === 'function' && geo.ok) {
            try { await vt.cropTo(await CropTarget.fromElement(ensureCropOverlay())); usedCrop = true; } catch (e) { }
        }
        var vid = document.createElement('video');
        vid.srcObject = usedCrop ? new MediaStream([vt]) : S.tab;
        vid.muted = true;
        await vid.play();
        S.vid = vid;
        var cv = document.createElement('canvas');
        cv.width = OUT_W; cv.height = OUT_H;
        var ctx = cv.getContext('2d', { alpha: false, desynchronized: true });
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        function draw() {
            if (vid.videoWidth) {
                var nineSixteen = vid.videoHeight && Math.abs((vid.videoWidth / vid.videoHeight) - (9 / 16)) <= 0.005;
                if (nineSixteen) ctx.drawImage(vid, 0, 0, vid.videoWidth, vid.videoHeight, 0, 0, OUT_W, OUT_H);
                else if (geo.ok) {
                    var sx = vid.videoWidth / window.innerWidth;
                    ctx.drawImage(vid, geo.left * sx, 0, geo.width * sx, vid.videoHeight, 0, 0, OUT_W, OUT_H);
                }
            }
            if (vid.requestVideoFrameCallback) S.rvfc = vid.requestVideoFrameCallback(draw);
            else S.raf = requestAnimationFrame(draw);
        }
        draw();
        if (S.abort || vt.readyState !== 'live') { cleanup(); note('Captura encerrada antes de a gravação começar.'); ui.status.textContent = 'pronto'; return; }
        S.cvs = cv.captureStream(FPS);
        var recVideoTrack = S.cvs.getVideoTracks()[0];
        var tracks = [recVideoTrack];
        if (S.mic) tracks = tracks.concat(S.mic.getAudioTracks());
        S.chunks = [];
        S.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: BITRATE });
        S.rec.ondataavailable = function (e) { if (e.data && e.data.size) S.chunks.push(e.data); };
        S.rec.onstop = saveFallback;
        S.rec.onerror = function (e) { note('Erro na gravação: ' + ((e && e.error && e.error.name) || 'desconhecido') + '.'); stop(); };
        S.rec.start(250);
        uiRecording((mime.indexOf('mp4') !== -1 ? 'Saída: MP4 (H.264) 1080x1920' : 'Este Chrome não grava MP4: salvando WebM 1080x1920') +
            ' · MediaRecorder (fallback)' + (usedCrop ? ' · recorte na GPU.' : ' · recorte no canvas.'));
    }
    function saveFallback() {
        var mime = S.rec && S.rec.mimeType || '';
        var ext = mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm';
        var blob = new Blob(S.chunks, { type: mime || 'video/webm' });
        var finalDiag = diagObject({ fallback: 'MediaRecorder' });
        cleanup();
        window.__miraLastRecordingDiagnostics = finalDiag;
        if (ui.diagSave) ui.diagSave.disabled = false;
        deliver(blob, ext);
    }

    /* UI comum ao começar a gravar (qualquer caminho) */
    function uiRecording(msg) {
        S.t0 = Date.now();
        document.documentElement.setAttribute('data-mira-recording', 'true');
        try { window.dispatchEvent(new CustomEvent('mira-recording-change', { detail: { recording: true } })); } catch (e) { }
        ui.btn.classList.add('rec');
        ui.btn.innerHTML = '&#9632; Parar';
        ui.mic.disabled = true;
        ui.enc.disabled = true;
        if (ui.qual) ui.qual.disabled = true;
        if (ui.metrics) { ui.metrics.textContent = ''; ui.metrics.classList.remove('warn'); }
        note(msg);
        startRafDiagnostics();
        S.timer = setInterval(function () { ui.status.innerHTML = '&#128308; ' + fmtTime(Date.now() - S.t0); }, 500);
        ui.status.innerHTML = '&#128308; 00:00';
    }

    function stop() {
        if (S.stopping) return;
        if (S.rec) { try { S.rec.stop(); } catch (e) { } return; }
        if (S.worker) { stopWorker(false); }
    }

    function deliver(blob, ext) {
        if (!blob || !blob.size) { note('Nada gravado.'); ui.status.textContent = 'pronto'; return; }
        var d = new Date();
        var pad = function (n) { return String(n).padStart(2, '0'); };
        var name = 'mira-reels-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
            '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.' + ext;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        ui.status.textContent = 'pronto';
        note('Baixado: ' + name);
    }

    function cleanup() {
        if (S.worker) { try { S.worker.terminate(); } catch (e) { } }
        if (S.rvfc && S.vid && S.vid.cancelVideoFrameCallback) S.vid.cancelVideoFrameCallback(S.rvfc);
        if (S.raf) cancelAnimationFrame(S.raf);
        if (S.diagRaf) cancelAnimationFrame(S.diagRaf);
        if (S.timer) clearInterval(S.timer);
        if (S.finalizeTimer) { clearTimeout(S.finalizeTimer); S.finalizeTimer = null; }
        if (S.vid) S.vid.srcObject = null;
        if (S.tab) S.tab.getTracks().forEach(function (t) { t.stop(); });
        if (S.mic) S.mic.getTracks().forEach(function (t) { t.stop(); });
        if (S.cvs) S.cvs.getTracks().forEach(function (t) { t.stop(); });
        S.worker = null; S.rvfc = 0; S.raf = 0; S.diagRaf = 0; S.diagLastRaf = 0; S.timer = null; S.vid = null; S.tab = null; S.vt = null;
        S.mic = null; S.cvs = null; S.rec = null; S.chunks = []; S.noAudio = false; S.gotMetrics = false; S.slowWarned = false;
        S.memWarned = false;
        document.documentElement.removeAttribute('data-mira-recording');
        try { window.dispatchEvent(new CustomEvent('mira-recording-change', { detail: { recording: false } })); } catch (e) { }
        ui.btn.classList.remove('rec');
        ui.btn.innerHTML = '&#9679; Gravar';
        ui.mic.disabled = false;
        ui.enc.disabled = false;
        if (ui.qual) ui.qual.disabled = false;
        if (ui.metrics) { ui.metrics.textContent = ''; ui.metrics.classList.remove('warn'); }
        updateDiag();
    }

    function toggle() { if (S.stopping) return; if (isRec()) { stop(); } else { start(); } }

    /* ---------- tecla R (quieta nos modos E/P e digitação) ---------- */
    function bindKey() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'r' && e.key !== 'R') return;
            var t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
            if (document.body.classList.contains('me-on') || document.body.classList.contains('md-on')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            toggle();
        });
    }

    function init() {
        if (!document.querySelector('body > section')) return;
        injectCss();
        buildPanel();
        bindKey();
        setupNavigationDiagnostics();
        readGeo();
        window.addEventListener('resize', queueGeo);
        window.addEventListener('scroll', queueGeo, { passive: true });
    }

    /* Hook somente quando o teste o solicita antes de carregar o módulo. */
    if (window.__MIRA_RECORD_TEST__) {
        window.__MIRA_RECORD_TEST__.fetchSystemGpus = fetchSystemGpus;
        window.__MIRA_RECORD_TEST__.workerBody = recordWorkerBody;
        window.__MIRA_RECORD_TEST__.setGpuUi = function (gpuEl) { ui.gpu = gpuEl; };
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
