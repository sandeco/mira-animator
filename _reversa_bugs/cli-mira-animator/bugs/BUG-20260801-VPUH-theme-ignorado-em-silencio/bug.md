---
schema_version: 1
id: BUG-20260801-VPUH
display_number: 12
title: npx mira-animator new ignora --theme em silêncio quando o template não traz o marcador @MIRA:THEME
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-08-01
updated: 2026-08-01

origin:
  type: inspection
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1, observado em execução do CLI"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-OI56
    type: related-to
    state: supported
    evidence:
      - ref: "evidence/execucao-cli.md"
        observation: >-
          o marcador @MIRA:THEME ausente é o único dos três sintomas do OI56 que é mesmo
          defeito de template, e é a causa deste bug. Pôr o marcador nos três templates
          corrige os dois; a falha silenciosa do CLI sobrevive à correção dos templates.

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck"
  affected_code:
    - "lib/commands/new.js:107-113"
    - "lib/utils/responsive.js:33-55"
    - "templates/decks/mira-studio-demo/index.html"
    - "templates/decks/mira-studio-full-demo/index-16x9.html"
    - "templates/decks/mesa-tatica/index.html"
  root_cause:
    state: confirmed
    hypothesis: >-
      O CLI aplica o tema por String.replace sobre o bloco @MIRA:THEME. Sem correspondência,
      replace devolve a string intacta, sem erro. Três dos oito templates não trazem o par de
      marcadores, então o tema não entra e a mensagem final declara sucesso mesmo assim.
    causal_path:
      - "o template não traz o par /* @MIRA:THEME:START */ ... END"
      - "new.js:110 chama html.replace com uma regex que não casa"
      - "replace devolve html inalterado, sem erro e sem aviso"
      - "a execução segue para a mensagem final, que imprime o tema pedido"
    evidence:
      - ref: "evidence/execucao-cli.md"
        observation: >-
          o CLI imprimiu "Tema: mira-dark" e o deck gerado tem zero ocorrências de mira-dark
          e zero blocos @MIRA:THEME.
    code_refs:
      - file: "lib/commands/new.js"
        symbol: "newDeck"
        commit: "558a406"
  reproduction_tests:
    - "test/mira-fast-esqueleto-real.test.mjs::template de mira-studio traz o marcador @MIRA:THEME"
    - "test/mira-fast-esqueleto-real.test.mjs::template de mira-studio-full traz o marcador @MIRA:THEME"
  regression_tests:
    - "test/mira-fast-esqueleto-real.test.mjs::mira-default continua temável, com o marcador e fora do conjunto agnóstico"
    - "test/mira-fast-esqueleto-real.test.mjs::o bloco @MIRA:RESPONSIVE é do CLI, não do template"

spec_verdict: spec-gap

change_risk:
  classification: baixa
  reasons:
    - "nenhuma linha de CSS efetivo mudou nos templates: só comentários delimitadores"
    - "o conjunto THEME_AGNOSTIC preserva exatamente o comportamento de hoje"
    - "não verificado em navegador: não há um neste ambiente"

addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260801-VPUH-v001.md"

change_set:
  - id: CHG-001
    kind: test
    artifact: test/mira-fast-esqueleto-real.test.mjs
    purpose: trava o marcador nos templates do pipeline e o mira-default fora do conjunto agnóstico
    diff: fix/CHG-001.diff
  - id: CHG-003a
    kind: code
    artifact: templates/decks/mira-studio-demo/index.html
    purpose: envolve o tema próprio em @MIRA:THEME, com --fmt-* fora do bloco
    diff: fix/CHG-003a.diff
  - id: CHG-003b
    kind: code
    artifact: templates/decks/mira-studio-full-demo/index-16x9.html
    purpose: idem, com a ponte --accent para fora do bloco
    diff: fix/CHG-003b.diff
  - id: CHG-003c
    kind: code
    artifact: templates/decks/mesa-tatica/index.html
    purpose: idem
    diff: fix/CHG-003c.diff
  - id: CHG-004
    kind: code
    artifact: lib/commands/new.js
    purpose: THEME_AGNOSTIC exportado, aviso quando o replace não casa, renome de animationOnly
    diff: fix/CHG-004.diff
  - id: CHG-005
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260801-VPUH-v001.md
    purpose: adendo aditivo com R7b, R7c e R7d
    diff: null

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: 558a406
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# npx mira-animator new ignora --theme em silêncio quando o template não traz o marcador @MIRA:THEME

## Summary

