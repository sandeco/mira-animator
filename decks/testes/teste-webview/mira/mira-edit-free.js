/* =====================================================================
   mira-edit-free.js  ·  Edição livre estilo Canva (fase 2 do modo edição)
   ---------------------------------------------------------------------
   Acopla-se ao modo edição do mira-edit.js SEM modificá-lo: observa a
   classe body.me-on. Quando a edição liga, qualquer elemento de conteúdo
   do slide (texto, ícone SVG, imagem, bloco com data-me-editable) vira
   selecionável por clique. Selecionado, ganha um overlay com 8 alças de
   redimensionar + 1 de rotação + mini-barra (duplicar / excluir):

     - arrastar o corpo  → mover
     - arrastar uma alça → redimensionar (canto = uniforme, lado = 1 eixo)
     - Alt + alça       → recortar a borda, como no OBS Studio
     - arrastar a rotação→ girar em torno do centro
     - duplo clique      → editar o texto (Enter/blur confirma, Esc cancela)
     - botão / Delete     → excluir · botão → duplicar

   PERSISTÊNCIA (mesma filosofia do mira-edit.js: NÃO serializa o DOM que
   o GSAP/D3/Lucide mexeram). As edições viram um bloco de overrides
   embutido na fonte:  <script id="mira-free-edits" type="application/json">
   e este mesmo módulo reaplica no load (applier). Os elementos-fonte nunca
   são alterados no arquivo — só o bloco de overrides é escrito. Transporte
   reusa o do mira-edit.js: POST /__mira_save (http) ou File System Access
   API (file://), compartilhando o handle em IndexedDB (mira-edit/kv).

   FORA DO ESCOPO: desenhos do mira-draw (bitmap num <canvas>, sem nó DOM).
   ===================================================================== */
