/* =====================================================================
   mira-camera.js  ·  Câmera embutida do MIRA (decks multi-formato)
   ---------------------------------------------------------------------
   Injeta o feed da webcam ao vivo em toda `.cam-area` do deck, para
   gravação direta no OBS (captura de janela, sem chroma key).

   Contrato:
     - Área de câmera: qualquer elemento com a classe `.cam-area`.
     - Stream ÚNICO por sessão (uma permissão), compartilhado por todas
       as áreas via o mesmo MediaStream.
     - Vídeo local sempre MUDO (o áudio da gravação é do OBS).
     - Fallback: sem câmera (file://, permissão negada, sem dispositivo),
       a área vira verde chroma puro #00FF00, sem nada por cima, e um
       aviso discreto aparece FORA da área (some em 5s).
     - Tecla C alterna o espelhamento (padrão: espelhado, estilo selfie).
     - Requer contexto seguro (http://localhost via mira-serve, ou https).

   Este arquivo vive em `mira/` dentro do deck, como os demais módulos
   de apoio (mira-edit.js, mira-draw.js). Não depende de nada externo.
   ===================================================================== */
(function () {
    'use strict';
    if (typeof document === 'undefined') return;

    /* ---------- estilos ---------- */
    function injectCss() {
        if (document.getElementById('mira-camera-css')) return;
        var st = document.createElement('style');
        st.id = 'mira-camera-css';
        st.textContent = [
            '.cam-area { position: relative; overflow: hidden; background: #000; }',
            /* fallback verde chroma PURO: nenhum texto/gradiente por cima (keying limpo no OBS) */
            '.cam-area.cam-fallback { background: #00FF00 !important; }',
            '.cam-area .cam-video { width: 100%; height: 100%; object-fit: cover; display: block; }',
            /* espelhamento estilo selfie (padrão ligado; tecla C alterna) */
            'body.cam-mirror .cam-video { transform: scaleX(-1); }',
            /* aviso discreto FORA da área de câmera (canto da margem #333), some sozinho */
            '.cam-notice { position: fixed; top: 14px; left: 14px; z-index: 2147483000;',
            '  max-width: 300px; padding: 10px 14px; border-radius: 10px;',
            '  background: rgba(13, 13, 15, .94); color: #f4f4f5;',
            '  border: 1px solid var(--mira-icon-border, rgba(255, 144, 77, .55));',
            '  font: 600 13px/1.45 Inter, system-ui, -apple-system, sans-serif; }'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------- stream único memoizado (RN-07) ---------- */
    var streamPromise = null;
    function getStream() {
        if (!streamPromise) {
            if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
                streamPromise = Promise.reject(new Error('mira-camera: contexto inseguro (sem mediaDevices)'));
            } else {
                // Studio+: respeita a câmera escolhida na pré-config (RF-09);
                // se o id não existir mais, cai na câmera padrão.
                var plus = window.__miraStudioPlus;
                var id = plus && plus.cameraDeviceId;
                /* preferência do seletor de câmera do painel de gravação */
                if (!id) { try { id = localStorage.getItem('mira-cam-device') || ''; } catch (e) { id = ''; } }
                if (id) {
                    streamPromise = navigator.mediaDevices
                        .getUserMedia({ video: { deviceId: { exact: id } }, audio: false })
                        .catch(function () {
                            return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                        });
                } else {
                    streamPromise = navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                }
            }
        }
        return streamPromise;
    }

    /* ---------- aviso temporário ---------- */
    function notice(msg) {
        var el = document.createElement('div');
        el.className = 'cam-notice';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
    }

    function fallback(areas, msg) {
        areas.forEach(function (a) { a.classList.add('cam-fallback'); });
        notice(msg);
    }

    /* ---------- troca de câmera ao vivo (painel de gravação) ----------
       Re-obtém o stream com o deviceId escolhido, troca o sink das .cam-area
       ativas (as detached pegam o novo no próximo attach) e para as tracks
       antigas. A escolha persiste para os próximos loads. */
    window.__miraCameraUse = function (deviceId) {
        try { localStorage.setItem('mira-cam-device', deviceId || ''); } catch (e) { }
        var next = deviceId
            ? navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false })
            : navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        return next.then(function (stream) {
            var old = activeStream;
            activeStream = stream;
            streamPromise = Promise.resolve(stream);
            Array.prototype.forEach.call(document.querySelectorAll('.cam-area'), function (a) {
                a.classList.remove('cam-fallback');
                var v = a._camVideo;
                if (v && v.srcObject) {
                    v.srcObject = stream;
                    var p = v.play();
                    if (p && p.catch) p.catch(function () { });
                }
            });
            if (old && old !== stream) old.getTracks().forEach(function (t) { t.stop(); });
        });
    };

    /* ---------- teclado: C alterna espelhamento ---------- */
    function bindMirrorKey() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'c' && e.key !== 'C') return;
            var t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
            if (document.body.classList.contains('me-on') || document.body.classList.contains('md-on')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            document.body.classList.toggle('cam-mirror');
        });
    }

    /* ---------- injeção nas áreas ---------- */
    var activeStream = null;

    function init() {
        var areas = Array.prototype.slice.call(document.querySelectorAll('.cam-area'));
        if (!areas.length) return;                     // deck sem câmera: módulo inerte
        document.body.classList.add('cam-mirror');     // padrão selfie (D-06)
        bindMirrorKey();

        // registrado ANTES do getUserMedia: se a página fechar com o prompt aberto
        // e a permissão resolver depois, a track ainda é parada
        window.addEventListener('pagehide', function () {
            if (activeStream) activeStream.getTracks().forEach(function (t) { t.stop(); });
        });

        getStream().then(function (stream) {
            activeStream = stream;

            function attach(v) {
                /* usa activeStream (mutável): a troca de câmera ao vivo não
                   deixa sinks presos ao stream antigo */
                if (v.srcObject === activeStream) return;
                v.srcObject = activeStream;
                var p = v.play();
                if (p && p.catch) p.catch(function () { /* autoplay muted não bloqueia */ });
            }
            function detach(v) {
                if (!v.srcObject) return;
                try { v.pause(); } catch (e) { }
                v.srcObject = null;                    // solta o sink; o stream (track) segue vivo e único
            }

            var videos = areas.map(function (a) {
                var v = document.createElement('video');
                v.className = 'cam-video';
                v.autoplay = true;
                v.muted = true;                        // nunca captura/tocamos áudio (D-04)
                v.playsInline = true;
                v.setAttribute('playsinline', '');
                v.setAttribute('muted', '');
                a.appendChild(v);
                a._camVideo = v;
                return v;
            });

            /* Um stream ÚNICO (uma permissão), mas cada `.cam-area` é um SINK
               separado. Com poucos slides, anexar todos é desprezível. Em
               decks grandes (10, 30 slides com câmera), 30 <video> presos ao
               track viram 30 texturas/sinks ociosos: então, quando há mais de
               2 áreas, só a(s) câmera(s) do slide visível (e vizinhos, via
               rootMargin) seguram o stream — custo de composição/memória fica
               ~O(1) em vez de O(n_slides). O stream em si nunca é recriado. */
            if (areas.length > 2 && 'IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (e) {
                        var v = e.target._camVideo;
                        if (!v) return;
                        if (e.isIntersecting) attach(v); else detach(v);
                    });
                }, { root: null, rootMargin: '60% 0px', threshold: 0.01 });
                areas.forEach(function (a) { io.observe(a); });
            } else {
                videos.forEach(attach);
            }
        }).catch(function (err) {
            var insecure = !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
            var msg;
            if (insecure) {
                msg = 'Câmera indisponível em file://. Abra o deck pelo launcher do Mira Studio (localhost) para o feed ao vivo. Área em verde chroma: no OBS, aplique Chroma Key.';
            } else if (denied) {
                msg = 'Permissão de câmera negada. Área em verde chroma: no OBS, aplique Chroma Key em #00FF00.';
            } else {
                msg = 'Nenhuma câmera encontrada. Área em verde chroma: no OBS, aplique Chroma Key em #00FF00.';
            }
            fallback(areas, msg);
        });
    }

    injectCss();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
