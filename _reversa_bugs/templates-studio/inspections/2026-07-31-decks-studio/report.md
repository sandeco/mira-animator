# Pente-fino: geração de decks Studio pelo /mira-fast

Varredura de 2026-07-31, repositório fonte `/workspaces/.mira`, commit `558a406`.
Contextos cobertos: `templates-studio` e `mira-fast`. Este relatório é o mesmo nos dois.

**Regra desta varredura, dada pelo usuário:** confiar somente no que fosse verificado aqui.
O handoff da outra sessão foi usado como bússola, não como fonte. Todo achado abaixo foi
reproduzido em execução neste repositório, ou está marcado explicitamente como não
observado.

## Como reproduzi

Montei um deck `mira-studio` de verdade num diretório temporário,
`decks/2026-07-31 pente-fino-studio`, com quatro slides: capa, camera, split animado e full
animado. Os fragmentos foram escritos exatamente como
`agents/mira-fast/references/formato-mira-studio.md` prescreve, sem liberdade nenhuma, para
que qualquer falha fosse do contrato e não minha.

Os scripts estão em `scripts/` ao lado deste arquivo e são reexecutáveis:

| script | o que faz |
|---|---|
| `repro.mjs` | monta o deck com o template cru como esqueleto |
| `repro2.mjs` | gera o esqueleto pelo `build-skeleton.mjs` e monta |
| `parse-test.mjs` | roda o `parse()` e o `palco()` do deck gerado sobre o `roteiro.md` gerado |
| `repro3.mjs` | re-montagem sobre `roteiro.md` editado; falha precoce; status de folha ausente |
| `repro4.mjs` | folha com `<section>` em comentário no JS; efeitos colaterais da falha tardia |
| `repro5.mjs` | validador de fragmento, Studio contra `mira` |

## 1. Mapa da feature

### Specs

- `_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md` (R5 tabela de formatos, R6 Fase 0, R7 esqueleto)
- `_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md` (R9 especificidade por formato)
- `_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md` (R6 contrato de saída, R9 ondas e falhas)
- `_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md` (R1 validação, R3 triggers, R4 módulos, R5 capa, R6 raiz limpa, R7 roteiro.md, R7b pasta de trabalho)
- `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md` (teleprompter, Element Capture, persistência)
- `_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md` (áreas seguras 9:16)
- Adendos vigentes: nenhum. `_reversa_sdd/addenda/` não existe.

### Código

| papel | arquivo |
|---|---|
| orquestração | `agents/mira-fast/SKILL.md`, `workflows/mira-fast-engine.js` |
| contratos da folha | `agents/mira-fast/references/contrato-base.md`, `contrato-animado.md`, `contrato-estatico.md` |
| contratos de formato | `agents/mira-fast/references/formato-mira-studio.md`, `formato-mira-studio-full.md` |
| validação | `agents/mira-fast/scripts/validate-run.mjs` |
| montagem | `agents/mira-fast/scripts/assemble-run.mjs` |
| esqueleto por script | `agents/mira-ultrafast/scripts/build-skeleton.mjs` (novo, não commitado) |
| runtime do deck 9:16 | `templates/decks/mira-studio-demo/index.html` |
| runtime do deck 16:9 | `templates/decks/mira-studio-full-demo/index-16x9.html` |
| skills de formato | `agents/mira-studio/SKILL.md`, `agents/mira-studio-full/SKILL.md` |

### Testes

`test/mira-fast-assemble.test.mjs` (3 casos, 4 formatos), `test/mira-fast.test.mjs`,
`test/mira-ultrafast.test.mjs`.

### Dados e contratos externos

`mira/fast/plano.json`, `mira/fast/slide-NN.html`, `mira/fast/result-NN.json`,
`mira/fast/esqueleto.html`, `mira/fast/montagem.log`, `roteiro.md` na raiz do deck,
`localStorage` (`mira-tp-text`, `mira-tp-ov-pos`), bloco `#mira-studio-state` embutido no
HTML, e os endpoints `POST /__mira_save` e `GET /__mira_meta` do `mira-studio-server.cjs`.

