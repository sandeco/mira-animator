---
schema_version: 1
id: BUG-20260731-ETPU
display_number: 10
title: Falha tardia da montagem deixa o deck meio instalado, com módulos e launcher mas sem HTML
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-07-31
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
    - "_reversa_sdd/addenda/bug-BUG-20260731-ETPU-v001.md#r4b-a-montagem-nao-deixa-deck-meio-instalado"
  root_cause:
    state: confirmed
    hypothesis: >-
      installRuntime copiava para dentro do deck antes das checagens finais e da publicação.
      A publicação do HTML sempre foi atômica, com backup e restauração; a instalação do
      runtime não tinha nada parecido, e acontecia primeiro.
    causal_path:
      - "installRuntime copia módulos, servidor, launchers e vendor (linha 319)"
      - "os três slots são preenchidos e a saída é montada"
      - "uma checagem tardia falha, ou a publicação atômica falha"
      - "a exceção sobe e nada desfaz as cópias"
      - "o deck fica com launcher na raiz, mira/ populado e assets/vendor/ cheio, sem index.html"
      - "o usuário executa o launcher e o servidor sobe servindo um deck que não existe"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "1/1: mira-camera.js, mira-studio-server.cjs, o .bat e o d3 CRIADOS; index.html ausente"
      - ref: "fix/CHG-002.diff"
        observation: "três casos: deck limpo, deck com runtime anterior, e fonte de runtime ausente"
    code_refs:
      - file: "agents/mira-fast/scripts/assemble-run.mjs"
        symbol: "assembleRun / installRuntime"
        commit: "456b38b"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-ETPU · falha tardia não deixa runtime instalado num deck limpo"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-ETPU · fonte de runtime ausente é detectada antes de copiar"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-ETPU · falha tardia não deixa runtime instalado num deck limpo"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-ETPU · runtime de uma montagem anterior sobrevive a uma falha"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "agents/mira-fast/scripts/assemble-run.mjs"
  - id: CHG-002
    kind: test
    artifact: "test/mira-studio-contrato.test.mjs"
  - id: CHG-003
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260731-ETPU-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260731-ETPU-v001.md"

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: 456b38b
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
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

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### Segundo defeito, achado e corrigido em 2026-08-14

A correção de 2026-08-01 moveu o `installRuntime` para depois da publicação, e isso está certo.
Mas o teste `falha tardia não deixa runtime instalado num deck limpo` **continuava vermelho**, e
por outro motivo, dentro do `publishOutput`.

**O que acontecia.** Com `index.html` sendo uma pasta, o `rename(tmp → index.html)` falha com
`EEXIST`/`EPERM` e o código cai no plano B: guarda o antigo em `index.html.mira-fast.bak` e repõe.
O plano B então **funcionava**: movia a pasta para o lado e escrevia o `index.html` novo. Só quebrava
na limpeza, em `rmSync(backupPath, { force: true })`, porque **`rmSync` sem `recursive: true` não
apaga pasta** (`ERR_FS_EISDIR`, medido). O `catch` só restaura quando o `outputPath` não existe, e
ele já existia, então nada era restaurado e o erro subia deixando dois restos: o `index.html` novo e
a pasta `.bak` com o conteúdo do usuário dentro.

**Por que não bastava pôr `recursive: true`.** Com só isso, a publicação passaria a **ter sucesso**:
a pasta do usuário viraria um `.bak` apagado em seguida, e o conteúdo dela sumiria em silêncio. O
teste exige `assert.throws`, e exige com razão.

**Correção.** O plano B existe para o arquivo **travado por outro processo**, caso clássico do
Windows (`EPERM`/`EACCES`). Ele não se aplica a pasta. Agora, antes do plano B, um
`statSync(outputPath).isDirectory()` faz a publicação **falhar limpa**, removendo o temporário e sem
tocar na pasta do usuário. E as duas chamadas de limpeza ganharam `recursive: true`, para que um
`.bak` de pasta deixado por uma execução antiga não trave toda publicação futura.

Arquivo: `agents/mira-fast/scripts/assemble-run.mjs`, função `publishOutput`.

Verificação: `node --test test/mira-studio-contrato.test.mjs` passa 17 de 17, e a suíte inteira
passa 233 de 233. Antes desta correção eram 232 de 233.

