/* =====================================================================
   mira-draw.js  ·  Telestrator do Mira (desenho ao vivo sobre o slide)
   ---------------------------------------------------------------------
   - Tecla "P" (de pintura) liga/desliga o modo desenho.
   - Barra de ferramentas à esquerda: caneta, marca-texto, linha, seta,
     retângulo vazado, círculo vazado, texto, borracha.
   - Cores, espessura, desfazer (Ctrl+Z) e limpar.
   - Camada por cima do slide (canvas fixo no viewport). NÃO altera o
     conteúdo embaixo: o loop/animação do slide segue rodando.

   Filosofia (igual mira-edit.js): vanilla, zero dependência externa,
   funciona em file:// e offline. Nada de build.

   Limitação conhecida (v1): as anotações ficam presas ao VIEWPORT, não
   ao slide — se rolar a página elas não acompanham. Fluxo esperado:
   anotar o que está na tela agora, e limpar antes de avançar.
   ===================================================================== */
(function () {
    'use strict';

    var ACCENT = '#FF904D';

    /* ---------- ícones (SVG inline, viewBox 24) ---------- */
    function icon(paths, size) {
        return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
            '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }
    var ICONS = {
        pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
        marker: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
        line: '<path d="M5 19 19 5"/>',
        arrow: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
        rect: '<rect x="4" y="5" width="16" height="14" rx="2"/>',
        ellipse: '<circle cx="12" cy="12" r="8"/>',
        text: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
        eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
        undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>',
        trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
        x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>'
    };

    var TOOLS = [
        { id: 'pen', name: 'Caneta (P)', icon: ICONS.pen },
        { id: 'marker', name: 'Marca-texto', icon: ICONS.marker },
        { id: 'line', name: 'Linha', icon: ICONS.line },
        { id: 'arrow', name: 'Seta', icon: ICONS.arrow },
        { id: 'rect', name: 'Retângulo', icon: ICONS.rect },
        { id: 'ellipse', name: 'Círculo', icon: ICONS.ellipse },
        { id: 'text', name: 'Texto', icon: ICONS.text },
        { id: 'eraser', name: 'Borracha', icon: ICONS.eraser }
    ];
    var COLORS = ['#FF904D', '#ffffff', '#ff5a5a', '#4d9fff', '#ffd24d', '#55d18e', '#c07bff'];
    var WIDTHS = [{ n: 'Fina', w: 3 }, { n: 'Média', w: 6 }, { n: 'Grossa', w: 12 }];

    /* ---------- estado ---------- */
    var active = false;
    var tool = 'pen';
    var color = ACCENT;
    var width = 6;
    var shapes = [];      // formas confirmadas
    var history = [];     // snapshots para desfazer
    var current = null;   // forma em andamento
    var drawing = false;
    var canvas = null, ctx = null, dpr = 1, W = 0, H = 0;
    var textInput = null;

    /* ---------- estilos ---------- */
    function injectStyles() {
        if (document.getElementById('mira-draw-style')) return;
        var css = [
            '#md-canvas{position:fixed;inset:0;z-index:99998;display:none;touch-action:none;cursor:crosshair}',
            /* md-has: canvas visível (só leitura) quando há traços, mesmo fora do modo desenho */
            'body.md-has #md-canvas{display:block;pointer-events:none}',
            'body.md-on #md-canvas{display:block;pointer-events:auto}',
            '#md-bar{position:fixed;left:16px;top:50%;transform:translate(-140%,-50%);z-index:99999;',
            'display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:10px;border-radius:18px;',
            'background:rgba(16,16,16,.92);backdrop-filter:blur(14px);border:1px solid rgba(255,144,77,.35);',
            'box-shadow:0 18px 50px rgba(0,0,0,.5);opacity:0;transition:transform .28s ease,opacity .28s ease;',
            'font-family:Inter,system-ui,sans-serif;max-height:92vh;overflow-y:auto}',
            'body.md-on #md-bar{transform:translate(0,-50%);opacity:1}',
            '.md-tool{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;',
            'border-radius:12px;border:none;cursor:pointer;color:#fff;background:rgba(255,255,255,.06);',
            'transition:all .15s ease}',
            '.md-tool:hover{background:rgba(255,255,255,.14)}',
            '.md-tool.md-active{color:#101010;background:' + ACCENT + '}',
            '.md-sep{height:1px;margin:4px 2px;background:rgba(255,255,255,.12)}',
            '.md-colors{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:2px}',
            '.md-sw{width:20px;height:20px;border-radius:50%;cursor:pointer;border:2px solid rgba(255,255,255,.2);',
            'transition:transform .12s ease}',
            '.md-sw:hover{transform:scale(1.15)}',
            '.md-sw.md-active{border-color:#fff;box-shadow:0 0 0 2px ' + ACCENT + '}',
            '.md-custom{width:20px;height:20px;padding:0;border:2px solid rgba(255,255,255,.2);border-radius:50%;',
            'background:conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red);cursor:pointer;overflow:hidden}',
            '.md-custom::-webkit-color-swatch-wrapper{padding:0}.md-custom::-webkit-color-swatch{border:none}',
            '.md-widths{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:2px 4px}',
            '.md-wbtn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;',
            'border-radius:8px;border:none;cursor:pointer;background:rgba(255,255,255,.06)}',
            '.md-wbtn:hover{background:rgba(255,255,255,.14)}',
            '.md-wbtn.md-active{background:' + ACCENT + '}',
            '.md-wdot{border-radius:50%;background:#fff}',
            '.md-wbtn.md-active .md-wdot{background:#101010}',
            '.md-textinput{position:fixed;z-index:100000;background:transparent;border:1px dashed ' + ACCENT + ';',
            'outline:none;padding:2px 4px;font-family:Inter,system-ui,sans-serif;font-weight:700;line-height:1;caret-color:' + ACCENT + '}',
            /* pílula de dica no topo */
            '#md-hint{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99999;display:none;',
            'align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(16,16,16,.9);',
            'border:1px solid rgba(255,144,77,.35);color:rgba(255,255,255,.85);',
            'font:600 12px/1 Inter,system-ui,sans-serif}',
            'body.md-on #md-hint{display:flex}',
            '#md-hint b{color:' + ACCENT + '}',
            /* tela baixa (celular deitado): barra horizontal no rodapé, botões menores */
            '@media (max-height:520px){',
            '#md-bar{left:50%;top:auto;bottom:12px;transform:translate(-50%,160%);',
            'flex-direction:row;align-items:center;gap:4px;padding:8px;max-width:96vw;',
            'max-height:none;overflow-y:visible;overflow-x:auto}',
            'body.md-on #md-bar{transform:translate(-50%,0)}',
            '.md-tool{width:36px;height:36px;flex:none}',
            '.md-sep{width:1px;height:26px;margin:0 4px;align-self:center}',
            '#md-hint{display:none!important}',
            '}'
        ].join('');
        var el = document.createElement('style');
        el.id = 'mira-draw-style';
        el.textContent = css;
        document.head.appendChild(el);
    }

    /* ---------- UI ---------- */
    function buildUI() {
        if (document.getElementById('md-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'md-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        var bar = document.createElement('div');
        bar.id = 'md-bar';

        // ferramentas
        TOOLS.forEach(function (t) {
            var b = document.createElement('button');
            b.className = 'md-tool' + (t.id === tool ? ' md-active' : '');
            b.dataset.tool = t.id;
            b.title = t.name;
            b.innerHTML = icon(t.icon, 20);
            b.addEventListener('click', function () { setTool(t.id); });
            bar.appendChild(b);
        });

        bar.appendChild(sep());

        // cores
        var colors = document.createElement('div');
        colors.className = 'md-colors';
        COLORS.forEach(function (c) {
            var s = document.createElement('button');
            s.className = 'md-sw' + (c === color ? ' md-active' : '');
            s.dataset.color = c;
            s.style.background = c;
            s.title = c;
            s.addEventListener('click', function () { setColor(c); });
            colors.appendChild(s);
        });
        var custom = document.createElement('input');
        custom.type = 'color';
        custom.className = 'md-custom';
        custom.title = 'Cor personalizada';
        custom.value = '#ffffff';
        custom.addEventListener('input', function () { setColor(custom.value); });
        colors.appendChild(custom);
        bar.appendChild(colors);

        // espessura
        var widths = document.createElement('div');
        widths.className = 'md-widths';
        WIDTHS.forEach(function (o) {
            var b = document.createElement('button');
            b.className = 'md-wbtn' + (o.w === width ? ' md-active' : '');
            b.dataset.w = String(o.w);
            b.title = o.n;
            var d = document.createElement('span');
            d.className = 'md-wdot';
            var px = Math.max(6, Math.min(16, o.w + 3));
            d.style.width = px + 'px'; d.style.height = px + 'px';
            b.appendChild(d);
            b.addEventListener('click', function () { setWidth(o.w); });
            widths.appendChild(b);
        });
        bar.appendChild(widths);

        bar.appendChild(sep());

        // ações
        bar.appendChild(actionBtn(ICONS.undo, 'Desfazer (Ctrl+Z)', undo));
        bar.appendChild(actionBtn(ICONS.trash, 'Limpar tudo', clearAll));
        bar.appendChild(actionBtn(ICONS.x, 'Sair (P / Esc)', function () { toggle(false); }));

        document.body.appendChild(bar);

        var hint = document.createElement('div');
        hint.id = 'md-hint';
        hint.innerHTML = 'Modo desenho — <b>P</b> ou <b>Esc</b> para sair · <b>Ctrl+Z</b> desfaz';
        document.body.appendChild(hint);

        window.addEventListener('resize', resize);
        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }

    function sep() { var s = document.createElement('div'); s.className = 'md-sep'; return s; }
    function actionBtn(ic, title, fn) {
        var b = document.createElement('button');
        b.className = 'md-tool';
        b.title = title;
        b.innerHTML = icon(ic, 20);
        b.addEventListener('click', fn);
        return b;
    }

    /* ---------- seleção de ferramenta/cor/espessura ---------- */
    function setTool(id) {
        tool = id;
        commitText();
        Array.prototype.forEach.call(document.querySelectorAll('#md-bar .md-tool[data-tool]'), function (b) {
            b.classList.toggle('md-active', b.dataset.tool === id);
        });
        if (canvas) canvas.style.cursor = (id === 'eraser') ? 'cell' : (id === 'text' ? 'text' : 'crosshair');
    }
    function setColor(c) {
        color = c;
        Array.prototype.forEach.call(document.querySelectorAll('#md-bar .md-sw'), function (s) {
            s.classList.toggle('md-active', s.dataset.color === c);
        });
    }
    function setWidth(w) {
        width = w;
        Array.prototype.forEach.call(document.querySelectorAll('#md-bar .md-wbtn'), function (b) {
            b.classList.toggle('md-active', parseInt(b.dataset.w, 10) === w);
        });
    }

    /* ---------- canvas / render ---------- */
    function resize() {
        if (!canvas) return;
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        redraw();
    }

    function fontPx(w) { return Math.round(Math.max(18, w * 4.5)); }

    function drawShape(s) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.lineWidth = s.width;

        if (s.type === 'pen' || s.type === 'marker') {
            if (s.type === 'marker') { ctx.globalAlpha = 0.32; ctx.lineWidth = s.width * 3.2; }
            polyline(s.points);
        } else if (s.type === 'line') {
            seg(s.x0, s.y0, s.x1, s.y1);
        } else if (s.type === 'arrow') {
            seg(s.x0, s.y0, s.x1, s.y1);
            arrowHead(s.x0, s.y0, s.x1, s.y1, s.width);
        } else if (s.type === 'rect') {
            ctx.strokeRect(Math.min(s.x0, s.x1), Math.min(s.y0, s.y1),
                Math.abs(s.x1 - s.x0), Math.abs(s.y1 - s.y0));
        } else if (s.type === 'ellipse') {
            var cx = (s.x0 + s.x1) / 2, cy = (s.y0 + s.y1) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, Math.abs(s.x1 - s.x0) / 2, Math.abs(s.y1 - s.y0) / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (s.type === 'text') {
            ctx.font = '700 ' + s.size + 'px Inter, system-ui, sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(s.text, s.x, s.y);
        }
        ctx.restore();
    }

    function polyline(pts) {
        if (!pts.length) return;
        if (pts.length === 1) {
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
            return;
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
    }
    function seg(x0, y0, x1, y1) {
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    function arrowHead(x0, y0, x1, y1, w) {
        var a = Math.atan2(y1 - y0, x1 - x0);
        var len = Math.max(14, w * 3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - len * Math.cos(a - Math.PI / 7), y1 - len * Math.sin(a - Math.PI / 7));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - len * Math.cos(a + Math.PI / 7), y1 - len * Math.sin(a + Math.PI / 7));
        ctx.stroke();
    }

    function redraw() {
        if (!ctx) return;
        document.body.classList.toggle('md-has', shapes.length > 0 || !!current);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < shapes.length; i++) drawShape(shapes[i]);
        if (current) drawShape(current);
    }

    /* ---------- histórico ---------- */
    function pushHistory() {
        history.push(shapes.slice());
        if (history.length > 60) history.shift();
    }
    function undo() {
        commitText();
        if (!history.length) return;
        shapes = history.pop();
        redraw();
        emitChange();
    }
    function clearAll() {
        commitText();
        if (!shapes.length) return;
        pushHistory();
        shapes = [];
        redraw();
        emitChange();
    }

    /* avisa o deck que os traços mudaram (o mira-remote usa p/ sincronizar) */
    function emitChange() {
        if (window.miraDraw && typeof window.miraDraw.onchange === 'function') {
            window.miraDraw.onchange(shapes.slice());
        }
    }

    /* ---------- borracha (por objeto) ---------- */
    function distSeg(px, py, ax, ay, bx, by) {
        var dx = bx - ax, dy = by - ay;
        var l2 = dx * dx + dy * dy;
        var t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        var qx = ax + t * dx, qy = ay + t * dy;
        return Math.hypot(px - qx, py - qy);
    }
    function shapePoints(s) {
        if (s.type === 'pen' || s.type === 'marker') return s.points;
        if (s.type === 'line' || s.type === 'arrow') return [{ x: s.x0, y: s.y0 }, { x: s.x1, y: s.y1 }];
        if (s.type === 'rect') return [
            { x: s.x0, y: s.y0 }, { x: s.x1, y: s.y0 }, { x: s.x1, y: s.y1 }, { x: s.x0, y: s.y1 }, { x: s.x0, y: s.y0 }
        ];
        if (s.type === 'ellipse') {
            var cx = (s.x0 + s.x1) / 2, cy = (s.y0 + s.y1) / 2, rx = Math.abs(s.x1 - s.x0) / 2, ry = Math.abs(s.y1 - s.y0) / 2;
            var out = [];
            for (var a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 16) out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
            return out;
        }
        return null;
    }
    function hit(s, x, y, r) {
        if (s.type === 'text') {
            var fs = s.size;
            var w = (s.text.length * fs * 0.55);
            return x >= s.x - r && x <= s.x + w + r && y >= s.y - r && y <= s.y + fs + r;
        }
        var pts = shapePoints(s);
        if (!pts) return false;
        var thr = r + (s.type === 'marker' ? s.width * 1.6 : s.width) / 2;
        for (var i = 0; i < pts.length - 1; i++) {
            if (distSeg(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= thr) return true;
        }
        if (pts.length === 1) return Math.hypot(x - pts[0].x, y - pts[0].y) <= thr;
        return false;
    }
    function eraseAt(x, y) {
        var r = 10;
        var removed = false;
        for (var i = shapes.length - 1; i >= 0; i--) {
            if (hit(shapes[i], x, y, r)) { shapes.splice(i, 1); removed = true; }
        }
        if (removed) redraw();
    }

    /* ---------- texto ---------- */
    function openTextInput(x, y) {
        commitText();
        var fs = fontPx(width);
        textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'md-textinput';
        textInput.style.left = x + 'px';
        textInput.style.top = y + 'px';
        textInput.style.color = color;
        textInput.style.fontSize = fs + 'px';
        textInput.dataset.x = String(x);
        textInput.dataset.y = String(y);
        textInput.dataset.size = String(fs);
        document.body.appendChild(textInput);
        setTimeout(function () { textInput && textInput.focus(); }, 0);
        textInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); commitText(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancelText(); }
            e.stopPropagation();
        });
        textInput.addEventListener('blur', commitText);
    }
    function commitText() {
        if (!textInput) return;
        var val = textInput.value.trim();
        var x = parseFloat(textInput.dataset.x), y = parseFloat(textInput.dataset.y), size = parseFloat(textInput.dataset.size);
        var col = textInput.style.color;
        var el = textInput; textInput = null;
        el.removeEventListener('blur', commitText);
        el.remove();
        if (val) {
            pushHistory();
            shapes.push({ type: 'text', text: val, x: x, y: y + 2, size: size, color: col });
            redraw();
            emitChange();
        }
    }
    function cancelText() {
        if (!textInput) return;
        var el = textInput; textInput = null;
        el.removeEventListener('blur', commitText);
        el.remove();
    }

    /* ---------- ponteiro ---------- */
    function onDown(e) {
        if (!active) return;
        e.preventDefault();
        var x = e.clientX, y = e.clientY;

        if (tool === 'text') { openTextInput(x, y); return; }
        if (tool === 'eraser') { drawing = true; pushHistory(); eraseAt(x, y); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} return; }

        drawing = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        if (tool === 'pen' || tool === 'marker') {
            current = { type: tool, color: color, width: width, points: [{ x: x, y: y }] };
        } else {
            current = { type: tool, color: color, width: width, x0: x, y0: y, x1: x, y1: y };
        }
        redraw();
    }
    function onMove(e) {
        if (!drawing) return;
        var x = e.clientX, y = e.clientY;
        if (tool === 'eraser') { eraseAt(x, y); return; }
        if (!current) return;
        if (current.type === 'pen' || current.type === 'marker') current.points.push({ x: x, y: y });
        else { current.x1 = x; current.y1 = y; }
        redraw();
    }
    function onUp() {
        if (!drawing) return;
        drawing = false;
        if (tool === 'eraser') { emitChange(); return; }
        if (!current) return;
        var ok = true;
        if (current.type === 'pen' || current.type === 'marker') ok = current.points.length > 1;
        else ok = Math.hypot(current.x1 - current.x0, current.y1 - current.y0) > 3;
        if (ok) { pushHistory(); shapes.push(current); emitChange(); }
        current = null;
        redraw();
    }

    /* ---------- liga/desliga ---------- */
    function toggle(on) {
        if (on === active) return;
        active = on;
        if (on) {
            document.body.classList.add('md-on');
            resize();
        } else {
            commitText();
            drawing = false;
            document.body.classList.remove('md-on');
        }
    }

    /* ---------- init ---------- */
    function isTyping(t) {
        return t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) ||
            (t.tagName === 'INPUT' && !t.classList.contains('md-textinput')));
    }

    function init() {
        // Dentro do palco do mira-remote (deck servido num iframe), quem desenha
        // é a camada da shell; aqui fica só a API, sem UI nem tecla P.
        if (window.__MIRA_REMOTE_STAGE__) return;
        injectStyles();
        buildUI();
        document.addEventListener('keydown', function (e) {
            if (isTyping(e.target)) return;
            if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); toggle(!active); return; }
            if (!active) return;
            if (e.key === 'Escape') { e.preventDefault(); toggle(false); }
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
        });
        try { if (/[?&]draw=1\b/.test(location.search)) toggle(true); } catch (e) {}
    }

    /* API mínima p/ o mira-remote: ler/aplicar traços e ouvir mudanças */
    window.miraDraw = {
        getShapes: function () { return shapes.slice(); },
        setShapes: function (next) {
            shapes = Array.isArray(next) ? next : [];
            if (canvas) resize(); // garante canvas dimensionado mesmo sem nunca ter entrado no modo
        },
        onchange: null
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