### Bugs já registrados nesta área

BUG-20260731-JZNJ, BUG-20260731-S3TX, BUG-20260731-OI56 (contexto `templates-studio`) e
BUG-20260731-K4NR (contexto `mira-fast`). A varredura não os redescobriu; confirmou os
quatro por execução, o que está anotado ao final.

## 2. Achados por lente

### Lente: conformidade com spec

```yaml
- finding_id: F-conf-01
  lens: conformidade
  summary: contrato do layout capa não exige class="capa" e a capa gerada cai no ramo camera do builder
  confidence: alta
  evidence:
    - "parse-test.mjs: capaBase existe? false; slide 1 layout=capa -> ramo=camera"
    - "index.html do deck gerado, linha 261: <section> sem classe"
    - "templates/decks/mira-studio-demo/index.html:433,441-445,64,479-480"
    - "agents/mira-fast/references/formato-mira-studio.md, seção Layout capa"
  suspected_severity: high
  signals: [operational-risk?]
  promoted_to: BUG-20260731-VPVV

- finding_id: F-conf-02
  lens: conformidade
  summary: contrato do layout full omite .full-wrap; padding de área segura não se aplica e o render difere entre file:// e HTTP
  confidence: alta
  evidence:
    - "index.html do deck gerado, linha 270: slide full sem full-wrap"
    - "grep full-wrap no deck: só linha 103 (CSS) e 464 (builder)"
    - "templates/decks/mira-studio-demo/index.html:103-108"
    - "formato-mira-studio-full.md traz .thirds-main e .full-main; só o full do 9:16 ficou sem wrapper"
  suspected_severity: medium
  signals: [operational-risk?]
  promoted_to: BUG-20260731-UDTY

- finding_id: F-conf-03
  lens: conformidade
  summary: contrato dos formatos Studio prescreve viewBox fixo enquanto o formato mira o proíbe e exige cálculo em JavaScript
  confidence: média
  evidence:
    - "agents/mira-fast/references/formato-mira-studio.md: viewBox 0 0 960 960 e 0 0 960 1522.5"
    - "agents/mira-fast/scripts/validate-run.mjs:167-171 proíbe viewBox fixo no formato mira"
    - "o palco real do split não é quadrado: split-top é 1/1 menos o h2 e menos 4,63% de padding"
  suspected_severity: medium
  signals: []
  promoted_to: null   # não observei o resultado visual; anotado no BUG-20260731-UDTY
```

### Lente: fluxo de dados

```yaml
- finding_id: F-dados-01
  lens: fluxo-de-dados
  summary: re-montagem sobrescreve o roteiro.md editado pelo usuário, sem checar existência e sem registrar no log
  confidence: alta
  evidence:
    - "repro3.mjs EXP 1: edicao do usuario sobreviveu? false / voltou para a fala do plano? true"
    - "agents/mira-fast/scripts/assemble-run.mjs:350-351"
  suspected_severity: high
  signals: [data-corruption?]
  promoted_to: BUG-20260731-JJ6X

- finding_id: F-dados-02
  lens: fluxo-de-dados
  summary: window.__miraScript mantém as quatro falas de demonstração do template no deck gerado e vira o teleprompter em file://
  confidence: alta
  evidence:
    - "index.html do deck gerado, linhas 350-355: as falas do deck de demonstração"
    - "grep __miraScript em agents/mira-fast e agents/mira-ultrafast: nenhum resultado"
    - "index.html:849,870,875,884 (cadeia de precedência) e :362-364 (saída antecipada em file://)"
  suspected_severity: medium
  signals: []
  promoted_to: BUG-20260731-RNYU

- finding_id: F-dados-03
  lens: fluxo-de-dados
  summary: chaves de localStorage do teleprompter não têm escopo por deck; decks servidos na mesma origem compartilham texto e posição do overlay
  confidence: média
  evidence:
    - "templates/decks/mira-studio-demo/index.html:871 var TXTKEY = 'mira-tp-text'"
    - "templates/decks/mira-studio-demo/index.html:887 var POSKEY = 'mira-tp-ov-pos'"
    - "o launcher serve sempre em 127.0.0.1:8123, mesma origem para qualquer deck"
  suspected_severity: medium
  signals: []
  promoted_to: null   # não consegui observar em navegador nesta varredura; anotado no BUG-20260731-RNYU
```