O CLI aplica o tema substituindo o bloco `@MIRA:THEME` do template. `String.replace` sem
correspondência devolve a string intacta, sem erro. Nos três templates que não trazem o
marcador, o tema pedido não entra no deck e o CLI **imprime que aplicou**.

Não quebra o deck: os três templates afetados têm `:root` próprio, então abrem e renderizam.
O que se perde é a escolha do usuário, sem nenhum aviso.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck`
estabelece `npx mira-animator new <slug> --deck=<template> --theme=<tema>` como o caminho
canônico de criação de deck, e trata `--theme` como parâmetro efetivo, com default
`mira-dark` para o formato `mira`.

Pedir um tema deve aplicá-lo, ou dizer por que não aplicou. As duas saídas são aceitáveis; a
terceira, aplicar nada e relatar sucesso, não é.

O próprio arquivo tem o padrão certo dez linhas abaixo: `ensureResponsive()`
(`lib/utils/responsive.js:33-55`) **insere** o bloco quando ele não existe e devolve
`{ changed, action }` dizendo o que fez.

## Actual Behavior

`lib/commands/new.js`, linhas 107 a 113:

```js
const themeCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', `${theme}.css`), 'utf8');
const baseCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', 'base.css'), 'utf8');
html = html.replace(
  /\/\* @MIRA:THEME:START \*\/[\s\S]*?\/\* @MIRA:THEME:END \*\//,
  '/* @MIRA:THEME:START */\n' + themeCss + '\n\n' + baseCss + '\n/* @MIRA:THEME:END */'
);
```

Sem par de marcadores no template, a regex não casa, `html` não muda, e a execução segue
para a mensagem de sucesso, que declara o tema escolhido.

Templates sem o marcador, 3 de 8:

```
templates/decks/mesa-tatica/index.html
templates/decks/mira-studio-demo/index.html
templates/decks/mira-studio-full-demo/index-16x9.html
```

Nos outros cinco o `--theme` funciona, o que torna o defeito ainda mais difícil de perceber:
o mesmo comando se comporta de dois jeitos conforme o template.

## Steps to Reproduce

1. Numa pasta com o Mira instalado:

   ```bash
   npx mira-animator new teste-studio --deck=mira-studio-demo --theme=mira-dark
   ```

2. O CLI imprime `Template: mira-studio-demo | Tema: mira-dark`.
3. `grep -c "@MIRA:THEME:START" decks/teste-studio/index.html` devolve `0`.
4. Nenhuma linha de `templates/themes/mira-dark.css` está no deck.
5. Repetir com `--deck=mira-default`: aí sim o bloco aparece e o tema entra.

## Evidence

- `evidence/execucao-cli.md` — saída do comando, contagem de marcadores no deck gerado e o
  levantamento dos oito templates.
- `../../intake/relato-20260801-0010.md` — anotação da investigação que encontrou isto.

## Suspected Area

`lib/commands/new.js:107-113`. A correção mais provável tem duas metades e o fix precisa
decidir se aplica as duas:

1. **O CLI para de falhar em silêncio**: quando o `replace` não casa, ou insere o bloco (como
   `ensureResponsive` faz), ou avisa que o template não aceita tema e não promete o contrário
   na mensagem final.
2. **Os três templates ganham o marcador**, para o `--theme` passar a valer neles.

A primeira sozinha corrige o comportamento mentiroso; a segunda sozinha corrige os três
templates de hoje e deixa o buraco aberto para o próximo. Fazer só a segunda é o remendo.

Vale conferir se `mesa-tatica` e os Studio **devem** aceitar tema. O `sandeco-just-animation-template`
é explicitamente theme-agnóstico e o CLI o trata como exceção declarada
(`const animationOnly = deck === 'sandeco-just-animation-template'`). Se os Studio também
forem theme-agnósticos por decisão, a correção certa é declará-los na exceção, não pôr o
marcador. Isso é veredito de spec, não escolha de implementação.

## Acceptance Criteria

1. `npx mira-animator new --deck=<qualquer> --theme=<qualquer>` ou aplica o tema, ou informa
   claramente que aquele template não aceita tema.
2. A mensagem final nunca declara um tema que não foi aplicado.
3. Template novo sem o marcador não volta a cair em silêncio: o comportamento é detectado, não
   assumido.
4. A decisão sobre os Studio e o `mesa-tatica` aceitarem tema fica registrada como veredito de
   spec.
5. Teste de regressão cobre os dois lados: template com marcador aplica o tema, template sem
   marcador não relata sucesso silencioso.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` |
