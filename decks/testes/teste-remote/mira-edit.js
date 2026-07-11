/* =====================================================================
   mira-edit.js  ·  Modo edição do deck (fase 1: reordenar slides)
   ---------------------------------------------------------------------
   - Tecla "E" (ou ?edit=1 na URL) liga/desliga o modo edição.
   - Cada slide ganha setas ↑ ↓ para subir/descer na ordem.
   - "Salvar" grava a nova ordem de volta no index.html em disco, via
     File System Access API (Chrome). Fallback: copia a ordem nova.

   Importante: o salvar NÃO serializa o DOM (que o GSAP/D3/Lucide já
   mexeram); ele relê o arquivo-fonte em disco e reordena os BLOCOS de
   texto entre os marcadores <!-- ... SLIDE ... -->, preservando a
   formatação.

   Estruturas de deck reconhecidas (o editor detecta sozinho):
   - Padrão Mira:  slides são <section> filhos diretos de <body>.
   - Legado GSAP:  slides são filhos diretos de <main>.
   Em ambos, cada slide é precedido por um comentário-banner
   <!-- === SLIDE ... === -->  (o número/título é livre; o "===" é opcional).
   ===================================================================== */
(function () {
    'use strict';

    var ACCENT = '#FF904D';
    var root = null;        // container dos slides (<body> ou <main>)
    var childTag = 'section'; // seletor relativo do slide dentro do root
    var kind = 'section';   // 'section' (Mira) | 'main' (legado)
    var editing = false;
    var dirty = false;      // ordem mudou e ainda não foi salva
    var fileHandle = null;  // handle do index.html (cache por sessão)

    /* ---------- ícones (SVG inline, stroke, viewBox 24) ---------- */
    function icon(paths, size) {
        return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
            '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }
    var ICONS = {
        pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
        up: '<path d="M18 15l-6-6-6 6"/>',
        down: '<path d="M6 9l6 6 6-6"/>',
        save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
        x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        move: '<path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/>'
    };

    /* ---------- estilos ---------- */
    function injectStyles() {
        if (document.getElementById('mira-edit-style')) return;
        var css = [
            ':root{--me-accent:' + ACCENT + '}',
            '.me-btn{display:inline-flex;align-items:center;gap:7px;font:600 13px/1 Inter,system-ui,sans-serif;',
            'color:#fff;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);',
            'padding:9px 14px;border-radius:10px;cursor:pointer;transition:all .18s ease}',
            '.me-btn:hover{background:rgba(255,255,255,.12)}',
            '.me-btn.me-primary{color:#101010;background:var(--me-accent);border-color:var(--me-accent)}',
            '.me-btn.me-primary:hover{filter:brightness(1.08)}',
            '.me-btn svg{flex:0 0 auto}',
            /* barra flutuante do modo edição */
            '#me-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);',
            'display:none;align-items:center;gap:10px;z-index:100000;padding:10px 12px;border-radius:16px;',
            'background:rgba(18,18,18,.86);backdrop-filter:blur(14px);border:1px solid rgba(255,144,77,.35);',
            'box-shadow:0 18px 50px rgba(0,0,0,.5);opacity:0;transition:opacity .25s ease,transform .25s ease}',
            'body.me-on #me-bar{display:flex;opacity:1;transform:translateX(-50%) translateY(0)}',
            '#me-bar .me-tag{display:inline-flex;align-items:center;gap:7px;color:var(--me-accent);',
            'font:700 12px/1 Inter,system-ui,sans-serif;letter-spacing:.5px;text-transform:uppercase;padding:0 4px}',
            '#me-bar .me-hint{color:rgba(255,255,255,.45);font:500 12px/1 Inter,system-ui,sans-serif}',
            '#me-bar .me-sep{width:1px;height:22px;background:rgba(255,255,255,.14)}',
            /* slide em modo edição (classe própria: independe de body>section ou main>*) */
            'body.me-on .me-slide{position:relative;outline:1.5px dashed rgba(255,144,77,.45);',
            'outline-offset:-4px;border-radius:6px}',
            /* painel de controle por slide (dentro do slide: sobrevive a overflow:hidden) */
            '.me-ctrl{position:absolute;top:14px;right:14px;z-index:50;display:flex;align-items:center;gap:6px;',
            'padding:6px;border-radius:12px;background:rgba(18,18,18,.92);border:1px solid rgba(255,144,77,.4);',
            'box-shadow:0 8px 24px rgba(0,0,0,.45)}',
            '.me-ctrl .me-num{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;',
            'padding:0 7px;border-radius:8px;background:var(--me-accent);color:#101010;',
            'font:800 12px/1 Inter,system-ui,sans-serif}',
            '.me-ctrl .me-arrow{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;',
            'border-radius:8px;border:none;cursor:pointer;color:#fff;background:rgba(255,255,255,.08);transition:all .15s ease}',
            '.me-ctrl .me-arrow:hover{background:var(--me-accent);color:#101010}',
            '.me-ctrl .me-arrow:disabled{opacity:.25;cursor:not-allowed;background:rgba(255,255,255,.06);color:#fff}',
            /* toast */
            '#me-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%) translateY(10px);',
            'z-index:100001;display:flex;align-items:center;gap:9px;max-width:80vw;padding:12px 16px;border-radius:12px;',
            'background:rgba(18,18,18,.94);color:#fff;border:1px solid rgba(255,255,255,.16);',
            'font:600 13px/1.3 Inter,system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.5);',
            'opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease}',
            '#me-toast.me-show{opacity:1;transform:translateX(-50%) translateY(0)}',
            '#me-toast.me-ok{border-color:rgba(255,144,77,.5)} #me-toast.me-ok svg{color:var(--me-accent)}',
            '#me-toast.me-err{border-color:rgba(255,90,90,.6)} #me-toast.me-err svg{color:#ff5a5a}'
        ].join('');
        var el = document.createElement('style');
        el.id = 'mira-edit-style';
        el.textContent = css;
        document.head.appendChild(el);
    }

    /* ---------- toolbar + toast ---------- */
    function buildBar() {
        if (document.getElementById('me-bar')) return;
        var bar = document.createElement('div');
        bar.id = 'me-bar';
        bar.innerHTML =
            '<span class="me-tag">' + icon(ICONS.pencil, 15) + 'Modo edição</span>' +
            '<span class="me-hint">' + icon(ICONS.move, 14) + ' use as setas para reordenar</span>' +
            '<span class="me-sep"></span>' +
            '<button class="me-btn me-primary" id="me-save">' + icon(ICONS.save) + 'Salvar ordem</button>' +
            '<button class="me-btn" id="me-exit">' + icon(ICONS.x) + 'Sair</button>';
        document.body.appendChild(bar);
        document.getElementById('me-save').addEventListener('click', saveOrder);
        document.getElementById('me-exit').addEventListener('click', function () { toggle(false); });

        var toast = document.createElement('div');
        toast.id = 'me-toast';
        document.body.appendChild(toast);
    }

    var toastTimer = null;
    function toast(msg, kind) {
        var t = document.getElementById('me-toast');
        if (!t) return;
        var ic = kind === 'err' ? ICONS.x : ICONS.check;
        t.className = kind === 'err' ? 'me-err' : 'me-ok';
        t.innerHTML = icon(ic, 18) + '<span>' + msg + '</span>';
        // reflow + show
        void t.offsetWidth;
        t.classList.add('me-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('me-show'); }, 3200);
    }

    /* ---------- detecção da estrutura de slides ---------- */
    function detectDeck() {
        // padrão Mira: slides são <section> filhos diretos de <body>
        var bodySections = document.querySelectorAll('body > section');
        if (bodySections.length >= 2) {
            return { root: document.body, childTag: 'section', kind: 'section' };
        }
        // legado: slides são filhos diretos de <main>
        var main = document.querySelector('main');
        if (main) {
            var kids = 0;
            for (var i = 0; i < main.children.length; i++) if (main.children[i].nodeType === 1) kids++;
            if (kids >= 2) return { root: main, childTag: '*', kind: 'main' };
        }
        return null;
    }

    /* ---------- slides ---------- */
    function slides() {
        if (!root) return [];
        return Array.prototype.slice.call(root.querySelectorAll(':scope > ' + childTag));
    }

    function tagSlides() {
        slides().forEach(function (el, i) {
            el.dataset.miraIdx = String(i);
            el.classList.add('me-slide');
        });
    }

    function untagSlides() {
        slides().forEach(function (el) { el.classList.remove('me-slide'); });
    }

    function addControls() {
        slides().forEach(function (el) {
            if (el.querySelector(':scope > .me-ctrl')) return;
            var c = document.createElement('div');
            c.className = 'me-ctrl';
            c.contentEditable = 'false';
            c.innerHTML =
                '<span class="me-num"></span>' +
                '<button class="me-arrow me-arr-up" title="Subir" aria-label="Subir slide">' + icon(ICONS.up, 16) + '</button>' +
                '<button class="me-arrow me-arr-down" title="Descer" aria-label="Descer slide">' + icon(ICONS.down, 16) + '</button>';
            c.querySelector('.me-arr-up').addEventListener('click', function (e) { e.stopPropagation(); moveUp(el); });
            c.querySelector('.me-arr-down').addEventListener('click', function (e) { e.stopPropagation(); moveDown(el); });
            el.appendChild(c);
        });
        refreshControls();
    }

    function removeControls() {
        var all = document.querySelectorAll('.me-ctrl');
        Array.prototype.forEach.call(all, function (c) { c.remove(); });
    }

    function refreshControls() {
        var list = slides();
        list.forEach(function (el, i) {
            var num = el.querySelector(':scope > .me-ctrl .me-num');
            var up = el.querySelector(':scope > .me-ctrl .me-arr-up');
            var dn = el.querySelector(':scope > .me-ctrl .me-arr-down');
            if (num) num.textContent = String(i + 1);
            if (up) up.disabled = (i === 0);
            if (dn) dn.disabled = (i === list.length - 1);
        });
    }

    function afterMove(el) {
        dirty = true;
        refreshControls();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // move por índice na LISTA de slides (robusto a nós não-slide entre eles:
    // comentários-marcador, barra de progresso, botão "próximo", scripts, etc.)
    function moveUp(el) {
        var list = slides();
        var i = list.indexOf(el);
        if (i > 0) { el.parentNode.insertBefore(el, list[i - 1]); afterMove(el); }
    }
    function moveDown(el) {
        var list = slides();
        var i = list.indexOf(el);
        if (i > -1 && i < list.length - 1) { el.parentNode.insertBefore(list[i + 1], el); afterMove(el); }
    }

    /* ---------- salvar: reordena o texto-fonte em disco ---------- */
    // permutação atual: para cada posição, qual índice ORIGINAL de slide está ali
    function currentPerm() {
        return slides().map(function (el) { return parseInt(el.dataset.miraIdx, 10); });
    }

    // marcador-banner: <!-- === SLIDE ... === -->  (o "===" é opcional; casa
    // "SLIDE:", "SLIDE 1:", "SLIDE EXEMPLO 2:" etc. — SLIDE logo após o banner)
    var MARKER = /<!--\s*=*\s*SLIDE\b[\s\S]*?-->/gi;

    function reorderSource(src, perm) {
        MARKER.lastIndex = 0;
        var marks = [];
        var m;
        while ((m = MARKER.exec(src)) !== null) marks.push(m.index);
        if (marks.length < 2) return { err: 'Não achei os marcadores <!-- ... SLIDE ... --> no arquivo.' };

        var start = marks[0];
        // fim da região reordenável depende de onde o último slide fecha:
        // - legado (main): a região vai até <\/main> (que NÃO é slide, fica fora).
        // - Mira (section): a região inclui o <\/section> do último slide.
        var endRegion;
        if (kind === 'main') {
            var closeMain = src.indexOf('</main>', marks[marks.length - 1]);
            endRegion = closeMain === -1 ? src.length : closeMain;
        } else {
            var lastClose = src.lastIndexOf('</section>');
            endRegion = lastClose === -1 ? src.length : lastClose + '</section>'.length;
        }

        // fatia cada bloco (comentário + conteúdo até o próximo marcador)
        var blocks = [];
        for (var i = 0; i < marks.length; i++) {
            var s = marks[i];
            var e = (i + 1 < marks.length) ? marks[i + 1] : endRegion;
            blocks.push(src.slice(s, e));
        }
        if (blocks.length !== perm.length) {
            return { err: 'Nº de blocos no arquivo (' + blocks.length + ') ≠ nº de slides na tela (' + perm.length + ').' };
        }
        var reordered = perm.map(function (k) { return blocks[k]; }).join('');
        var out = src.slice(0, start) + reordered + src.slice(endRegion);
        return { out: out };
    }

    /* handle do arquivo persistido em IndexedDB: aponta uma vez, salva sempre por cima */
    function idbReq(mode, fn) {
        return new Promise(function (res, rej) {
            var open = indexedDB.open('mira-edit', 1);
            open.onupgradeneeded = function () { open.result.createObjectStore('kv'); };
            open.onerror = function () { rej(open.error); };
            open.onsuccess = function () {
                var db = open.result;
                var tx = db.transaction('kv', mode);
                var store = tx.objectStore('kv');
                var out;
                Promise.resolve(fn(store)).then(function (v) { out = v; });
                tx.oncomplete = function () { db.close(); res(out); };
                tx.onerror = function () { db.close(); rej(tx.error); };
            };
        });
    }
    function idbGet(key) {
        return idbReq('readonly', function (s) {
            return new Promise(function (r) { var q = s.get(key); q.onsuccess = function () { r(q.result || null); }; });
        });
    }
    function idbSet(key, val) {
        return idbReq('readwrite', function (s) { s.put(val, key); });
    }

    async function verifyPermission(handle) {
        var opts = { mode: 'readwrite' };
        if (handle.queryPermission && (await handle.queryPermission(opts)) === 'granted') return true;
        if (handle.requestPermission && (await handle.requestPermission(opts)) === 'granted') return true;
        return false;
    }

    async function getHandle() {
        if (fileHandle) return fileHandle;
        // 1) tenta reusar o arquivo já apontado numa sessão anterior
        try {
            var saved = await idbGet('indexHandle');
            if (saved && await verifyPermission(saved)) { fileHandle = saved; return fileHandle; }
        } catch (e) { /* sem handle salvo: cai pro seletor */ }
        // 2) primeira vez: usuário aponta o index.html (o Chrome exige o gesto)
        var picked = await window.showOpenFilePicker({
            id: 'mira-deck-index',        // Chrome lembra a última pasta usada
            multiple: false,
            types: [{ description: 'HTML', accept: { 'text/html': ['.html', '.htm', '.shtml'] } }]
        });
        fileHandle = picked[0];
        try { await idbSet('indexHandle', fileHandle); } catch (e) { /* segue sem persistir */ }
        return fileHandle;
    }

    // salvar silencioso quando servido por mira-serve.js (http): sem diálogo nenhum
    async function saveViaServer(perm) {
        try {
            var resp = await fetch(location.pathname, { cache: 'no-store' });
            if (!resp.ok) throw new Error('GET ' + resp.status);
            var src = await resp.text();
            var res = reorderSource(src, perm);
            if (res.err) { toast(res.err, 'err'); return; }
            var save = await fetch('/__mira_save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: location.pathname, content: res.out })
            });
            if (!save.ok) { toast('Servidor recusou (' + save.status + ').', 'err'); return; }
            tagSlides();
            refreshControls();
            dirty = false;
            toast('Salvo', 'ok');
        } catch (e) {
            toast('Sem servidor de save. Rode: node mira-serve.js na raiz do projeto.', 'err');
        }
    }

    async function saveOrder() {
        var perm = currentPerm();
        var unchanged = perm.every(function (v, i) { return v === i; });
        if (unchanged) { toast('Nada mudou na ordem.', 'ok'); return; }

        // servido por http (mira-serve.js) → salva direto, sem seletor de arquivo
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            return saveViaServer(perm);
        }

        if (!('showOpenFilePicker' in window)) {
            var order = slides().map(function (el, i) {
                var h = el.querySelector('h1,h2,h3');
                return (i + 1) + '. ' + (h ? h.textContent.trim() : ('slide ' + (parseInt(el.dataset.miraIdx, 10) + 1)));
            }).join('\n');
            try { await navigator.clipboard.writeText(order); } catch (e) {}
            toast('Navegador sem gravação direta. Ordem copiada, me passe que eu aplico.', 'err');
            return;
        }

        try {
            var handle = await getHandle();
            if (!(await verifyPermission(handle))) { toast('Permissão de escrita negada.', 'err'); return; }
            var file = await handle.getFile();
            var src = await file.text();
            var res = reorderSource(src, perm);
            if (res.err) {
                // provável arquivo errado: esquece o handle pra pedir de novo
                fileHandle = null;
                try { await idbSet('indexHandle', null); } catch (e) {}
                toast(res.err + ' (aponte o index.html deste deck)', 'err');
                return;
            }

            var w = await handle.createWritable();
            await w.write(res.out);
            await w.close();

            // ordem em disco agora bate com a tela: re-tag como novo "original"
            tagSlides();
            refreshControls();
            dirty = false;
            toast('Ordem salva por cima do index.html', 'ok');
        } catch (e) {
            if (e && e.name === 'AbortError') return; // usuário cancelou o seletor
            console.error('[mira-edit] falha ao salvar:', e);
            toast('Falha ao salvar: ' + (e && e.message ? e.message : e), 'err');
        }
    }

    /* ---------- liga/desliga ---------- */
    function toggle(on) {
        if (on === editing) return;
        if (on) {
            var d = detectDeck();
            if (!d) {
                toast('Modo edição precisa de 2+ slides (<section> no <body> ou filhos de <main>).', 'err');
                return;
            }
            root = d.root; childTag = d.childTag; kind = d.kind;
            editing = true;
            document.body.classList.add('me-on');
            tagSlides();
            addControls();
            toast('Modo edição ligado. ↑↓ reordena, depois é só salvar.', 'ok');
        } else {
            if (dirty && !confirm('Você reordenou slides e ainda não salvou. Sair mesmo assim?')) return;
            editing = false;
            document.body.classList.remove('me-on');
            removeControls();
            untagSlides();
            dirty = false;
        }
    }

    /* ---------- init ---------- */
    function isTyping(t) {
        return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    }

    function init() {
        injectStyles();
        buildBar();
        document.addEventListener('keydown', function (e) {
            if (isTyping(e.target)) return;
            if (e.key === 'e' || e.key === 'E') { e.preventDefault(); toggle(!editing); }
            if (e.key === 'Escape' && editing) { toggle(false); }
        });
        window.addEventListener('beforeunload', function (e) {
            if (dirty) { e.preventDefault(); e.returnValue = ''; }
        });
        try {
            if (/[?&]edit=1\b/.test(location.search)) toggle(true);
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
