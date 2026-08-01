# Execução observada

Varredura `/reversa-depth-inspection` de 2026-07-31, no repositório fonte `/workspaces/.mira`,
commit `558a406`. Todos os trechos abaixo são saída real de comando, não reconstrução.

## Deck usado na reprodução

Montei `decks/2026-07-31 pente-fino-studio` num diretório temporário, com quatro slides
(capa, camera, split animado, full animado). Os fragmentos foram escritos exatamente como
`agents/mira-fast/references/formato-mira-studio.md` prescreve, sem nenhuma liberdade. O
esqueleto veio do template real, preparado por
`agents/mira-ultrafast/scripts/build-skeleton.mjs`, que é hoje a única forma automática de
obter um esqueleto válido a partir de `templates/decks/mira-studio-demo/index.html`.

Os scripts da reprodução estão no scratchpad da sessão e são reexecutáveis:
`repro.mjs`, `repro2.mjs`, `repro3.mjs`, `repro4.mjs`, `repro5.mjs`, `parse-test.mjs`.


## O slide full gerado, no deck montado

```html
<!-- @MIRA:FAST:SLIDE 04 fluxo-vertical -->
<section data-layout="full"><h2>Fluxo <span class="accent">vertical</span></h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="fluxo-vertical-stage"><svg id="fluxo-vertical-svg" viewBox="0 0 960 1522.5"></svg></div></section>
```

Nenhum `.full-wrap`.

## Onde `full-wrap` aparece no deck gerado

```
$ grep -n "full-wrap" index.html
103:        section[data-layout="full"] .full-wrap {
464:                    sec.innerHTML = '<div class="full-wrap"><h2></h2>' + palco(n) + '</div>';
```

Linha 103: a regra de padding, que não se aplica a nada no slide gerado.
Linha 464: o builder do roteiro, que cria o wrapper quando reconstrói sob HTTP.

Duas ocorrências, nenhuma dentro de um slide. É a prova das duas metades do bug: o padding
existe e não é usado em `file://`, e passa a ser usado sob HTTP.

## A regra de geometria, no template

```css
section[data-layout="full"] .full-wrap {
    flex: 1 1 auto; min-height: 0;
    display: flex; flex-direction: column;
    padding: 4.63% 4.63% 3%;
}
```

O próprio template documenta a origem dos 4,63% na linha 89: "área segura do quadrado:
50/1080 do lado = 4.63% (padrão mira-squared, proporcional)".
