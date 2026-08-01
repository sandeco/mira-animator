---
schema_version: 1
id: BUG-20260801-F74X
display_number: 13
title: Reordenar slides no mira-studio 9:16 não move o bloco correspondente do roteiro.md e o teleprompter fica com a fala da posição errada
status: active
phase: delivering
severity: high
priority: P1
created: 2026-08-01
updated: 2026-08-01

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-gap
  - paridade-de-formato

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "3/3 em Chromium real, nos dois sabores (deck escrito à mão e deck gerado pelo pipeline); o 16:9 como controle passa 3/3"
  confirmed_triggers:
    - "deck do formato mira-studio (9:16) servido por http:// (launcher ou mira-studio-server.cjs)"
    - "existência de roteiro.md ao lado do index.html"
    - "uso das setas de reordenação do modo E (mira-edit.js) seguido de Salvar"

blocking: []

relationships:
  - bug: BUG-20260731-JZNJ
    type: related-to
    state: proposed
    evidence:
      - ref: "evidence/comparacao-dos-dois-templates.md"
        observation: >-
          o reaproveitamento por posição introduzido pelo JZNJ (index.html:559) é o
          mecanismo que faz o texto e o título ficarem presos à posição; o JZNJ o
          introduziu corretamente para preservar o palco, e este bug é a consequência
          não coberta daquele casamento posicional
  - bug: BUG-20260801-ADQX
    type: blocked-by
    state: confirmed
    evidence:
      - ref: "evidence/reproduction.md"
        observation: >-
          sem a correção do ADQX o Salvar recusava em deck gerado com "Nº de blocos no
          arquivo (4) ≠ nº de slides na tela (3)", e o critério de aceite 1 e 2 (deck
          gerado) não tinha como passar. Corrigidos no mesmo ciclo.
  - bug: BUG-20260731-S3TX
    type: related-to
    state: proposed
    evidence:
      - ref: "evidence/comparacao-dos-dois-templates.md"
        observation: >-
          mesmo par de arquivos, mesma assimetria entre os dois builders Studio; o S3TX
          corrigiu o 16:9 e o JZNJ o 9:16, e aqui a lacuna é o inverso