### Lente: contratos e integrações

```yaml
- finding_id: F-contr-01
  lens: contratos
  summary: folha aprovada com zero erros pelo validate-run derruba a montagem no fim, porque a contagem final conta <section> citado em comentário do JS
  confidence: alta
  evidence:
    - "repro4.mjs: validate-run --slide 3 aprova? true [] ; assemble FALHOU: saída possui 5 section(s), esperado 4"
    - "agents/mira-fast/scripts/assemble-run.mjs:339-342 conta na saída inteira"
    - "agents/mira-fast/scripts/validate-run.mjs:129-133 conta só até o marcador de CSS"
  suspected_severity: high
  signals: [operational-risk?]
  promoted_to: BUG-20260731-BNO4
```

### Lente: estados de erro e edge cases

```yaml
- finding_id: F-erro-01
  lens: erro-edge
  summary: falha posterior à instalação do runtime deixa o deck com módulos, servidor, launcher e vendor, mas sem index.html
  confidence: alta
  evidence:
    - "repro4.mjs: 4 arquivos CRIADOS após a falha, index.html ausente"
    - "repro3.mjs EXP 2: falha anterior à instalação não deixa resíduo (5 arquivos false)"
    - "agents/mira-fast/scripts/assemble-run.mjs:319 contra 339-345 e 348"
  suspected_severity: medium
  signals: [operational-risk?]
  promoted_to: BUG-20260731-ETPU

- finding_id: F-erro-02
  lens: erro-edge
  summary: result-NN.json ausente ou com JSON inválido é tratado como sucesso
  confidence: alta
  evidence:
    - "repro3.mjs EXP 3: montou com ok=true; log diz 'status não informado' e 'status inválido'"
    - "agents/mira-fast/scripts/assemble-run.mjs:238-248"
  suspected_severity: low
  signals: []
  promoted_to: null   # o montagem.log registra os dois casos e validateRun revalida o fragmento;
                      # a perda real é só o campo attempts. Não atende o critério de confirmação.
```

### Lente: cobertura de testes

```yaml
- finding_id: F-test-01
  lens: cobertura
  summary: nenhum teste alimenta o pipeline com um template real; skeletonFor() é sintético e já nasce com todos os marcadores
  confidence: alta
  evidence:
    - "test/mira-fast-assemble.test.mjs:100-128 constrói o esqueleto à mão, com @MIRA:THEME, @MIRA:RESPONSIVE e os seis slots"
    - "repro.mjs: o template real reprova em 10 checagens de validateSkeleton"
  suspected_severity: high
  signals: [operational-risk?]
  promoted_to: null   # lacuna de cobertura, não defeito de produto. Virou critério de aceite
                      # nos BUG-20260731-OI56, BNO4 e AMOM.

- finding_id: F-test-02
  lens: cobertura
  summary: validateFragment é rigoroso no formato mira e frouxo nos formatos Studio; o fixture do repositório consagra um fragmento sem .anim-stage
  confidence: alta
  evidence:
    - "repro5.mjs: mira-studio aprova com [] ; mira reprova com 5 erros, para o mesmo fragmento"
    - "test/mira-fast-assemble.test.mjs:170-172 usa <div id=corrida-stage> sem class nem id do svg"
    - "agents/mira-fast/scripts/validate-run.mjs:162-175 contra 182-198"
  suspected_severity: medium
  signals: []
  promoted_to: BUG-20260731-AMOM
```

### Lente: concorrência e consistência

Nada a registrar. A sincronização do `roteiro.md` tem quatro guardas explícitas
(`index.html:921-933`): escrita em voo trava o poll, gravação em andamento trava o poll,
campo com foco não é sobrescrito, conteúdo idêntico aborta. O poll reancora intro e
cabeçalhos a partir do arquivo (linha 978), o que fecha a janela em que o deck regravaria
cabeçalhos velhos. A publicação do HTML é atômica com backup e restauração
(`assemble-run.mjs:260-284`) e tem teste próprio. Procurei race entre o `semear()` e o poll
e não encontrei caminho que produza perda.

