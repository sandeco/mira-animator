# Reprodução em navegador real · BUG-20260731-JZNJ

> Cápsula executável: `test/mira-studio-builders.test.mjs`, casos com prefixo
> `BUG-20260731-JZNJ`. Rode com `node --test test/mira-studio-builders.test.mjs`.

## Ambiente

| campo | valor |
|---|---|
| commit base | `456b38b` |
| branch | `agent/documentacao-completa-mira` |
| SO | Linux 5.15.167.4-microsoft-standard-WSL2 |
| runtime | Node v24.15.0 |
| navegador | Chromium do puppeteer 25.x, `--no-sandbox --disable-dev-shm-usage` |
| servidor | servidor estático mínimo do próprio teste, com o `/__mira_save` que o builder usa |
| data | 2026-08-01 |

## Pré-requisito resolvido

As Agent Notes registravam que gerar um deck `mira-studio` do zero esbarra antes no
BUG-20260731-OI56 (esqueleto sem marcadores `@MIRA:`). Aquela correção já está aplicada, e o
esqueleto sai do template real por `build-skeleton.mjs`. Por isso a relação `related-to` com
o OI56 subiu de `proposed` para `supported`: sem ela, este bug não é reproduzível do zero.

## Deck usado

Plano `mira-studio` com 3 slides, montado pelo `assembleRun` de produção:

| n | layout | slug_stage | palco emitido |
|---|---|---|---|
| 1 | `capa` | `capa` | nenhum |
| 2 | `split` | `corrida` | `corrida-stage` / `corrida-svg` |
| 3 | `full` | `panela` | `panela-stage` / `panela-svg` |

Cada animação gerada marca `window.__tocou[slug] = true` quando encontra o palco. É o sinal
medido, e é o modo de falha silenciosa que o bug descreve: sem palco, nada marca e nada
reclama.

## Antes da correção

### `file://` (caminho que não dispara a reconstrução)

```
palcos: corrida-stage/corrida-svg, panela-stage/panela-svg
window.__tocou: { corrida: true, panela: true }
```

Funciona. É por isso que o defeito passava despercebido em conferência rápida.

### `http://` (o fluxo recomendado para gravar com câmera)

```
total de <section>: 3
palcos: sv-slide-2, sv-slide-3
document.getElementById('corrida-stage') -> null
document.getElementById('panela-stage')  -> null
window.__tocou: {}
```

Sem exceção no console, sem aviso, deck aparentemente pronto. Nenhuma animação de conteúdo
toca.

## Depois da correção

```
http://   3 <section>, palcos corrida-stage/corrida-svg e panela-stage/panela-svg
          window.__tocou: { corrida: true, panela: true }
          título do slide 2 vindo do roteiro.md, aplicado sobre o <h2> preservado
```

## Caso de controle: o deck escrito à mão

O mesmo builder sobre o deck de demonstração do template (capa com `class="capa"`, palcos
autorais `sv-slide-3` e `sv-slide-4` já no HTML, `roteiro.md` com quatro blocos), sob HTTP:

```
antes   4 <section>, palcos sv-slide-3 e sv-slide-4, capa preservada
depois  4 <section>, palcos sv-slide-3 e sv-slide-4, capa preservada
```

Idêntico. É o critério de aceite 4: o uso que o template documenta hoje não podia ser
sacrificado pela correção.

## Nota de método

O harness do teste rola com `scrollIntoView({ behavior: 'instant' })`. O template declara
`scroll-behavior: smooth`, e a primeira versão do teste media o DOM no meio da rolagem, o que
produzia um falso vermelho no último slide. O ajuste é do teste, não do produto: a animação
sempre dependeu do `IntersectionObserver` com `threshold: 0.4`, que é comportamento
especificado em `05#R3`.