traceability:
  specs:
    - "_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md#r8-quem-manda-na-ordem-dos-slides"
    - "_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md#r8b-os-dois-modos-e-quando-cada-um-vale"
    - "_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md#r8c-ordem-das-gravacoes"
  affected_code:
    - "templates/decks/mira-studio-demo/index.html:559"
    - "templates/decks/mira-studio-demo/index.html:478-513"
    - "templates/decks/mira-studio-demo/index.html:930-940"
    - "templates/decks/mira-studio-demo/index.html:946-949"
    - "templates/authoring/mira-edit.js:147-156"
    - "templates/authoring/mira-edit.js:573-601"
  reference_implementation:
    - "templates/decks/mira-studio-full-demo/index-16x9.html:1237-1319"
    - "templates/decks/mira-studio-full-demo/index-16x9.html:780-786"
  root_cause:
    state: confirmed
    hypothesis: >-
      o contrato window.miraOrderSource nasceu no commit 5433675 com um consumidor único
      (o deck 16:9) e nunca foi replicado no deck 9:16. Sem o hook, o saveAll do
      mira-edit.js reordena as section dentro do index.html e não toca no roteiro.md;
      no reload seguinte o builder recasa roteiro.md[i] com a seção da posição i e
      repinta título e fala da posição, não do slide.
    causal_path:
      - "usuário move um slide com as setas do modo E e clica Salvar"
      - "saveAll consulta window.miraOrderSource; no deck 9:16 ele não existe"
      - "delegated = false, então reordena = true e composeSource reescreve o index.html na ordem nova"
      - "o roteiro.md permanece exatamente como estava"
      - "no reload sob HTTP o builder lê o roteiro.md e faz montarSecao(s, i+1, estaticas[i])"
      - "a seção reaproveitada mantém palco e animação, mas recebe o título da posição"
      - "doRoteiro indexa o texto por posição e o teleprompter mostra a fala da posição"
      - "o poll de 1,5 s reafirma o desalinhamento a cada ciclo, e a próxima edição no painel grava a fala no bloco errado do roteiro.md"
    evidence:
      - ref: "evidence/comparacao-dos-dois-templates.md"
        observation: >-
          grep de miraOrderSource/remapPorPosicao/mira-slide-id devolve 10 no 16:9 e 0 no
          9:16; git log -S do símbolo devolve um único commit tocando só mira-edit.js e
          index-16x9.html
      - ref: "evidence/reproduction.md"
        observation: >-
          em Chromium real, 3/3: o mesmo gesto (seta do modo E + Salvar) manda POST para
          /index.html sem baseSha no 9:16 e para /roteiro.md com baseSha no 16:9. O caminho
          de gravação inteiro muda com a presença do hook, e só o 16:9 leva título e fala
          junto com o slide.
    code_refs:
      - file: "templates/decks/mira-studio-full-demo/index-16x9.html"
        symbol: "window.miraOrderSource · commit(perm) / remapPorPosicao"
        commit: "5433675"
      - file: "templates/decks/mira-studio-demo/index.html"
        symbol: "IIFE ROTEIRO EXTERNO · montarSecao / doRoteiro (sem contraparte)"
        commit: "c7adeb2"
  reproduction_tests:
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · reordenar no 9:16 grava o roteiro.md junto com o index.html"
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · palco, título e fala andam juntos num deck gerado"
  regression_tests:
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · o mira-slide-id não vaza para o teleprompter"
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · roteiro.md com outra contagem aborta sem gravar nada"
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · reordenar durante a gravação é recusado"
    - "test/mira-studio-builders.test.mjs::BUG-20260801-F74X · o 16:9 não muda de comportamento"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "templates/authoring/mira-edit.js"
  - id: CHG-002
    kind: code
    artifact: "templates/decks/mira-studio-demo/index.html"
  - id: CHG-003
    kind: test
    artifact: "test/mira-studio-builders.test.mjs"
  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md"

change_risk: média
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md"

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: c7adeb2
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Reordenar slides no mira-studio 9:16 não move o bloco correspondente do roteiro.md e o teleprompter fica com a fala da posição errada

## Summary

O formato `mira-studio` (9:16, vertical) e o `mira-studio-full` (16:9) usam o mesmo editor
(`mira-edit.js`) e o mesmo servidor (`mira-studio-server.cjs`), mas só o 16:9 registra
`window.miraOrderSource`. Esse hook é o que faz o Salvar **delegar a ordem ao `roteiro.md`**
em vez de reordenar o HTML sozinho.

No 9:16, sem o hook, mover um slide reescreve a ordem das `<section>` no `index.html` e deixa
o `roteiro.md` intacto. Como o builder do roteiro casa `roteiro.md[i]` com a seção da posição
`i`, o slide movido leva junto o palco e a animação dele, mas recebe **o título e a fala de
quem ocupa a posição nova**. Slide e texto ficam desencontrados, sem erro, sem aviso.

A suspeita do relato está correta e foi conferida: a correção existe e nunca saiu do 16:9.

## Expected Behavior

**Não há spec.** Nem `agents/mira-studio/SKILL.md` nem `agents/mira-studio-full/SKILL.md`
descrevem o contrato `miraOrderSource`, e nenhum checklist de validação cobra sua presença.
Por isso o bug carrega `spec-gap`: o comportamento correto está implementado num arquivo e
documentado em lugar nenhum.

O comportamento esperado, derivado da implementação de referência do 16:9
(`index-16x9.html:1255-1309`) e do contrato declarado em `mira-edit.js:147-156`:

1. Todo deck Studio com `roteiro.md` como fonte da verdade registra `window.miraOrderSource`.
2. Ao salvar uma reordenação sob HTTP, o editor **delega**: o `index.html` não é reordenado,
   quem muda é o `roteiro.md`.