### Lentes condicionais

- **Segurança**: ativada por causa do `POST /__mira_save`. Nada a registrar. A skill
  documenta trava de path traversal, restrição de extensão e limite de tamanho, e o endpoint
  serve `127.0.0.1`. Não auditei o `mira-studio-server.cjs` linha a linha; fica fora da
  cobertura desta varredura.
- **Desempenho**: `buildTriggers` instala um `MutationObserver` em `document.documentElement`
  com `subtree: true` que chama `bind()` a cada mutação (`assemble-run.mjs:120`), e as
  animações mutam o SVG continuamente. Cada disparo faz `2N` chamadas de `getElementById`.
  Não medi impacto e não registrei; anotado aqui porque quem mexer no binding por causa do
  BUG-20260731-JZNJ vai passar por essa linha.
- **Configuração e migrations**: não se aplica.
- **Observabilidade**: coberta dentro dos achados F-dados-01 e F-erro-01, os dois com o
  `montagem.log` omisso.

### Fonte auxiliar: histórico git

Alimentou o diagnóstico, não confirmou nada sozinha.

| data | commit | evento |
|---|---|---|
| 2026-07-12 | `1b63a88` | nasce a skill `mira-studio` e o template 9:16 |
| 2026-07-19 | `9956fe3` | nascem `montarSecao`, `palco` e o id `sv-slide-N` |
| 2026-07-20 | `1db13a9` | nasce o `mira-studio-full` 16:9 |
| 2026-07-26 | `5433675` | nasce o `/mira-fast`, com `formato-mira-studio.md` |
| 2026-07-29 | `558a406` | templates Studio convertidos para CRLF, sem mudança de conteúdo |

`git diff --ignore-all-space` de `558a406` sobre os dois templates vem vazio: é só quebra de
linha. Os dois montadores normalizam CRLF, então não há efeito.

## 3. Clusters

### Cluster 1: o contrato de formato do /mira-fast é uma cópia incompleta do runtime do template

Convergem: F-conf-01 (capa sem classe), F-conf-02 (full sem wrapper), F-conf-03 (viewBox
fixo), F-test-02 (validador frouxo).

Todos nascem no mesmo arquivo, `agents/mira-fast/references/formato-mira-studio.md`, escrito
em 2026-07-26 a partir de um template que já existia havia duas semanas. O contrato pegou
`camera` e `split` corretamente e errou `capa` e `full`, sempre por omissão do envoltório
que carrega o CSS. O validador não cobre nenhuma das duas omissões, então nada avisa.

Indício de que é estrutural e não descuido isolado: o contrato irmão
`formato-mira-studio-full.md`, escrito no mesmo commit, **acerta** os dois envoltórios
(`.thirds-main`, `.full-main`). O mesmo autor, no mesmo dia, foi mais fiel num arquivo que
no outro. Isso é o que se espera de transcrição manual sem verificação automática.

Ordem sugerida: corrigir o contrato e o validador juntos (VPVV, UDTY, AMOM), porque um
contrato corrigido sem validação volta a divergir na próxima mudança do template.

### Cluster 2: `<section>` como texto derruba o pipeline em três lugares

Convergem: BUG-20260731-K4NR (já registrado), F-contr-01, e a checagem de
`build-skeleton.mjs:24`.

A mesma regex ingênua aparece em três pontos independentes e em dois deles alguém já
contornou o sintoma sem tratar a causa: o handoff reescreveu comentários do template, e o
`build-skeleton.mjs` escapa `<section>` para `&lt;section&gt;` nas linhas 54 e 69. Quando o
mesmo defeito já foi contornado duas vezes por caminhos diferentes, o problema é a ausência
de um utilitário comum, não a redação de nenhum comentário.

### Cluster 3: o `roteiro.md` é fonte da verdade em uma direção e vítima na outra