| Código afetado | `lib/commands/new.js` (107-113) |
| Padrão correto no mesmo fluxo | `lib/utils/responsive.js` (33-55), `ensureResponsive` |
| Templates sem o marcador | `mesa-tatica`, `mira-studio-demo`, `mira-studio-full-demo` |
| Causa raiz | não investigada a fundo; é do `/reversa-debugger-fix` |
| Testes | nenhum |

## Resolution

Corrigido em 2026-08-01, junto com o BUG-20260731-OI56. **Não fechado**: closure policy
`package`. Estado `active` / `delivering`.

### Causa raiz (confirmed)

`String.replace` sem correspondência devolve a string intacta, sem erro. Três dos oito
templates não trazem o par de marcadores, então o tema não entrava e a mensagem final
declarava sucesso.

### O que mudou

Duas metades, e as duas eram necessárias:

1. **Os três templates ganharam o par de marcadores**, envolvendo o tema que eles já tinham.
   Nenhuma linha de CSS efetivo mudou.
2. **O CLI parou de falhar em silêncio.** `animationOnly`, que testava um único deck por
   igualdade, virou o conjunto exportado `THEME_AGNOSTIC`. E quando o `replace` não casa num
   template que *deveria* aceitar tema, o CLI agora avisa em vez de prometer.

A segunda metade é a que fecha a causa: sem ela, o próximo template nasceria no mesmo buraco.

### Decisão de produto registrada

Os Studio e a mesa tática entraram em `THEME_AGNOSTIC` em vez de virarem temáveis. O motivo é
concreto: o CLI injeta `tema + base.css` no bloco, e o `base.css` traz
`.anim-stage { height: clamp(400px,60vh,620px) }` e `body { background: var(--mira-bg) }`,
que brigam com o layout desses formatos (palco em flex e barras cinzas `#333333`). O
`mira-default` sobrevive porque neutraliza isso no próprio CSS.

Escolher o agnosticismo manteve o comportamento de hoje com **risco visual zero** — o que
importa porque não há navegador neste ambiente para verificar o contrário.

### Veredito de spec: `spec-gap` (aprovado em 2026-08-01)

Nenhuma seção dizia quais templates aceitam tema, nem o que o CLI faz quando o marcador falta.
O `sandeco-just-animation-template` era exceção codificada sem spec que a respaldasse. Adendo
aditivo gerado, spec original intocada:

`_reversa_sdd/addenda/bug-BUG-20260801-VPUH-v001.md`

Acrescenta R7b (templates theme-agnósticos e por quê), R7c (o bloco existe mesmo em template
agnóstico, e as variáveis de formato ficam fora dele) e **R7d (o CLI nunca declara um tema que
não aplicou)**.

### Prova

```
$ node bin/mira.js new v2-studio --deck=mira-studio-demo --theme=mira-dark
  Template: mira-studio-demo | Tema: próprio do template (theme-agnóstico)

$ node bin/mira.js new v2-mira --deck=mira-default --theme=mira-dark
  Template: mira-default | Tema: mira-dark
```

O primeiro dizia `Tema: mira-dark` e não aplicava nada. O segundo prova que o deck padrão
continua temável.

Testes: 2 vermelhos → verdes. Suíte completa **119 tests, 119 pass, 0 fail**.

### O que falta para fechar

Commit, merge e versão publicada. Sem `DONE.md` até lá.

## Agent Notes

- **Encontrado por inspeção, não por relato.** Apareceu no diagnóstico do BUG-20260731-OI56,
  ao verificar quem cria os marcadores `@MIRA:*`. Nenhum usuário reclamou disto ainda, o que
  é coerente com a natureza do defeito: ele não quebra nada visível.
- **Este é o único sintoma real de template do OI56.** A mesma investigação desmentiu os
  outros dois: `@MIRA:RESPONSIVE` é injetado pelo CLI (`ensureResponsive` insere quando falta)
  e os slots `@MIRA:FAST:*` são da Fase 1 (`agents/mira-fast/SKILL.md:132`).
- **Não corrigir só os templates.** Pôr o marcador nos três faz o sintoma sumir hoje e
  reaparecer no próximo template. A metade do CLI é a que fecha a causa.
- **`edit.js` pode ter o mesmo padrão.** Não verifiquei: `lib/commands/edit.js` importa
  `ensureResponsive`, mas não conferi se ele também mexe em `@MIRA:THEME` por `replace`. Quem
  corrigir deve olhar.
- **Proposta de taxonomia:** `area: cli`, `module: mira-animator`, `feature: criacao-de-deck`.