3. O `commit(perm)` recusa reordenar durante gravação, recusa se o número de blocos do
   `roteiro.md` divergir do número de slides na tela, e grava com `baseSha` (compare-and-set),
   tratando `409` como "o arquivo mudou por fora, nada foi gravado".
4. Estados do `localStorage` indexados por slide seguem o slide na ordem nova.
5. Depois do reload, o usuário volta ao slide em que estava.

## Actual Behavior

No deck 9:16, `window.miraOrderSource` é `undefined`. Então em
`templates/authoring/mira-edit.js:574-576`:

```js
var api = orderSource();              // null
var delegated = orderChanged && api && api.commit;   // false
```

e em `:581-587` o `composeSource(src, perm, true, ...)` reescreve o `index.html` com as
`<section>` na ordem nova. O `roteiro.md` não é lido nem gravado em nenhum ponto do caminho.

No reload seguinte, o builder (`index.html:559`) faz:

```js
var novas = R.slides.map(function (s, i) { return montarSecao(s, i + 1, estaticas[i]); });
```

Casamento por posição. `montarSecao` (`:478-513`) reaproveita a seção existente e repinta o
`h1/h2` com o título do bloco daquela posição no roteiro. E `doRoteiro` (`:936-940`) escreve
`txt[i] = roteiro.slides[i].texto`, também por posição.

Resultado observável, movendo o slide 5 para a posição 2:

| o que o usuário vê na posição 2 | de onde veio |
|---|---|
| animação, palco, `.cam-area`, chrome autoral | slide 5 (a seção movida) |
| título | bloco 2 do `roteiro.md` |
| fala no teleprompter e no overlay | bloco 2 do `roteiro.md` |

Agrava: o poll de 1,5 s (`index.html:1029-1053`) reafirma o desalinhamento a cada ciclo, e a
primeira edição feita no painel do teleprompter grava a fala **no bloco errado** do
`roteiro.md` (debounce de 800 ms em `:1020`). O erro deixa de ser só de exibição e passa a ser
gravado no arquivo.

## Steps to Reproduce

1. Abrir um deck do formato `mira-studio` (9:16) com quatro ou mais slides, servido pelo
   launcher (`mira-studio-windows.bat` / `remote-control-apple.command`), em
   `http://localhost:<porta>`. Confirmar que existe `roteiro.md` ao lado do `index.html`.
2. Anotar a fala do slide 5 no painel do teleprompter.
3. Entrar no modo E e subir o slide 5 até a posição 2 com as setas.
4. Salvar (botão Salvar ou Ctrl+S).
5. Recarregar a página.
6. Ir ao slide na posição 2: a animação é a do slide 5, mas o título e a fala são os do
   antigo slide 2.
7. Abrir o `roteiro.md` no editor: a ordem dos blocos `## Slide` está inalterada.
8. Repetir os passos 1 a 7 num deck `mira-studio-full` (16:9): o `roteiro.md` é reescrito na
   ordem nova, os blocos ganham `<!-- mira-slide-id: ... -->`, e o texto acompanha o slide.

## Evidence

- `evidence/comparacao-dos-dois-templates.md` — comparação lado a lado dos dois templates,
  com greps, `git log -S`, trechos exatos e números de linha, no commit `c7adeb2`.
- `../../intake/relato-20260801-1404.md` — relato bruto e a conferência feita na sessão.

## Suspected Area

`templates/decks/mira-studio-demo/index.html`, na fronteira entre o builder do roteiro e o
teleprompter: falta o bloco `window.miraOrderSource` que o 16:9 tem em
`index-16x9.html:1237-1319`, mais o carimbo de `<!-- mira-slide-id: ... -->` no parse
(`index-16x9.html:780-786`).

O `mira-edit.js` e o `mira-studio-server.cjs` **não precisam mudar**: o contrato do editor já
é genérico e o compare-and-set por `baseSha` já está implementado no servidor
(`mira-studio-server.cjs:231-239`), usado pelos dois launchers.

