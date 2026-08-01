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


## A capa gerada, no deck montado

```html
<!-- @MIRA:FAST:SLIDE 01 abertura -->
<section><h1>Corte de <span class="accent">80 por cento</span></h1><p>Subtitulo curto.</p></section>
```

```
$ grep -c 'section class="capa"' index.html
0
```

## Executando o parse() e a árvore de decisão de montarSecao() do próprio deck

Copiei `parse()` e `palco()` verbatim do `index.html` gerado e rodei sobre o `roteiro.md`
gerado, reproduzindo a decisão de `montarSecao`:

```
slides parseados: 4
capaBase (body > section.capa) existe no deck? false
slide 1 layout=capa    -> ramo=camera (queda de layout desconhecido)  (sem palco)
slide 2 layout=camera  -> ramo=camera (queda de layout desconhecido)  (sem palco)
slide 3 layout=split   -> ramo=split   <div class="anim-stage"><svg id="sv-slide-3" ...></svg></div>
slide 4 layout=full    -> ramo=full    <div class="anim-stage"><svg id="sv-slide-4" ...></svg></div>
```

O slide 1 tem `layout=capa` no `roteiro.md` e mesmo assim cai no ramo `camera`, porque a
condição `s.layout === 'capa' && capaBase` da linha 441 é falsa.

## O roteiro.md gerado, para conferência

```
## Slide 1 | capa | Corte de *80 por cento*

Fala da capa.
```

O arquivo está correto. O que falha é o casamento com o DOM.
