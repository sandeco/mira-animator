# Experimento causal · BUG-20260801-6UHJ

Objetivo: sair de "correlação plausível" para caminho causal fechado, removendo **só** o elo
suspeito e medindo o efeito. Nada de código-fonte foi alterado: o elo foi neutralizado em tempo de
execução, por uma regra CSS injetada na página.

## O elo isolado

```js
// injetado na página já em modo E, nada mais
const s = document.createElement('style');
s.textContent = '#mef-overlay .mef-body{pointer-events:none!important}';
document.head.appendChild(s);
```

## Protocolo

Em cada condição: pressionar `E` → clicar no `<h1>` da capa → clicar no
`<span class="accent">` que está **dentro** desse `<h1>`. Medido: quem recebeu o `pointerdown`,
qual editável o `closest()` resolveu, e para qual elemento o overlay foi.

## Resultado

| condição | `pointerdown.target` | `closest(EDITABLE)` | seleção foi para |
|---|---|---|---|
| código como está | `DIV.mef-body` | nenhum (`onDocDown` sai em `isChrome`) | continua no `<h1>` |
| `.mef-body` sem `pointer-events` | `SPAN.accent` | `SPAN.accent` | **`SPAN.accent`** |

## Leitura

O elo é suficiente e necessário para o defeito:

- **necessário**: com a superfície de captura ativa, o `pointerdown` nunca chega ao conteúdo;
  `onDocDown` classifica o alvo como chrome e retorna antes de qualquer `select()`
- **suficiente**: neutralizado só ele, sem tocar em mais nada, RF-04 volta a valer: clicar no
  segundo elemento troca a seleção

Portanto `root_cause.state: confirmed`.

## O que este experimento NÃO autoriza

Remover `pointer-events` do `.mef-body` **não** é a correção. Essa superfície é o que permite
arrastar o elemento selecionado pelo corpo da moldura, que é o gesto principal do editor. Removê-la
trocaria um defeito por outro pior.

A correção precisa distinguir os dois gestos que hoje entram pela mesma porta: *arrastar* (o
ponteiro anda) e *clicar* (o ponteiro não anda). Ver `fix/plan.html`.

## Reprodutibilidade

Script equivalente ao usado: `evidence/repro-overlay.mjs` para a condição "como está". A condição
neutralizada é o mesmo script com o `<style>` acima injetado logo após ligar o modo E.