Portar não é copiar e colar. As duas diferenças reais a resolver no fix:

1. **Formato do cabeçalho.** O 16:9 usa `## Slide N | layout | Título | anim` com layouts
   `thirds`/`full`/`camera`; o 9:16 usa `## Slide N | layout | Título` sem campo de animação,
   com layouts `capa`/`camera`/`split`/`full`. O corte por `^##\s*Slide` do `commit(perm)` é
   agnóstico a isso, mas o carimbo do `mira-slide-id` precisa entrar depois do cabeçalho sem
   confundir o `parse()` do 9:16 (`index.html:390-412`), que hoje trata toda linha não
   cabeçalho como corpo da fala e **incluiria o comentário HTML no texto do teleprompter**.
2. **Caminho do arquivo.** O 16:9 usa `MD_PATH = '/roteiro.md'` fixo na raiz servida; o 9:16
   usa `window.__miraRoteiroPath` derivado do `location.pathname`, que é o comportamento mais
   correto. O port deve ficar com o do 9:16.

## Acceptance Criteria

1. Deck `mira-studio` 9:16 servido por HTTP: reordenar no modo E e salvar reescreve o
   `roteiro.md` na ordem nova e **não** reordena as `<section>` do `index.html`.
2. Depois do reload, cada slide mostra o título e a fala do bloco que sempre foi dele, e
   mantém o palco, os ids e a animação (não regredir o BUG-20260731-JZNJ).
3. O `mira-slide-id` carimbado no `roteiro.md` **não** vaza para o texto do teleprompter nem
   para o overlay lido em câmera.
4. Reordenar durante gravação é recusado com mensagem, e a gravação não é interrompida.
5. Divergência entre número de blocos no `roteiro.md` e número de slides na tela aborta a
   gravação com mensagem, sem gravar nada.
6. `roteiro.md` alterado por fora durante a edição devolve `409` e nada é gravado.
7. Overlay do teleprompter (`mira-tp-ov-pos`) segue o slide na ordem nova.
8. Depois do reload o usuário volta ao slide em que estava.
9. `file://` continua funcionando: sem servidor não há hook, e o Salvar segue o caminho do
   File System Access reordenando o HTML, como hoje.
10. Teste de regressão automatizado cobre 1, 2 e 3 juntos, no mesmo estilo de
    `test/mira-studio-builders.test.mjs`.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | nenhuma (`spec-gap`): o contrato `miraOrderSource` não está em nenhum SKILL.md nem checklist |
| Código afetado | `templates/decks/mira-studio-demo/index.html` (478-513, 559, 930-940, 946-949) |
| Contrato (não muda) | `templates/authoring/mira-edit.js` (147-156, 573-601) |
| Implementação de referência | `templates/decks/mira-studio-full-demo/index-16x9.html` (780-786, 1237-1319) |
| Servidor (não muda) | `templates/studio/mira-studio-server.cjs` (231-239) |
| Causa raiz | `proposed`; confirmação é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

Corrigido em 2026-08-01. **Não fechado**: a closure policy é `package` e exige merge e versão
publicada. Estado atual `active` / `delivering`.

### Reprodução

Reproduzido em Chromium real, 3/3, em dois sabores, com o 16:9 como controle. Ver
`evidence/reproduction.md`. `deterministic`: o protocolo é gatilho, não fonte de variância.

### O plano estava errado, e a reprodução mostrou

A primeira versão do `fix/plan.html` dizia "existe uma implementação de referência
funcionando no formato irmão, a decisão é portar, não inventar". **Falso.** O deck 16:9 de
demonstração escondia o problema porque as animações dele são declaradas no próprio
`roteiro.md`. Num deck 16:9 **gerado**:

| troca | resultado no 16:9 "corrigido" |
|---|---|
| dois slides de mesmo layout | título e fala andam, o palco **fica**: a animação toca debaixo do texto errado |
| layouts diferentes | o builder recria a seção e os palcos `<slug>-stage` são **destruídos**, viram `sv-slide-N`, e as animações geradas ficam mudas |

