---
schema_version: 1
id: BUG-20260731-ETPU
display_number: 10
title: Falha tardia da montagem deixa o deck meio instalado, com módulos e launcher mas sem HTML
status: open
phase: triaging
severity: medium
priority: P2
created: 2026-07-31
updated: 2026-07-31

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
  rate: "1/1 nesta varredura"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r4-modulos-de-autoria-rf11-diretiva-do-claudemd"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r6-raiz-limpa-c3-diretiva-do-claudemd"
  affected_code:
    - "agents/mira-fast/scripts/assemble-run.mjs:319"
    - "agents/mira-fast/scripts/assemble-run.mjs:339-345"
    - "agents/mira-fast/scripts/assemble-run.mjs:160-179"
  root_cause: null
  reproduction_tests: []
  regression_tests: []

spec_verdict: null

change_set: []

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# Falha tardia da montagem deixa o deck meio instalado, com módulos e launcher mas sem HTML

## Summary

`installRuntime` copia módulos de autoria, servidor, launchers e bibliotecas vendoradas para
dentro do deck **antes** das duas últimas checagens da montagem. Quando uma delas falha, os
arquivos ficam. O deck termina com launcher na raiz, `mira/` populado e `assets/vendor/`
cheio, mas sem o `index.html` que dá sentido a tudo isso.

A publicação do HTML é cuidadosa: escrita atômica com backup e restauração
(`publishOutput`, linhas 260-284), e o teste `falha não substitui uma saída válida anterior`
prova esse cuidado. A instalação do runtime não tem nada parecido.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r4-modulos-de-autoria-rf11-diretiva-do-claudemd`
define o que copiar; `#r6-raiz-limpa-c3-diretiva-do-claudemd` define o que pode existir na
raiz do deck. Nenhuma das duas prevê o estado intermediário: raiz com launcher e sem deck.

O `CLAUDE.md` é categórico sobre a raiz do deck conter `index.html` mais os launchers. Uma
montagem que falha e deixa só os launchers produz exatamente a raiz que a diretiva não
prevê.

Montagem que falha deve deixar o deck como estava, ou dizer claramente o que ficou pelo
caminho.

## Actual Behavior

Ordem em `assemble-run.mjs`:

| linha | o que acontece |
|---|---|
| 319 | `installRuntime` copia módulos, `mira-studio-server.cjs`, launchers e vendor |
| 334-337 | preenche os três slots |
| 339-342 | **checagem de contagem de `<section>`**, pode lançar |
| 343-345 | **checagem de módulo duplicado ou ausente**, pode lançar |
| 348 | só aqui o `index.html` é publicado |

Reproduzido nesta varredura, provocando a falha da linha 340 num deck sem os arquivos de
runtime:

```
assemble FALHOU: saída possui 5 section(s), esperado 4
efeitos colaterais deixados pela falha:
    mira/mira-camera.js           CRIADO
    mira/mira-studio-server.cjs   CRIADO
    mira-studio-windows.bat       CRIADO
    assets/vendor/d3.v7.min.js    CRIADO
    index.html                    ausente
```

O `montagem.log` registra o erro, mas não menciona nada do que foi instalado.

Efeito prático: o usuário vê o launcher na raiz, executa, e o servidor sobe servindo um deck
que não existe. Numa re-montagem posterior os arquivos são sobrescritos e o estranho some,
o que torna o episódio difícil de diagnosticar depois.

## Steps to Reproduce

1. Preparar um deck cujo plano e fragmentos passem em `validateRun` e `validateSkeleton`,
   mas que falhe na contagem final. Um comentário com `<section>` no bloco `js` de uma folha
   basta, ver BUG-20260731-BNO4.
2. Garantir que o deck ainda não tenha `mira/`, launchers nem `assets/vendor/`.
3. Rodar `node agents/mira-fast/scripts/assemble-run.mjs "<deck>"`.
4. A montagem falha. Listar o deck: os arquivos de runtime estão lá, o HTML não.

## Evidence

- `evidence/execucao.md` — script da reprodução e listagem do deck após a falha.

## Suspected Area

`assemble-run.mjs:319`, a posição da chamada de `installRuntime` dentro do fluxo.

Duas correções possíveis, e a escolha é de projeto:

- mover as checagens das linhas 339-345 para antes da instalação, o que exige montar a saída
  antes de instalar. `stripModuleTags` na linha 320 depende da lista de módulos, mas essa
  lista é `FORMAT_MODULES[format]`, conhecida sem copiar arquivo nenhum;
- ou manter a ordem e desfazer o que foi copiado quando a montagem falha, o que é mais
  arriscado num deck que talvez já tivesse esses arquivos de uma montagem anterior.

A primeira parece mais segura e mais barata.

## Acceptance Criteria

1. Montagem que falha em qualquer checagem não deixa arquivo novo no deck além do
   `montagem.log`.
2. Deck que já tinha runtime instalado de uma montagem anterior continua com ele intacto
   depois de uma falha.
3. O `montagem.log` continua registrando o erro, e passa a registrar se algum arquivo foi
   instalado.
4. Teste de regressão: provocar falha tardia num deck limpo e verificar que nada foi criado.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `05-fase-3-montagem.md#r4-modulos-de-autoria-rf11-diretiva-do-claudemd`, `#r6-raiz-limpa-c3-diretiva-do-claudemd` |
| Diretiva | `CLAUDE.md`, estrutura de pastas de um deck |
| Código afetado | `agents/mira-fast/scripts/assemble-run.mjs` (319, 339-345, 160-179) |
| Testes | nenhum para este caso; `falha não substitui uma saída válida anterior` cobre só o HTML |

## Resolution

Em aberto.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Falhas anteriores à linha 319 estão limpas.** Verifiquei: uma falha em `validateSkeleton`
  não deixa resíduo nenhum. O problema é estritamente a janela entre a linha 319 e a 348.
- **O `/mira-ultrafast` herda**, porque delega para o mesmo `assembleRun`.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: montagem-fase-3`.