(function () {
    'use strict';

    var ACCENT = '#FF904D';
    var CROP_ACCENT = 'var(--mira-crop, #35D07F)';
    var EDITABLE = 'h1,h2,h3,h4,h5,h6,p,blockquote,li,figure,img,svg,video,canvas,iframe,span,button,[data-me-editable]';
    var TEXT_EDITABLE = 'h1,h2,h3,h4,h5,h6,p,blockquote,li,span,button';
    var CHROME = '#me-bar,#me-toast,.me-ctrl,#mef-overlay,#mef-toast,#md-canvas,#md-bar,[data-me-chrome]';

    var enabled = false;   // edição livre ativa (body.me-on presente)
    var sel = null;        // elemento selecionado
    var opsArr = [];       // overrides: transform, crop, texto, exclusão e duplicação
    var opsMap = {};       // id -> op (mesmo objeto de opsArr)
    var dupCount = 0;      // contador de duplicatas na sessão
    var drag = null;       // contexto do arraste corrente
    var altDown = false;   // Alt transforma temporariamente resize em crop
    var root = null, childTag = 'section', kind = 'section';
    var history = [];      // pilha de undo: cada item é uma função que reverte a última ação
    var stateDirty = false; // há edições livres ainda não persistidas

    /* ---------- histórico (Ctrl+Z) ----------
       Cada ação mutante (mover/redimensionar/girar, editar texto, duplicar,
       excluir) empilha uma closure que desfaz exatamente aquela mudança —
       tanto no modelo de ops quanto no DOM. Undo pop-a-executa. */
    function pushHist(fn) { history.push(fn); if (history.length > 100) history.shift(); }
    function undo() {
        var fn = history.pop();
        if (!fn) { toast('Nada para desfazer', 'ok'); return; }
        fn();
        markDirty();
    }
    // volta o overlay para o elemento afetado (seleciona se preciso, senão só reposiciona)
    function reselect(node) { if (!node) return; if (sel !== node) select(node); else positionOverlay(); }

    /* ---------- ícones ---------- */
    function icon(paths, size) {
        return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) +
            '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }
    var ICONS = {
        copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        rotate: '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>'
    };

    /* ---------- estilos ---------- */
    function injectStyles() {
        if (document.getElementById('mira-edit-free-style')) return;
        var h = '#mef-overlay .mef-h';
        var css = [
            '#mef-overlay{position:fixed;z-index:99990;pointer-events:none;',
            'outline:1.5px solid ' + ACCENT + ';box-shadow:0 0 0 1px rgba(0,0,0,.25);',
            'transform-origin:center center}',
            'body.mef-on #mef-overlay{display:block}',
            '#mef-overlay.mef-hide{display:none}',
            /* corpo arrastável (mover) */
            '#mef-overlay .mef-body{position:absolute;inset:0;pointer-events:auto;cursor:move}',
            /* alças de resize */
            h + '{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:3px;',
            'background:#fff;border:1.5px solid ' + ACCENT + ';pointer-events:auto;z-index:2}',
            h + '.nw{left:0;top:0;cursor:nwse-resize}' + h + '.n{left:50%;top:0;cursor:ns-resize}',
            h + '.ne{left:100%;top:0;cursor:nesw-resize}' + h + '.e{left:100%;top:50%;cursor:ew-resize}',
            h + '.se{left:100%;top:100%;cursor:nwse-resize}' + h + '.s{left:50%;top:100%;cursor:ns-resize}',
            h + '.sw{left:0;top:100%;cursor:nesw-resize}' + h + '.w{left:0;top:50%;cursor:ew-resize}',
            /* Alt: crop estilo OBS, moldura e alças verdes */
            'body.mef-crop-mode #mef-overlay{outline-color:' + CROP_ACCENT + '}',
            'body.mef-crop-mode ' + h + '{background:' + CROP_ACCENT + ';border-color:' + CROP_ACCENT + '}',
            'body.mef-crop-mode #mef-overlay .mef-rot{border-color:' + CROP_ACCENT + '}',
            'body.mef-crop-mode #mef-overlay .mef-rot::before{background:' + CROP_ACCENT + '}',
            'body.mef-crop-mode #mef-actions{border-color:' + CROP_ACCENT + '}',
            /* alça de rotação */
            '#mef-overlay .mef-rot{position:absolute;left:50%;top:-46px;width:24px;height:24px;margin-left:-12px;',
            'display:grid;place-items:center;border-radius:50%;background:#181818;color:#fff;border:2px solid ' + ACCENT + ';',
            'pointer-events:auto;touch-action:none;cursor:grab;z-index:3;font:700 16px/1 system-ui,sans-serif}',
            '#mef-overlay .mef-rot::after{content:"↻";transform:translateY(-1px)}',
            '#mef-overlay .mef-rot::before{content:"";position:absolute;left:50%;top:22px;width:1.5px;height:24px;',
            'margin-left:-.75px;background:' + ACCENT + '}',
            /* sem espaço acima: alça abaixo do elemento; sem espaço em lugar nenhum: dentro, junto à borda de cima */
            '#mef-overlay.mef-rot-b .mef-rot{top:auto;bottom:-46px}',
            '#mef-overlay.mef-rot-b .mef-rot::before{top:-24px}',
            '#mef-overlay.mef-rot-in .mef-rot{top:12px}',
            '#mef-overlay.mef-rot-in .mef-rot::before{display:none}',
            /* mini-barra de ações (não rotaciona: elemento separado) */
            '#mef-actions{position:fixed;z-index:99992;display:none;gap:6px;padding:5px;border-radius:10px;',
            'background:rgba(18,18,18,.92);border:1px solid rgba(255,144,77,.4);box-shadow:0 8px 24px rgba(0,0,0,.45)}',
            'body.mef-on #mef-actions.mef-show{display:flex}',
            '#mef-actions button{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;',
            'border:none;border-radius:7px;cursor:pointer;color:#fff;background:rgba(255,255,255,.08);transition:all .15s}',
            '#mef-actions button:hover{background:' + ACCENT + ';color:#101010}',
            /* elemento sendo editado como texto */
            'body.mef-text-editing #mef-overlay,body.mef-text-editing #mef-actions{display:none!important}',
            '.mef-editing{position:relative;z-index:99993;outline:2px dashed ' + ACCENT + ' !important;',
            'cursor:text!important;caret-color:' + ACCENT + ';user-select:text!important;-webkit-user-select:text!important}',
            /* toast */
            '#mef-toast{position:fixed;left:50%;top:64px;transform:translateX(-50%) translateY(-8px);',
            'z-index:100001;display:flex;align-items:center;gap:8px;max-width:80vw;padding:11px 15px;border-radius:11px;',
            'background:rgba(18,18,18,.94);color:#fff;border:1px solid rgba(255,255,255,.16);',
            'font:600 13px/1.3 Inter,system-ui,sans-serif;box-shadow:0 12px 36px rgba(0,0,0,.5);',
            'opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}',
            '#mef-toast.mef-show{opacity:1;transform:translateX(-50%) translateY(0)}',
            '#mef-toast.mef-ok{border-color:rgba(255,144,77,.5)}#mef-toast.mef-ok svg{color:' + ACCENT + '}',
            '#mef-toast.mef-err{border-color:rgba(255,90,90,.6)}#mef-toast.mef-err svg{color:#ff5a5a}'
        ].join('');
        var el = document.createElement('style');
        el.id = 'mira-edit-free-style';
        el.textContent = css;
        document.head.appendChild(el);
    }

    /* ---------- toast ---------- */
    var toastTimer = null;
    function toast(msg, kind) {
        var t = document.getElementById('mef-toast');
        if (!t) { t = document.createElement('div'); t.id = 'mef-toast'; t.setAttribute('data-me-chrome', '1'); document.body.appendChild(t); }
        t.className = kind === 'err' ? 'mef-err' : 'mef-ok';
        t.innerHTML = icon(kind === 'err' ? ICONS.x : ICONS.check, 18) + '<span>' + msg + '</span>';
        void t.offsetWidth;
        t.classList.add('mef-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('mef-show'); }, 3200);
    }

    /* ---------- detecção de slides (espelha o mira-edit.js) ---------- */
    function detectDeck() {
        var bodySections = document.querySelectorAll('body > section');
        if (bodySections.length >= 2) return { root: document.body, childTag: 'section', kind: 'section' };
        var main = document.querySelector('main');
        if (main) {
            var kids = 0;
            for (var i = 0; i < main.children.length; i++) if (main.children[i].nodeType === 1) kids++;
            if (kids >= 2) return { root: main, childTag: '*', kind: 'main' };
        }
        // single-slide ou estrutura desconhecida: usa o próprio body como palco
        return { root: document.body, childTag: 'section', kind: 'section' };
    }

    function slideEls() {
        var d = detectDeck();
        root = d.root; childTag = d.childTag; kind = d.kind;
        var list = Array.prototype.slice.call(root.querySelectorAll(':scope > ' + childTag));
        if (!list.length) list = [document.body];
        return list;
    }

    function isChrome(el) { return !el || (el.closest && el.closest(CHROME)); }

    // walk determinístico: mesmos ids na edição e no applier. Ignora chrome,
    // slides em si e nós duplicados (data-me-dup), para os índices-base não driftarem.
    function walkBase(cb) {
        var slides = slideEls();
        slides.forEach(function (slide, i) {
            var nodes = slide.querySelectorAll(EDITABLE);
            var j = 0;
            Array.prototype.forEach.call(nodes, function (el) {
                if (isChrome(el)) return;
                if (el.hasAttribute('data-me-dup')) return;
                if (el.classList && el.classList.contains('me-slide')) return;
                cb(el, 'me-' + i + '-' + j);
                j++;
            });
        });
    }

    function assignIds() {
        walkBase(function (el, id) { if (!el.dataset.meId) el.dataset.meId = id; });
    }

    function byId(id) {
        return document.querySelector('[data-me-id="' + id + '"]');
    }

    /* ---------- ops ---------- */
    function getOp(id, create) {
        var o = opsMap[id];
        if (!o && create) { o = { id: id }; opsMap[id] = o; opsArr.push(o); }
        return o;
    }
    function metrics(el) {
        var r = el.getBoundingClientRect();
        // SVG não expõe offsetWidth/offsetHeight em todos os navegadores.
        // clientWidth/clientHeight preservam a caixa de layout sem a escala CSS;
        // assim o overlay não multiplica a escala uma segunda vez.
        return {
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            w: (el.offsetWidth || el.clientWidth || r.width),
            h: (el.offsetHeight || el.clientHeight || r.height)
        };
    }
    function ensureBase(el, op) {
        if (op.baseT == null) op.baseT = el.style.transform || '';
    }
    function applyTransform(el, op) {
        ensureBase(el, op);
        var t = op.baseT || '';
        var tx = op.tx || 0, ty = op.ty || 0, sx = op.sx == null ? 1 : op.sx, sy = op.sy == null ? 1 : op.sy, rot = op.rot || 0;
        // transform NÃO afeta elementos inline puros (ex.: <span> de rótulo).
        // Ao aplicar qualquer transform, promove para inline-block para que
        // mover/redimensionar/girar funcione. Rodado também no applier (load),
        // então a promoção se refaz sozinha sem precisar ser persistida.
        if (tx || ty || rot || sx !== 1 || sy !== 1) {
            try { if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'; } catch (e) {}
        }
        if (tx || ty) t += ' translate(' + tx + 'px,' + ty + 'px)';
        if (rot) t += ' rotate(' + rot + 'deg)';
        if (sx !== 1 || sy !== 1) t += ' scale(' + sx + ',' + sy + ')';
        el.style.transform = t.trim();
        el.style.transformOrigin = 'center center';
    }

    function cropState(op) {
        return {
            t: op.cropT || 0,
            r: op.cropR || 0,
            b: op.cropB || 0,
            l: op.cropL || 0
        };
    }
    function hasCrop(op) {
        return !!(op && (op.cropT || op.cropR || op.cropB || op.cropL));
    }
    function ensureBaseClip(el, op) {
        var css = null;
        try { css = getComputedStyle(el); } catch (e) {}
        if (op.baseClip == null) {
            var clip = el.style.clipPath || (css && css.clipPath) || '';
            op.baseClip = clip === 'none' ? '' : clip;
        }
        if (op.baseWebkitClip == null) {
            var webkitClip = el.style.webkitClipPath || (css && css.webkitClipPath) || '';
            op.baseWebkitClip = webkitClip === 'none' ? '' : webkitClip;
        }
    }
    function cropPct(v) {
        return (Math.round((v || 0) * 10000) / 100) + '%';
    }
    function applyCrop(el, op) {
        ensureBaseClip(el, op);
        if (hasCrop(op)) {
            var c = cropState(op);
            var clip = 'inset(' + cropPct(c.t) + ' ' + cropPct(c.r) + ' ' +
                cropPct(c.b) + ' ' + cropPct(c.l) + ')';
            try { if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'; } catch (e) {}
            el.style.clipPath = clip;
            el.style.webkitClipPath = clip;
        } else {
            el.style.clipPath = op.baseClip || '';
            el.style.webkitClipPath = op.baseWebkitClip || '';
        }
    }

    // Caixa visível do elemento depois do crop. O layout e o centro do elemento
    // continuam intactos; só a moldura acompanha a área que ainda está visível.
    function frameMetrics(el, op) {
        var m = metrics(el);
        var sx = op.sx == null ? 1 : op.sx;
        var sy = op.sy == null ? 1 : op.sy;
        var rot = op.rot || 0;
        var c = cropState(op);
        var fullW = m.w * sx, fullH = m.h * sy;
        var localX = (c.l - c.r) * fullW / 2;
        var localY = (c.t - c.b) * fullH / 2;
        var a = rot * Math.PI / 180;
        return {
            base: m,
            sx: sx,
            sy: sy,
            rot: rot,
            cx: m.cx + localX * Math.cos(a) - localY * Math.sin(a),
            cy: m.cy + localX * Math.sin(a) + localY * Math.cos(a),
            w: Math.max(1, fullW * (1 - c.l - c.r)),
            h: Math.max(1, fullH * (1 - c.t - c.b))
        };
    }
    function syncCropMode() {
        if (!document.body) return;
        document.body.classList.toggle('mef-crop-mode',
            !!sel && (altDown || !!(drag && drag.mode === 'crop')));
    }

    /* ---------- overlay ---------- */
    var overlay = null, actions = null;
    function buildOverlay() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'mef-overlay';
        overlay.className = 'mef-hide';
        overlay.setAttribute('data-me-chrome', '1');
        var html = '<div class="mef-body"></div><div class="mef-rot" data-role="rot" title="Girar"></div>';
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function (p) {
            html += '<div class="mef-h ' + p + '" data-role="resize" data-dir="' + p +
                '" title="Redimensionar. Alt + arrastar: recortar"></div>';
        });
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        overlay.addEventListener('pointerdown', onOverlayDown);

        actions = document.createElement('div');
        actions.id = 'mef-actions';
        actions.setAttribute('data-me-chrome', '1');
        actions.innerHTML =
            '<button data-act="dup" title="Duplicar">' + icon(ICONS.copy, 16) + '</button>' +
            '<button data-act="del" title="Excluir">' + icon(ICONS.trash, 16) + '</button>';
        document.body.appendChild(actions);
        actions.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        actions.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.dataset.act === 'dup') duplicateSel();
            if (b.dataset.act === 'del') deleteSel();
        });
    }

    function positionOverlay() {
        if (!sel || !overlay) return;
        var op = getOp(sel.dataset.meId, false) || {};
        var f = frameMetrics(sel, op);
        var sx = f.sx, sy = f.sy, rot = f.rot;
        var w = f.w, h = f.h;
        overlay.style.left = (f.cx - w / 2) + 'px';
        overlay.style.top = (f.cy - h / 2) + 'px';
        overlay.style.width = w + 'px';
        overlay.style.height = h + 'px';
        overlay.style.transform = 'rotate(' + rot + 'deg)';
        // alça de rotação sempre alcançável: sem espaço acima, vai para baixo;
        // elemento ocupando a tela toda (ex.: svg de palco), fica por dentro.
        var rotRoom = 64; // 46px de haste + metade da alça + folga
        var topPx = f.cy - h / 2;
        overlay.classList.remove('mef-rot-b', 'mef-rot-in');
        if (topPx < rotRoom) {
            if (topPx + h + rotRoom <= window.innerHeight) overlay.classList.add('mef-rot-b');
            else overlay.classList.add('mef-rot-in');
        }
        overlay.classList.remove('mef-hide');
        // mini-barra na lateral: nunca cobre a alça de rotação no topo.
        actions.classList.add('mef-show');
        var actionW = actions.offsetWidth || 210, actionH = actions.offsetHeight || 42, gap = 12;
        var actionLeft = f.cx + w / 2 + gap;
        var actionTop = f.cy - h / 2;
        if (actionLeft + actionW > window.innerWidth - 8) actionLeft = f.cx - w / 2 - actionW - gap;
        if (actionLeft < 8) {
            actionLeft = Math.max(8, Math.min(window.innerWidth - actionW - 8, f.cx - actionW / 2));
            actionTop = f.cy + h / 2 + gap;
        }
        actionTop = Math.max(8, Math.min(window.innerHeight - actionH - 8, actionTop));
        actions.style.left = actionLeft + 'px';
        actions.style.top = actionTop + 'px';
    }

    function select(el) {
        if (sel === el) return;
        sel = el;
        if (!el) {
            if (overlay) overlay.classList.add('mef-hide');
            if (actions) actions.classList.remove('mef-show');
            syncCropMode();
            return;
        }
        getOp(el.dataset.meId, true);
        positionOverlay();
        syncCropMode();
    }

    /* ---------- interações de transform ---------- */
    function onOverlayDown(e) {
        if (!sel) return;
        e.preventDefault(); e.stopPropagation();
        // O segundo pointerdown de um duplo clique pertence à edição de texto,
        // não a um novo gesto de mover.
        if (e.detail > 1) return;
        if (drag) onDragCancel();     // gesto anterior nunca terminou: descarta antes de começar outro
        var role = e.target.getAttribute('data-role');
        var op = getOp(sel.dataset.meId, true);
        ensureBase(sel, op);
        ensureBaseClip(sel, op);
        var m = metrics(sel);
        var f = frameMetrics(sel, op);
        // O modificador do próprio evento é a fonte de verdade: ressincroniza
        // altDown caso o keyup de Alt tenha sido engolido por um diálogo.
        altDown = !!e.altKey;
        var cropGesture = role === 'resize' && altDown;
        var c0 = cropState(op);
        drag = {
            mode: cropGesture ? 'crop' : (role || 'move'), dir: e.target.getAttribute('data-dir'),
            sx: e.clientX, sy: e.clientY, cx: m.cx, cy: m.cy,
            resizeCx: f.cx, resizeCy: f.cy, baseW: m.w, baseH: m.h,
            op0: {
                tx: op.tx || 0, ty: op.ty || 0,
                sxv: op.sx == null ? 1 : op.sx, syv: op.sy == null ? 1 : op.sy,
                rot: op.rot || 0, cropT: c0.t, cropR: c0.r, cropB: c0.b, cropL: c0.l
            },
            startDist: Math.hypot(e.clientX - f.cx, e.clientY - f.cy),
            startAng: Math.atan2(e.clientY - m.cy, e.clientX - m.cx)
        };
        syncCropMode();
        window.addEventListener('pointermove', onDragMove);
        window.addEventListener('pointerup', onDragUp);
        window.addEventListener('pointercancel', onDragCancel);
    }

    function onDragMove(e) {
        if (!drag || !sel) return;
        var op = getOp(sel.dataset.meId, true);
        if (drag.mode === 'move') {
            op.tx = drag.op0.tx + (e.clientX - drag.sx);
            op.ty = drag.op0.ty + (e.clientY - drag.sy);
        } else if (drag.mode === 'rot') {
            var ang = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
            var deg = drag.op0.rot + (ang - drag.startAng) * 180 / Math.PI;
            deg = ((deg % 360) + 360) % 360;
            op.rot = Math.round(deg * 10) / 10;
        } else if (drag.mode === 'resize') {
            var f = drag.startDist ? Math.hypot(e.clientX - drag.resizeCx, e.clientY - drag.resizeCy) / drag.startDist : 1;
            f = Math.max(0.05, f);
            var d = drag.dir;
            var corner = (d === 'nw' || d === 'ne' || d === 'se' || d === 'sw');
            if (corner) { op.sx = clampScale(drag.op0.sxv * f); op.sy = clampScale(drag.op0.syv * f); }
            else if (d === 'e' || d === 'w') { op.sx = clampScale(drag.op0.sxv * f); }
            else { op.sy = clampScale(drag.op0.syv * f); }
        } else if (drag.mode === 'crop') {
            var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
            var a = drag.op0.rot * Math.PI / 180;
            var localX = dx * Math.cos(a) + dy * Math.sin(a);
            var localY = -dx * Math.sin(a) + dy * Math.cos(a);
            var fx = localX / Math.max(1, drag.baseW * drag.op0.sxv);
            var fy = localY / Math.max(1, drag.baseH * drag.op0.syv);
            var dir = drag.dir || '';
            var ct = drag.op0.cropT, cr = drag.op0.cropR;
            var cb = drag.op0.cropB, cl = drag.op0.cropL;
            if (dir.indexOf('w') !== -1) cl = clampCrop(cl + fx, cr);
            if (dir.indexOf('e') !== -1) cr = clampCrop(cr - fx, cl);
            if (dir.indexOf('n') !== -1) ct = clampCrop(ct + fy, cb);
            if (dir.indexOf('s') !== -1) cb = clampCrop(cb - fy, ct);
            op.cropT = ct; op.cropR = cr; op.cropB = cb; op.cropL = cl;
        }
        if (drag.mode === 'crop') applyCrop(sel, op);
        else applyTransform(sel, op);
        positionOverlay();
    }
    function clampScale(v) { return Math.max(0.05, Math.round(v * 1000) / 1000); }
    function clampCrop(v, opposite) {
        var max = Math.max(0, 0.98 - (opposite || 0));
        return Math.round(Math.max(0, Math.min(max, v)) * 10000) / 10000;
    }

    function onDragUp() {
        var d = drag; drag = null;
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', onDragUp);
        window.removeEventListener('pointercancel', onDragCancel);
        if (d && sel) {
            var id = sel.dataset.meId;
            var op = getOp(id, true);
            var b = d.op0;   // valores antes do arraste
            var moved = (op.tx || 0) !== b.tx || (op.ty || 0) !== b.ty ||
                (op.sx == null ? 1 : op.sx) !== b.sxv || (op.sy == null ? 1 : op.sy) !== b.syv ||
                (op.rot || 0) !== b.rot;
            var cropped = (op.cropT || 0) !== b.cropT || (op.cropR || 0) !== b.cropR ||
                (op.cropB || 0) !== b.cropB || (op.cropL || 0) !== b.cropL;
            if (moved || cropped) {
                pushHist(function () {
                    var o = getOp(id, true);
                    o.tx = b.tx; o.ty = b.ty; o.sx = b.sxv; o.sy = b.syv; o.rot = b.rot;
                    o.cropT = b.cropT; o.cropR = b.cropR; o.cropB = b.cropB; o.cropL = b.cropL;
                    var node = byId(id);
                    if (node) { applyTransform(node, o); applyCrop(node, o); reselect(node); }
                });
                markDirty();
            }
        }
        syncCropMode();
        refreshBar();
    }
    function onDragCancel() {
        var d = drag; drag = null;
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', onDragUp);
        window.removeEventListener('pointercancel', onDragCancel);
        if (d && sel) {
            var o = getOp(sel.dataset.meId, true);
            var b = d.op0;
            o.tx = b.tx; o.ty = b.ty; o.sx = b.sxv; o.sy = b.syv; o.rot = b.rot;
            o.cropT = b.cropT; o.cropR = b.cropR; o.cropB = b.cropB; o.cropL = b.cropL;
            applyTransform(sel, o);
            applyCrop(sel, o);
            positionOverlay();
        }
        syncCropMode();
        refreshBar();
    }

    /* ---------- texto inline ---------- */
    var textCtx = null;
    function cleanInnerHTML(el) {
        var clone = el.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('[data-me-id],[data-me-dup],[contenteditable],.mef-editing'), function (node) {
            node.removeAttribute('data-me-id');
            node.removeAttribute('data-me-dup');
            node.removeAttribute('contenteditable');
            if (node.classList) node.classList.remove('mef-editing');
        });
        return clone.innerHTML;
    }
    function startTextEdit(el, clientX, clientY) {
        if (!el || textCtx) return;
        if (!el.matches || !el.matches(TEXT_EDITABLE)) return;
        textCtx = { el: el, prevHTML: el.innerHTML, rich: el.children.length > 0 };
        document.body.classList.add('mef-text-editing');
        if (overlay) overlay.classList.add('mef-hide');
        if (actions) actions.classList.remove('mef-show');
        el.setAttribute('contenteditable', 'true');
        el.classList.add('mef-editing');
        el.focus();
        var rng = null;
        if (textCtx.rich && document.caretRangeFromPoint && clientX != null && clientY != null) {
            try {
                var hit = document.caretRangeFromPoint(clientX, clientY);
                if (hit && el.contains(hit.startContainer)) rng = hit;
            } catch (e) {}
        }
        if (!rng) {
            rng = document.createRange();
            rng.selectNodeContents(el);
            if (textCtx.rich) rng.collapse(false);
        }
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(rng);
        el.addEventListener('keydown', onTextKey);
        el.addEventListener('blur', commitText);
    }
    function onTextKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); if (textCtx) textCtx.el.innerHTML = textCtx.prevHTML; e.target.blur(); }
        e.stopPropagation();
    }
    function commitText(e) {
        var el = e.target;
        document.body.classList.remove('mef-text-editing');
        el.removeAttribute('contenteditable');
        el.classList.remove('mef-editing');
        el.removeEventListener('keydown', onTextKey);
        el.removeEventListener('blur', commitText);
        if (textCtx && el.innerHTML !== textCtx.prevHTML) {
            var id = el.dataset.meId;
            var op = getOp(id, true);
            var hadText = ('text' in op), oldOpText = op.text;
            var hadHTML = ('html' in op), oldOpHTML = op.html, prevHTML = textCtx.prevHTML;
            op.html = cleanInnerHTML(el);
            delete op.text;
            pushHist(function () {
                var node = byId(id); if (!node) return;
                node.innerHTML = prevHTML;
                var o = getOp(id, true);
                if (hadText) o.text = oldOpText; else delete o.text;
                if (hadHTML) o.html = oldOpHTML; else delete o.html;
                reselect(node);
            });
            markDirty();
        }
        textCtx = null;
        positionOverlay();
    }
    // Encerra a edição de texto mesmo quando o blur do elemento nunca dispara
    // (diálogo de salvar/permissão rouba o foco, ou o focus() inicial falhou).
    // Sem isso, body.mef-text-editing fica presa e o overlay some até um F5.
    function commitActiveTextEdit() {
        if (!textCtx) {
            document.body.classList.remove('mef-text-editing');
            return;
        }
        var el = textCtx.el;
        try { el.blur(); } catch (e) { /* segue pro commit forçado */ }
        if (textCtx) commitText({ target: el });
    }

    /* ---------- duplicar / excluir ---------- */
    function duplicateSel() {
        if (!sel) return;
        var srcId = sel.dataset.meId;
        var clone = sel.cloneNode(true);
        var newId = 'me-dup-' + (++dupCount) + '-' + srcId;
        clone.setAttribute('data-me-dup', '1');
        clone.dataset.meId = newId;
        clone.removeAttribute('contenteditable');
        clone.classList.remove('mef-editing');
        sel.parentNode.insertBefore(clone, sel.nextSibling);
        var srcOp = getOp(srcId, false) || {};
        var op = getOp(newId, true);
        op.dupOf = srcId;
        op.baseT = srcOp.baseT != null ? srcOp.baseT : (sel.style.transform || '');
        op.baseClip = srcOp.baseClip != null ? srcOp.baseClip : '';
        op.baseWebkitClip = srcOp.baseWebkitClip != null ? srcOp.baseWebkitClip : '';
        op.tx = (srcOp.tx || 0) + 24; op.ty = (srcOp.ty || 0) + 24;
        op.sx = srcOp.sx == null ? 1 : srcOp.sx; op.sy = srcOp.sy == null ? 1 : srcOp.sy;
        op.rot = srcOp.rot || 0;
        op.cropT = srcOp.cropT || 0; op.cropR = srcOp.cropR || 0;
        op.cropB = srcOp.cropB || 0; op.cropL = srcOp.cropL || 0;
        if (srcOp.text != null) op.text = srcOp.text;
        if (srcOp.html != null) op.html = srcOp.html;
        applyTransform(clone, op);
        applyCrop(clone, op);
        select(clone);
        pushHist(function () {
            opsArr = opsArr.filter(function (o) { return o.id !== newId; });
            delete opsMap[newId];
            if (sel === clone) select(null);
            clone.remove();
        });
        markDirty();
        toast('Elemento duplicado', 'ok');
    }

    function deleteSel() {
        if (!sel) return;
        var node = sel;
        var id = node.dataset.meId;
        var parent = node.parentNode, next = node.nextSibling;
        var isDup = node.hasAttribute('data-me-dup');
        var op = getOp(id, true);
        var prevDeleted = op.deleted, removedOp = op;
        if (isDup) {
            // duplicata só existe em runtime: remove a op inteira e o nó
            opsArr = opsArr.filter(function (o) { return o.id !== id; });
            delete opsMap[id];
        } else {
            op.deleted = true;
        }
        select(null);
        node.remove();
        pushHist(function () {
            if (parent) {
                if (next && next.parentNode === parent) parent.insertBefore(node, next);
                else parent.appendChild(node);
            }
            if (isDup) {
                if (!opsMap[id]) { opsMap[id] = removedOp; opsArr.push(removedOp); }
            } else {
                getOp(id, true).deleted = prevDeleted;
            }
            select(node);
        });
        markDirty();
        toast('Elemento excluído', 'ok');
    }

    /* ---------- integração com a barra única do mira-edit ---------- */
    var bar = null;
    function buildBar() {
        bar = document.getElementById('me-bar');
        refreshBar();
    }
    function meaningfulOps() {
        return opsArr.filter(function (o) {
            return o.deleted || o.dupOf || o.text != null || o.html != null ||
                (o.tx && o.tx !== 0) || (o.ty && o.ty !== 0) ||
                (o.rot && o.rot !== 0) || (o.sx != null && o.sx !== 1) || (o.sy != null && o.sy !== 1) ||
                o.cropT || o.cropR || o.cropB || o.cropL;
        });
    }
    function refreshBar() {
        var detail = { dirty: stateDirty, count: stateDirty ? meaningfulOps().length : 0 };
        try { document.dispatchEvent(new CustomEvent('mira:free-change', { detail: detail })); } catch (e) {}
    }
    function markDirty() { stateDirty = true; refreshBar(); }

    /* ---------- persistência ---------- */
    function remapId(id, permutation) {
        if (!id || !Array.isArray(permutation)) return id;
        var dup = /^(me-dup-\d+-)(.+)$/.exec(id);
        if (dup) return dup[1] + remapId(dup[2], permutation);
        var base = /^me-(\d+)-(.*)$/.exec(id);
        if (!base) return id;
        var next = permutation.indexOf(parseInt(base[1], 10));
        return next === -1 ? id : 'me-' + next + '-' + base[2];
    }
    function serialize(permutation) {
        var ops = meaningfulOps().map(function (o) {
            var out = { id: remapId(o.id, permutation) };
            if (o.dupOf) out.dupOf = remapId(o.dupOf, permutation);
            if (o.deleted) out.deleted = true;
            if (o.text != null) out.text = o.text;
            if (o.html != null) out.html = o.html;
            if (o.tx) out.tx = o.tx; if (o.ty) out.ty = o.ty;
            if (o.rot) out.rot = o.rot;
            if (o.sx != null && o.sx !== 1) out.sx = o.sx;
            if (o.sy != null && o.sy !== 1) out.sy = o.sy;
            if (o.cropT) out.cropT = o.cropT;
            if (o.cropR) out.cropR = o.cropR;
            if (o.cropB) out.cropB = o.cropB;
            if (o.cropL) out.cropL = o.cropL;
            if (o.baseT) out.baseT = o.baseT;
            if (o.baseClip) out.baseClip = o.baseClip;
            if (o.baseWebkitClip) out.baseWebkitClip = o.baseWebkitClip;
            return out;
        });
        return JSON.stringify({ v: 1, ops: ops }, null, 0).replace(/</g, '\\u003c');
    }
    function injectOps(src, json) {
        var block = '<script id="mira-free-edits" type="application/json">' + json + '<\/script>';
        var re = /<script id="mira-free-edits"[\s\S]*?<\/script>/i;
        if (re.test(src)) return src.replace(re, block);
        var idx = src.lastIndexOf('</body>');
        if (idx === -1) return src + '\n' + block + '\n';
        return src.slice(0, idx) + block + '\n' + src.slice(idx);
    }

    function rebaseRuntime(permutation) {
        if (!Array.isArray(permutation)) return;
        var nextMap = {};
        opsArr.forEach(function (op) {
            op.id = remapId(op.id, permutation);
            if (op.dupOf) op.dupOf = remapId(op.dupOf, permutation);
            nextMap[op.id] = op;
        });
        opsMap = nextMap;
        Array.prototype.forEach.call(document.querySelectorAll('[data-me-id]'), function (el) {
            el.dataset.meId = remapId(el.dataset.meId, permutation);
        });
    }

    function exposeApi() {
        window.miraEditFree = {
            hasChanges: function () { return stateDirty; },
            changeCount: function () { return stateDirty ? meaningfulOps().length : 0; },
            injectIntoSource: function (src, options) {
                commitActiveTextEdit();   // salvar no meio de uma edição de texto inclui (e encerra) a edição
                var permutation = options && options.slidePermutation;
                return injectOps(src, serialize(permutation));
            },
            markSaved: function (options) {
                if (options && options.slidePermutation) rebaseRuntime(options.slidePermutation);
                stateDirty = false;
                refreshBar();
            }
        };
        refreshBar();
    }

    /* ---------- applier (load, fora do modo edição) ---------- */
    function applyEmbedded() {
        var node = document.getElementById('mira-free-edits');
        if (!node) return;
        var data;
        try { data = JSON.parse(node.textContent); } catch (e) { return; }
        if (!data || !Array.isArray(data.ops)) return;
        assignIds();
        opsArr = []; opsMap = {}; dupCount = 0;
        var originals = data.ops.filter(function (o) { return !o.dupOf; });
        originals.forEach(function (o) {
            var el = byId(o.id); if (!el) return;
            var op = getOp(o.id, true); Object.assign(op, o);
            if (o.html != null) el.innerHTML = o.html;
            else if (o.text != null) el.textContent = o.text;
            applyTransform(el, op);
            applyCrop(el, op);
        });
        var pending = data.ops.filter(function (o) { return !!o.dupOf; });
        while (pending.length) {
            var progressed = false;
            pending = pending.filter(function (o) {
                var base = byId(o.dupOf); if (!base) return true;
                var clone = base.cloneNode(true);
                clone.setAttribute('data-me-dup', '1');
                clone.dataset.meId = o.id;
                base.parentNode.insertBefore(clone, base.nextSibling);
                if (o.html != null) clone.innerHTML = o.html;
                else if (o.text != null) clone.textContent = o.text;
                var opC = getOp(o.id, true); Object.assign(opC, o);
                applyTransform(clone, opC);
                applyCrop(clone, opC);
                var match = /^me-dup-(\d+)-/.exec(o.id);
                if (match) dupCount = Math.max(dupCount, parseInt(match[1], 10));
                progressed = true;
                return false;
            });
            if (!progressed) break;
        }
        originals.forEach(function (o) { if (o.deleted) { var el = byId(o.id); if (el) el.remove(); } });
        stateDirty = false;
        refreshBar();
    }

    /* ---------- liga / desliga (observa body.me-on) ---------- */
    function enable() {
        if (enabled) return;
        enabled = true;
        document.body.classList.add('mef-on');
        buildOverlay(); buildBar();
        assignIds();
        // reidratar ops já aplicadas pelo applier para continuar editando
        refreshBar();
        window.addEventListener('scroll', onViewportChange, true);
        window.addEventListener('resize', onViewportChange);
        document.addEventListener('pointerdown', onDocDown, true);
        document.addEventListener('dblclick', onDocDblClick, true);
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('blur', onWindowBlur);
    }
    function disable() {
        if (!enabled) return;
        if (drag) onDragCancel();
        commitActiveTextEdit();   // não deixa contenteditable/estado de texto vivos fora do modo E
        enabled = false;
        document.body.classList.remove('mef-on');
        document.body.classList.remove('mef-text-editing');
        document.body.classList.remove('mef-crop-mode');
        altDown = false;
        select(null);
        history = [];
        window.removeEventListener('scroll', onViewportChange, true);
        window.removeEventListener('resize', onViewportChange);
        document.removeEventListener('pointerdown', onDocDown, true);
        document.removeEventListener('dblclick', onDocDblClick, true);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('blur', onWindowBlur);
    }
    function onViewportChange() { if (sel) positionOverlay(); }

    function onDocDown(e) {
        if (!enabled) return;
        // Auto-cura de estados presos por pointerup/keyup/blur que nunca chegaram
        // (diálogo de salvar/permissão do navegador rouba o foco no meio do fluxo):
        // roda ANTES do filtro de chrome pra valer também no clique em "Salvar".
        if (drag && !(overlay && overlay.contains(e.target))) onDragCancel();
        if (textCtx && textCtx.el !== e.target && !textCtx.el.contains(e.target)) commitActiveTextEdit();
        else if (!textCtx) document.body.classList.remove('mef-text-editing');
        altDown = !!e.altKey;
        if (isChrome(e.target)) return;                 // clique no overlay/barra: tratado à parte
        var el = e.target.closest ? e.target.closest(EDITABLE) : null;
        if (el && !isChrome(el) && !(el.classList && el.classList.contains('me-slide'))) {
            if (!el.dataset.meId) el.dataset.meId = 'me-x-' + Math.round(el.getBoundingClientRect().top);
            select(el);
        } else {
            select(null);
        }
        syncCropMode();
    }
    function onDocDblClick(e) {
        if (!enabled || !sel) return;
        if (isChrome(e.target) && !overlay.contains(e.target)) return;
        e.preventDefault(); e.stopPropagation();
        startTextEdit(sel, e.clientX, e.clientY);
    }
    function onKey(e) {
        if (!enabled) return;
        if (textCtx) return; // durante edição de texto, o contenteditable/undo nativo cuida
        if (e.key === 'Alt') {
            altDown = true;
            syncCropMode();
            if (sel) { e.preventDefault(); e.stopPropagation(); }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
            e.preventDefault(); e.stopPropagation(); undo(); return;
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); e.stopPropagation(); deleteSel(); }
        else if (e.key === 'Escape' && sel) { e.preventDefault(); e.stopPropagation(); select(null); } // não deixa sair do modo edição
    }
    function onKeyUp(e) {
        if (e.key !== 'Alt') return;
        altDown = false;
        syncCropMode();
        if (sel) { e.preventDefault(); e.stopPropagation(); }
    }
    function onWindowBlur() {
        altDown = false;
        if (drag) onDragCancel();
        else syncCropMode();
    }

    function watchEditMode() {
        var mo = new MutationObserver(function () {
            var on = document.body.classList.contains('me-on');
            if (on && !enabled) enable();
            else if (!on && enabled) disable();
        });
        mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        if (document.body.classList.contains('me-on')) enable();
    }

    /* ---------- init ---------- */
    function init() {
        injectStyles();
        exposeApi();
        applyEmbedded();     // aplica overrides salvos, fora do modo edição
        watchEditMode();     // liga a edição livre junto com o modo edição
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