O 16:9 delega a ordem ao `roteiro.md` mas não move a `<section>`; o builder continua casando
`roteiro.md[i]` com a seção da posição `i`. O `mira-slide-id` dá identidade ao bloco dentro
do arquivo, não casa bloco com seção.

Portar fielmente teria trocado um desencontro por outro. A estratégia foi refeita.

### Causa raiz (confirmed)

O contrato `window.miraOrderSource` nasceu no commit `5433675` com um consumidor único e
nunca chegou ao 9:16. Sem o hook, o `saveAll` reordena o `index.html` e não toca no
`roteiro.md`; no reload o builder devolve título e fala da posição antiga.

### Estratégia: `accompany`, não `replace`

Três opções pesadas, decisão do usuário:

| | o que faz | veredito |
|---|---|---|
| A · port fiel | copia o 16:9: só o `roteiro.md` muda | **rejeitada**: reproduz as duas falhas acima em todo deck 9:16 gerado |
| **B · mover os dois** | o Salvar reordena o `roteiro.md` **e** as `<section>`, na mesma permutação | **escolhida** |
| C · casar por identidade | carimbar o id na `<section>` e o builder casar por id | resolve a classe inteira, mas mexe fundo no builder e arrasta o 16:9 junto |

Em B as posições continuam alinhadas, então o reaproveitamento por posição do
BUG-20260731-JZNJ segue valendo e palco, título e fala andam juntos.

### O que mudou

**`templates/authoring/mira-edit.js`** ([CHG-001](fix/CHG-001.diff)):

1. `window.miraOrderSource` ganhou `mode`. `'replace'` (padrão) é o comportamento de sempre,
   que o 16:9 usa; `'accompany'` reordena o HTML **e** grava a fonte externa.
2. Em `accompany` o `commit` roda depois de o HTML novo estar montado em memória e antes de
   qualquer gravação. Recusa de qualquer lado deixa os dois arquivos intocados.

**`templates/decks/mira-studio-demo/index.html`** ([CHG-002](fix/CHG-002.diff)):

3. `window.miraOrderSource` em `mode: 'accompany'`, com as quatro guardas: recusa durante
   gravação, contagem de blocos, compare-and-set por `baseSha` (degradando explicitamente
   sem `crypto.subtle`), e blocos movidos verbatim.
4. `<!-- mira-slide-id -->` carimbado por bloco, extraído pelo `parse()` e reemitido pelo
   `montar()`. **Não** entra na fala: sem isso o overlay mostraria o comentário na frente da
   câmera.
5. `mira-tp-text` e `mira-tp-ov-pos` remapeados pela permutação, em memória e no
   `localStorage`.
6. `aposReordenar` cancela a escrita pendente do painel e reancora o conteúdo conhecido:
   sem isso, um debounce em voo gravaria os textos antigos sobre os cabeçalhos novos.

Sem reload: o DOM já está na ordem certa e os dois arquivos também, então repintar basta.

### Um furo meu, achado e corrigido no meio

A primeira versão gravava o `roteiro.md` **antes** do HTML. Se o HTML falhasse depois, os
dois arquivos saíam dessincronizados. E ele falha mesmo: em deck gerado o
`composeSource` lançava por causa do BUG-20260801-ADQX. Corrigido movendo o `commit` para
depois da montagem em memória. Medido: `gravou: []`, nenhum arquivo alterado.

### Bloqueio encontrado: BUG-20260801-ADQX

Os critérios de aceite 1 e 2 (deck gerado) não tinham como passar enquanto o Salvar recusasse
com `Nº de blocos no arquivo (4) ≠ nº de slides na tela (3)`. Registrado e corrigido no mesmo
ciclo, com aprovação.

### Veredito de spec: `spec-gap`

