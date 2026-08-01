# Reprodução em navegador real · BUG-20260731-S3TX

> Cápsula executável: `test/mira-studio-builders.test.mjs`, casos com prefixo
> `BUG-20260731-S3TX`. Rode com `node --test test/mira-studio-builders.test.mjs`.

## Ambiente

| campo | valor |
|---|---|
| commit base | `456b38b` |
| branch | `agent/documentacao-completa-mira` |
| SO | Linux 5.15.167.4-microsoft-standard-WSL2 |
| runtime | Node v24.15.0 |
| navegador | Chromium do puppeteer 25.x, `--no-sandbox --disable-dev-shm-usage` |
| data | 2026-08-01 |

## Por que em navegador

O defeito é de runtime: só existe depois que o IIFE do template roda sobre o DOM. Reproduzir
sem navegador seria reimplementar o navegador. O deck usado não é fixture de papel: o
esqueleto sai do template real por `build-skeleton.mjs`, os fragmentos passam por
`validate-run`, e a montagem é o `assembleRun` de produção.

## Deck usado

Plano `mira-studio-full` com 3 slides:

| n | layout | slug_stage | palco emitido |
|---|---|---|---|
| 1 | `camera` | `abertura` | nenhum |
| 2 | `thirds` | `corrida` | `corrida-stage` / `corrida-svg` |
| 3 | `full` | `panela` | `panela-stage` / `panela-svg` |

Cada animação gerada marca `window.__tocou[slug] = true` quando encontra o palco e o `<svg>`.
É o sinal medido: animação que não acha palco não marca nada, e é exatamente o modo de falha
silenciosa que o bug descreve.

## Antes da correção

### `file://`

```
total de <section> no DOM: 5      (esperado: 3)
títulos: "", "Linha de Produção", "Órbita da Produção", "Produção ao Vivo", ""
palcos:  sv-slide-2, sv-slide-3, sv-slide-4
window.__tocou: {}
```

Os três slides gerados sumiram. O que está na tela são os cinco slides do array `DEFAULT`
embutido no template, com as duas animações de demonstração (`animLinha` / `animOrbita`).

### `http://`

```
total de <section> no DOM: 3      (a estrutura veio do roteiro.md)
palcos:  sv-slide-2, sv-slide-3
document.getElementById('corrida-stage') -> null
document.getElementById('panela-stage')  -> null
window.__tocou: {}
```

A estrutura sobrevive porque o `roteiro.md` gerado tem três blocos. O conteúdo animado não:
os palcos foram recriados com id genérico e nenhuma animação da Fase 2 tocou.

## Depois da correção

```
file://   3 <section>, palcos corrida-stage/corrida-svg e panela-stage/panela-svg
http://   3 <section>, mesmos palcos, títulos vindos do roteiro.md
window.__tocou: { corrida: true, panela: true }
```

## Caso de controle: o deck de demonstração

O mesmo builder, sobre o deck de demonstração do próprio template (cinco seções, `<svg>` sem
id, `roteiro.md` com animação declarativa), nos dois protocolos:

```
antes   5 <section>, palcos sv-slide-2/3/4, títulos do roteiro
depois  5 <section>, palcos sv-slide-2/3/4, títulos do roteiro
```

Idêntico. É o que separa "preservar o deck gerado" de "quebrar o deck escrito à mão": a
variável isolada é a presença de `id` no `<svg>`, não o protocolo nem a existência do
`roteiro.md`.