Convergem: BUG-20260731-JZNJ, BUG-20260731-S3TX (já registrados), F-dados-01, F-dados-02.

O `roteiro.md` governa os slides sob HTTP e é destruído pela re-montagem. As falas que ele
carrega não têm caminho alternativo em `file://`, onde o fallback é texto de demonstração.
Nenhuma seção de spec descreve o ciclo de vida completo desse arquivo: quem escreve, quando,
com que precedência, e o que acontece numa segunda montagem. É a lacuna que explica os
quatro.

## 4. Confirmação dos bugs já registrados

Reproduzi os quatro nesta varredura, o que muda a base de evidência de leitura de código
para execução:

| bug | como confirmei |
|---|---|
| BUG-20260731-OI56 | `repro.mjs`: o template cru reprova em 10 checagens, incluindo os seis marcadores, `@MIRA:THEME` e `@MIRA:RESPONSIVE` |
| BUG-20260731-K4NR | `repro3.mjs` EXP 2: `esqueleto contém <section> fora do slot de slides` |
| BUG-20260731-JZNJ | `parse-test.mjs`: `stageId` procurados = `[hub-central-stage, fluxo-vertical-stage]`; sobrevivem à reconstrução = `[false, false]` |
| BUG-20260731-S3TX | não reproduzido em execução. Continua baseado em leitura de código, como o bug declara. O deck desta varredura é 9:16; montar um 16:9 exigiria outro esqueleto |

Correção de rumo em relação ao registro anterior: a checagem
`esqueleto sem balanceamento de título da capa` **passa** no template real, porque as linhas
55 e 56 já trazem a regra. O handoff não a listava e eu não a havia verificado.

## 5. O que NÃO foi coberto

Sem truncamento silencioso; isto é o que ficou de fora e por quê.

- **Nenhuma renderização em navegador.** Não há Chrome nem biblioteca de DOM neste ambiente
  (`jsdom`, `linkedom` e `happy-dom` ausentes). Toda afirmação sobre layout visual
  (padding perdido, palco colapsado) vem do CSS e está marcada como tal nos bugs. As
  afirmações sobre estrutura do DOM vêm de execução do código do próprio deck.
- **`mira-studio-full` não foi montado.** O deck da varredura é 9:16. O BUG-20260731-S3TX
  continua sem reprodução em execução, e não sei se o formato 16:9 tem equivalentes de
  F-conf-01 e F-conf-02.
- **`mira-studio-server.cjs` não foi auditado.** O `POST /__mira_save` grava arquivo no disco
  a pedido do navegador. As travas estão documentadas na skill, não verificadas por mim.
- **Fase 1 e Fase 2 não foram exercitadas.** São agentes; escrevi o plano e os fragmentos à
  mão, seguindo os contratos. Achados sobre o que os agentes de fato produzem exigiriam uma
  execução real do `/mira-fast`.
- **`mira-vertical` e `mira` ficaram fora do escopo**, exceto como base de comparação do
  validador.
- **Lente de configuração e migrations não ativada**: a feature não tem ambiente, flag nem
  migração.

## 6. Resumo

11 achados. 7 promovidos a bug, 4 mantidos como observação.

| achado | confiança | bug |
|---|---|---|
| F-conf-01 capa sem classe | alta | BUG-20260731-VPVV |
| F-conf-02 full sem wrapper | alta | BUG-20260731-UDTY |
| F-conf-03 viewBox fixo | média | observação |
| F-dados-01 roteiro.md sobrescrito | alta | BUG-20260731-JJ6X |
| F-dados-02 falas de demonstração | alta | BUG-20260731-RNYU |
| F-dados-03 localStorage sem escopo | média | observação |
| F-contr-01 contagem conta comentário | alta | BUG-20260731-BNO4 |
| F-erro-01 deck meio instalado | alta | BUG-20260731-ETPU |
| F-erro-02 status de folha ausente | alta | observação |
| F-test-01 teste não usa template real | alta | observação, virou critério de aceite |
| F-test-02 validador Studio frouxo | alta | BUG-20260731-AMOM |