O contrato existia só em código e num comentário. Adendo aditivo gerado, spec original
intocada: `_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md` — R8 (quem manda na ordem),
R8b (os dois modos), R8c (ordem das gravações), R8d (guardas), R8e (identidade do bloco e o
que não vira fala), R8f (estado por índice).

### Prova vermelho → verde

```
antes  ✖ reordenar no 9:16 grava o roteiro.md junto com o index.html
       ✖ palco, título e fala andam juntos num deck gerado
       ✖ o mira-slide-id não vaza para o teleprompter
       ✖ roteiro.md com outra contagem aborta sem gravar nada
       ✖ reordenar durante a gravação é recusado
       ✔ o 16:9 não muda de comportamento

depois ✔ os seis
```

O último caso é guarda de não regressão: passa antes e depois, que é o papel dele.

Suíte completa do projeto: **157 testes, 157 passando, 0 falhas.**

### O que continua aberto

- **O 16:9 tem o mesmo defeito, medido e não corrigido.** Ele segue em `mode: 'replace'` e
  apresenta as duas falhas da tabela acima em deck gerado. Precisa de bug próprio.
- **A caneta não segue o slide.** Os traços do `mira-draw.js` são guardados por índice e não
  são remapeados, nos dois formatos. O `remapPorPosicao` do 16:9 também não cobre.
- **Decks 9:16 já existentes** não recebem a correção: o template só vale para deck novo.
  Migrar deck existente é trabalho do `npx mira-animator edit`.
- **`lib/mira-serve.js` não implementa `baseSha`**, então um deck servido por ele grava sem
  compare-and-set. Os launchers dos dois formatos usam o `mira-studio-server.cjs`, que
  implementa.
- **Chaves de `localStorage` sem escopo por deck** (`mira-tp-text`, `mira-tp-ov-pos`):
  pendência aberta desde o BUG-JZNJ, agora com uma consequência a mais, já que o remap de um
  deck remapeia o do outro na mesma origem.

## Agent Notes

- **A caneta também fica para trás, nos dois formatos.** O `remapPorPosicao` do 16:9 cobre
  `mira-tp-text` e `mira-tp-ov-pos`, mas **não** os traços do `mira-draw.js`, guardados por
  índice de slide. Ao reordenar, o desenho de um slide vai parar em outro. Vale nos dois
  formatos e não tem bug próprio; se o fix não resolver junto, precisa virar registro
  separado.
- **Chaves de `localStorage` sem escopo por deck.** `mira-tp-text` e `mira-tp-ov-pos` são
  literais, iguais para todo deck da mesma origem. Dois decks servidos na mesma porta
  compartilham texto e overlay, e o `remapPorPosicao` de um remapeia o do outro. Já estava
  anotado como pendência aberta no BUG-20260731-JZNJ; aqui ganha uma consequência nova.
- **`lib/mira-serve.js` não implementa `baseSha`.** Só o `mira-studio-server.cjs` implementa.
  Deck Studio servido por `node lib/mira-serve.js` grava sem compare-and-set, então o
  critério 6 (proteção contra edição concorrente) degrada silenciosamente. Os launchers dos
  dois formatos usam o servidor certo, então isso é caminho alternativo, não o principal.
- **O caminho ultrafast herda a lacuna.** `agents/mira-ultrafast/scripts/build-skeleton.mjs`
  monta o esqueleto `mira-studio` a partir deste mesmo template e não toca no builder do
  roteiro; todo deck gerado por lá nasce sem o hook.
- **A documentação também está assimétrica.** Nenhum dos dois SKILL.md descreve
  `miraOrderSource` ou manda o checklist conferi-lo. Foi exatamente por isso que a lacuna
  passou: nenhum validador cobrava. O veredito de spec deste bug deveria produzir um adendo
  que fixe o contrato para os **dois** formatos, e o item de checklist correspondente.
- **Proposta de taxonomia** (as listas de `taxonomy.yaml` continuam vazias):
  `area: geracao-de-decks`, `module: templates-studio`, `feature: reordenacao-de-slides`.