**Continua não fechado pelo mesmo motivo de antes:** a closure policy é `package` e exige versão
publicada. Fechar formalmente (`status: resolved`, `resolution_kind`, `closure.satisfied` e o
`DONE.md`) é ritual do `/reversa-debugger-fix`, não foi feito aqui.

### A escolha entre as duas correções

O registro apresentava as duas e recomendava a primeira. **Confirmada: mover, não desfazer.**
Desfazer é arriscado num deck que talvez já tivesse esses arquivos de uma montagem anterior, e
o teste `runtime de uma montagem anterior sobrevive a uma falha` existe justamente para provar
que nada é removido.

A observação do registro sobre `stripModuleTags` também se confirmou: ele depende da lista de
módulos, e essa lista é `FORMAT_MODULES[format]`, conhecida sem copiar arquivo nenhum. Foi o
que permitiu separar o plano da execução.

### Causa raiz (confirmed)

A posição de `installRuntime` no fluxo. A publicação do HTML sempre foi cuidadosa (escrita
atômica com backup e restauração, coberta pelo teste `falha não substitui uma saída válida
anterior`); a instalação do runtime não tinha nada parecido e acontecia antes.

### O que mudou

`installRuntime` foi partido em dois:

- **`runtimePlan(projectRoot, deckDir, format)`** resolve a lista de origem e destino e
  **confere que toda origem existe**, sem escrever nada. Falta alguma, aborta nomeando os
  arquivos.
- **`installRuntime(plan)`** só copia, e só roda depois de `publishOutput`.

A ordem normativa ficou: validar → resolver runtime → conferir fontes → montar e checar →
publicar atomicamente → copiar runtime → semear `roteiro.md`. Falha em qualquer etapa até a
publicação não deixa arquivo novo no deck, além do `montagem.log`.

O log passou a registrar `runtime: N arquivo(s) instalado(s)`, que é o critério de aceite 3.

### Nota sobre a reprodução

O registro sugeria provocar a falha pela contagem de `section` com um comentário no bloco `js`.
Esse caminho **não existe mais**: a correção do BUG-20260731-BNO4 fez a contagem ignorar
comentário, e as duas checagens tardias passaram a ser inalcançáveis por entrada válida (o
próprio BUG-20260731-K4NR já registrava isso na Resolution dele).

A reprodução usa então a falha da publicação atômica: `index.html` existindo como **diretório**
no deck. É uma falha genuinamente tardia, depois de todas as checagens, e é o pior caso para
este bug. O resultado antes da correção é o mesmo que a evidência original registrou: runtime
instalado, deck ausente.

### Veredito de spec: `spec-gap`

`05#R4` define o que copiar e `#R6` o que pode existir na raiz. Nenhuma das duas prevê o estado
intermediário. Adendo aditivo gerado:

`_reversa_sdd/addenda/bug-BUG-20260731-ETPU-v001.md` — R4b (a ordem normativa das sete etapas) e
R4c (o log conta o que foi instalado).

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `code` | `agents/mira-fast/scripts/assemble-run.mjs` | `runtimePlan()` confere sem copiar; `installRuntime()` roda depois de publicar ([diff](fix/CHG-001.diff)) |
| CHG-002 | `test` | `test/mira-studio-contrato.test.mjs` | três casos de falha ([diff](fix/CHG-002.diff)) |
| CHG-003 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-ETPU-v001.md` | adendo aditivo |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ falha tardia não deixa runtime instalado num deck limpo
       ✖ fonte de runtime ausente é detectada antes de copiar
       ✔ runtime de uma montagem anterior sobrevive a uma falha

depois ✔ os três
```

O terceiro passava antes porque a montagem nunca removeu nada; ele é guarda de não regressão da
correção, que poderia ter introduzido remoção.

### O resíduo aceito

Se a cópia falhar por erro de I/O **depois** de as origens terem sido conferidas, o deck fica
com `index.html` e sem algum módulo. É estritamente melhor que o estado anterior: o deck ainda
exibe os slides, só perde edição, pintura ou câmera, e o log registra. Está escrito no adendo,
não escondido.

### Herança

O `/mira-ultrafast` delega para o mesmo `assembleRun` e herda a correção.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Falhas anteriores à linha 319 estão limpas.** Verifiquei: uma falha em `validateSkeleton`
  não deixa resíduo nenhum. O problema é estritamente a janela entre a linha 319 e a 348.
- **O `/mira-ultrafast` herda**, porque delega para o mesmo `assembleRun`.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: montagem-fase-3`.
