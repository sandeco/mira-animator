# Trecho exato, templates/authoring/mira-edit-free.js

## O CSS que cria a zona morta (injectStyles)

```css
#mef-overlay { position:fixed; z-index:99990; pointer-events:none; ... }
#mef-overlay .mef-body { position:absolute; inset:0; pointer-events:auto; cursor:move }
```

`.mef-body` cobre a caixa inteira do elemento selecionado e captura ponteiro. Não sobra pixel
do elemento (nem dos filhos dele) para receber clique.

## O early return que impede a troca de seleção (onDocDown, capture em document)

```js
function onDocDown(e) {
    if (!enabled) return;
    // Auto-cura de estados presos ... (do fix anterior, edit-stuck-fix)
    if (drag && !(overlay && overlay.contains(e.target))) onDragCancel();
    if (textCtx && textCtx.el !== e.target && !textCtx.el.contains(e.target)) commitActiveTextEdit();
    else if (!textCtx) document.body.classList.remove('mef-text-editing');
    altDown = !!e.altKey;
    if (isChrome(e.target)) return;                 // <<< AQUI: sai antes de qualquer select()
    var el = e.target.closest ? e.target.closest(EDITABLE) : null;
    if (el && !isChrome(el) && !(el.classList && el.classList.contains('me-slide'))) {
        if (!el.dataset.meId) el.dataset.meId = 'me-x-' + Math.round(el.getBoundingClientRect().top);
        select(el);
    } else {
        select(null);
    }
    syncCropMode();
}
```

`CHROME` inclui `#mef-overlay`, então todo clique sobre a moldura cai no `return`.

## O que roda em seguida (onOverlayDown, listener no próprio overlay)

```js
function onOverlayDown(e) {
    if (!sel) return;
    e.preventDefault(); e.stopPropagation();
    if (e.detail > 1) return;
    if (drag) onDragCancel();
    var role = e.target.getAttribute('data-role');
    ...
    drag = { mode: cropGesture ? 'crop' : (role || 'move'), ... };   // arrasta o elemento ANTIGO
}
```

Só sabe arrastar. Não tem nenhum caminho para reselecionar o que está embaixo.

## Medição

`document.elementFromPoint(centro do <span class="accent">)` com o `<h1>` pai selecionado:

```
DIV.mef-body
```

10 tentativas, 10 vezes o mesmo resultado.
