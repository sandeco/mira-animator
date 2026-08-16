---
schema_version: 1
id: BUG-20260815-HYRG
display_number: 17
title: Áudio e vídeo saem com deslocamento constante no MP4 porque cada trilha é zerada no próprio primeiro quadro
status: active
phase: delivering
severity: high
priority: P1
created: 2026-08-15
updated: 2026-08-16

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-contradita
  - paridade-de-formato
  - audio
  - sincronia-av

visibility: normal
security_suspected: false

reproduction:
  classification: intermittent
  rate: "\"quase em todas as gravações\", segundo o autor; NÃO reproduzido nem medido pelo registrador"
  suspected_triggers:
    - "gravação nativa pelo painel do deck (tecla R) com microfone ligado"
    - "independe da chave CFR: o zeramento por trilha existe nas duas versões do gravador"
    - "possivelmente sensível à latência de inicialização do microfone e da captura de tela, que são abertos em awaits consecutivos"

blocking: []

relationships:
  - bug: BUG-20260815-TW4D
    type: related-to
    state: proposed
    evidence:
      - ref: "evidence/as-duas-trilhas-sao-zeradas-separadamente.md"
        observation: >-
          mesmos dois arquivos e mesma trilha de áudio do gravador nativo, relatados na
          mesma sessão. A relação é de vizinhança no código, não de causa: o mono nasce nas
          constraints do getUserMedia e o deslocamento nasce no zeramento por trilha do
          muxer. Fica proposed até que alguém mostre que uma correção mexe na outra.

traceability:
  specs:
    - "agents/mira-studio/SKILL.md#82"
    - "agents/mira-studio-full/SKILL.md#137"
  affected_code:
    - "templates/authoring/mira-record.js:1035"
    - "templates/authoring/mira-record.js:1121-1124"
    - "templates/authoring/mira-record.js:1240-1258"
    - "templates/authoring/mira-record.js:1450-1457"
    - "templates/authoring/mira-record.js:1028-1034"
    - "templates/authoring/mira-record-16x9.js:1180"
    - "templates/authoring/mira-record-16x9.js:1266-1269"
    - "templates/authoring/mira-record-16x9.js:1596-1601"
  root_cause:
    state: confirmed
    nota_de_medicao: >-
      DUAS MEDICOES em 2026-08-16, mesma maquina (RTX 4070), diagnostico JSON do autor:
        gravacao 20:07 -> av.deltaMs = -1.128
        gravacao 20:12 -> av.deltaMs = -30.358
      A hipotese se confirma e ganha precisao: a distancia entre as duas ancoras VARIA de
      gravacao para gravacao, exatamente como a latencia de inicializacao dos dois pipelines
      previa. Em uma gravacao ela e irrelevante (1 ms); na outra passa do limiar em que a
      dessincronia labial e perceptivel (~20 ms). O zeramento por trilha descarta essa
      distancia, seja ela qual for.
      Uma coisa muda em relacao ao registro original: as duas ancoras estao na MESMA base de
      relogio (firstVideoUs 290846800 e firstAudioUs 290845672, ambas ~290,8 s de uptime).
      O comentario do codigo sobre "origens de relogio diferentes" NAO vale para esta
      maquina, e isso torna cross-track-offset uma correcao viavel, o que o registro original
      dava como perigoso.
      audioDropped = 0 nas duas: descarte de pacote de audio esta excluido como causa.
    hypothesis: >-
      As duas trilhas são zeradas separadamente. O vídeo ancora no primeiro VideoFrame
      (slotT0) e o áudio ancora no próprio primeiro AudioData, porque o muxer roda com
      firstTimestampBehavior 'offset', que subtrai de cada trilha o primeiro timestamp DAQUELA
      trilha. A distância real entre o início das duas capturas é descartada e reaparece no
      arquivo como deslocamento fixo. As capturas são abertas em awaits consecutivos, com
      pipelines independentes, então essa distância não é zero.
    causal_path:
      - "o painel abre o microfone num await e a captura de tela no await seguinte"
      - "cada pipeline tem latência de inicialização própria; o áudio começa a produzir antes"
      - "no Worker, encodeFrameCFR fixa slotT0 no primeiro VideoFrame e o PTS do vídeo passa a contar dali"
      - "o AudioData vai ao encoder com o timestamp nativo intocado"
      - "o muxer, com firstTimestampBehavior 'offset', subtrai de cada trilha o primeiro timestamp dela mesma"
      - "a distância entre as duas origens some do arquivo e vira deslocamento constante entre as trilhas"
    evidence:
      - ref: "evidence/mp4-muxer-confirma-offset-por-trilha.md"
        observation: >-
          código do mp4-muxer vendorado: 'offset' usa track.firstDecodeTimestamp (a própria
          trilha) e 'cross-track-offset' usa Math.min entre vídeo e áudio. Todas as cópias
          vendoradas têm o mesmo md5, então não há divergência de versão
      - ref: "evidence/as-duas-trilhas-sao-zeradas-separadamente.md"
        observation: >-
          âncoras lidas linha a linha nos dois gravadores, e git show c7a3222^ mostra o
          'offset' já presente antes da correção do CFR, o que exclui regressão
      - ref: "evidence/reproduction.md"
        observation: >-
          NÃO reproduzido e NÃO medido: nenhuma claquete foi gravada. O mecanismo ser legível
          não prova que ele produz o deslocamento de milissegundos relatado, e é por isso que
          o estado é supported e não confirmed
    code_refs:
      - file: "templates/authoring/mira-record.js"
        symbol: "recordWorkerBody · encodeFrameCFR (slotT0) + Mp4Muxer.Muxer (firstTimestampBehavior)"
        commit: "f564470"
      - file: "templates/authoring/mira-record-16x9.js"
        symbol: "recordWorkerBody · idem"
        commit: "f564470"
  reproduction_tests:
    - "test/mira-record-sync.test.mjs::HYRG · o diagnóstico publica a distância medida entre as âncoras das duas trilhas"
    - "test/mira-record-sync.test.mjs::HYRG · sem microfone, o instrumento não inventa medição"
  regression_tests:
    - "test/mira-record-sync.test.mjs::HYRG · o muxer roda com firstTimestampBehavior 'offset' (zeramento POR TRILHA)"
    - "test/mira-record-sync.test.mjs::HYRG · a trilha de áudio entra no muxer com o timestamp NATIVO, não rebaseado"


regression_analysis:
  last_known_good: null
  first_known_bad: null
  culprit_commit: null
  nota: >-
    NÃO é regressão. O zeramento por trilha (firstTimestampBehavior 'offset') já existia
    antes de c7a3222, confirmado por git show c7a3222^ nas linhas 945 e 1090 dos dois
    gravadores. O defeito é anterior às duas correções de relógio e sobreviveu às duas.

spec_verdict: spec-desatualizada

change_set:
  - id: CHG-001
    kind: code
    artifact: "templates/authoring/mira-record.js"
    purpose: instrumento de medicao (mic settings + ancoras A/V) no painel e no diagnostico
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: "templates/authoring/mira-record-16x9.js"
    purpose: idem, identico
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: test
    artifact: "test/mira-record-sync.test.mjs"
    diff: fix/CHG-003.diff

  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260815-HYRG-v001.md + os dois SKILL.md"
    purpose: corrige a afirmacao falsa sobre o offset inicial e fixa o contrato de alinhamento
    diff: fix/CHG-004.diff

change_risk: media

addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260815-HYRG-v001.md"

delivery:
  branch: main
  base_commit: f564470
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Áudio e vídeo saem com deslocamento constante no MP4 porque cada trilha é zerada no próprio primeiro quadro

## Summary

A gravação nativa produz um MP4 em que a trilha de áudio e a de vídeo têm um deslocamento
fixo entre si, da ordem de milissegundos, perceptível para quem sabe olhar. É constante do
começo ao fim do clipe, não cresce com a duração.

O vídeo é ancorado no primeiro `VideoFrame` (`slotT0 = ts`) e o áudio é ancorado no próprio
primeiro `AudioData` (`firstTimestampBehavior: 'offset'`, que é offset **por trilha** no
`mp4-muxer`). As duas trilhas são zeradas separadamente, então a distância real entre o
início de uma captura e o da outra é descartada por construção e reaparece no arquivo como
deslocamento fixo.

Não há nada no código que **meça** esse desvio.

## Expected Behavior

Diferente dos outros bugs deste contexto, aqui **existe** uma afirmação escrita sobre o
comportamento esperado, e ela diz que o problema não existe.

`agents/mira-studio/SKILL.md:82`:

> Isso é DIFERENTE do offset inicial de A/V, que já é resolvido pelo
> `firstTimestampBehavior: 'offset'` e continua como está.

`agents/mira-studio-full/SKILL.md:137` documenta a mesma chave CFR com o mesmo recorte
(progressivo), e o commit `c7a3222` repete a afirmação na mensagem.

O comportamento esperado, portanto, é o que está escrito: **o MP4 sai com áudio e vídeo
alinhados, e o alinhamento inicial é responsabilidade do muxer.** O relato do autor diz que
não é o que acontece.

Por isso o label é `spec-contradita`, e não `spec-gap`: não falta documentação, existe
documentação afirmando que está resolvido. Se a afirmação for falsa, o veredito do fix
tende a `spec-desatualizada`, mas a decisão é humana e não é deste registro.

Fica em aberto para o fix o alvo numérico: qual desvio A/V é aceitável no arquivo entregue.
Sem esse número não há critério de aceite mensurável.

## Actual Behavior

Relato do autor: "quase em todas as gravações o áudio e vídeo não estão sincronizados. É por
milissegundos, mas um olho treinado consegue perceber o erro". Perguntado se é constante ou
crescente, respondeu **igual do começo ao fim**.

O caminho no código, detalhado em
`evidence/as-duas-trilhas-sao-zeradas-separadamente.md`:

1. **Vídeo** (`mira-record.js:1121-1124`): `if (slotT0 < 0) slotT0 = ts;` fixa a âncora no
   primeiro frame de vídeo, e o PTS gravado é o do slot da grade a partir dali. No modo VFR
   o efeito é o mesmo por outro caminho, porque o muxer zera a trilha no primeiro timestamp.
2. **Áudio** (`mira-record.js:1240-1258`): o `AudioData` vai ao encoder com o timestamp
   nativo intocado; quem zera é o muxer.
3. **Muxer** (`mira-record.js:1035`): `firstTimestampBehavior: 'offset'`, que no `mp4-muxer`
   subtrai de cada trilha o próprio primeiro timestamp.

O resultado é que a distância real entre as duas capturas nunca chega ao arquivo.

E há motivo para essa distância não ser zero: em `mira-record.js:1450-1457` o microfone é
aberto num `await` e a captura de tela em outro, logo depois. São pipelines independentes,
cada um com a própria latência de inicialização, e o áudio começa antes.

O comentário em `:1028-1034` reconhece as duas origens de relógio e conclui que "os dois
processors nascem juntos no start, então o desvio A/V do offset por track é <= 1 frame".
Duas ressalvas registradas: os processors nascerem juntos não implica que os primeiros
quadros correspondam ao mesmo instante, porque as *tracks* foram abertas em momentos
diferentes; e um frame a 30 fps são 33 ms, acima do limiar em que a dessincronia labial
começa a incomodar. A conclusão nunca foi verificada contra um arquivo real.

## Steps to Reproduce

1. Abrir um deck Studio pelo launcher, com microfone ligado no painel.
2. Gravar com a tecla **R** uma claquete: um estalo audível junto de um gesto visível e
   nítido (bater as mãos na frente da câmera serve).
3. Parar, abrir o MP4 num editor que mostre a forma de onda quadro a quadro.
4. Medir a distância entre o quadro do impacto visual e o pico do estalo no áudio.
5. Repetir com um clipe longo (vários minutos) e medir a claquete no início **e** outra no
   fim: se as duas medidas derem o mesmo número, o deslocamento é constante e é este bug; se
   a segunda for maior, há também deriva acumulada, que é o defeito do CFR.
6. Repetir nos dois formatos, `mira-studio` (9:16) e `mira-studio-full` (16:9).

**O registrador não executou nenhum destes passos.** Nenhuma gravação foi feita e nenhum MP4
foi medido. O bug está descrito a partir do relato do autor mais a leitura estática do
caminho de relógio das duas trilhas.

## Evidence

- `evidence/as-duas-trilhas-sao-zeradas-separadamente.md` — o caminho de relógio das duas
  trilhas linha a linha, o histórico das duas correções anteriores, e por que nenhuma delas
  cobre deslocamento constante.
- `../../intake/relato-20260815-1716.md` — relato bruto e as respostas do autor.

Nenhum MP4 e nenhuma medição de claquete foram anexados. **É a evidência que falta**, e sem
ela não se sabe o sinal do deslocamento (áudio adiantado ou atrasado) nem sua estabilidade
entre gravações.

## Suspected Area

O par âncora-de-vídeo + `firstTimestampBehavior`, nos dois gravadores.

Três coisas que o fix precisa saber antes de escolher a estratégia:

1. **`'cross-track-offset'` não é a saída.** Já foi usado e produziu o commit `6e84363`
   (vídeo congelado no 1º frame, duração absurda), porque as origens de relógio são
   incomparáveis: o `AudioData` do microfone começa perto de zero e o `VideoFrame` da
   captura de tela vem no relógio de uptime. Trocar a constante de volta reintroduz um
   defeito pior que o atual.
2. **A correção exige uma referência de tempo comum às duas capturas**, medida e aplicada
   explicitamente no mux, em vez de deixar cada trilha se zerar sozinha. Obter essa
   referência de dentro do Worker é o problema técnico central deste bug.
3. **Medir antes de corrigir.** Sem o número da claquete não há como validar correção
   nenhuma, e há risco real de "corrigir" trocando um deslocamento por outro sem ninguém
   perceber, que foi o que aconteceu com a afirmação em `SKILL.md:82`.

## Acceptance Criteria

1. Existe um número declarado de desvio A/V aceitável no arquivo entregue, decidido pelo
   autor, e o critério seguinte é medido contra ele.
2. Medição por claquete num MP4 real gravado pela tecla R fica dentro desse alvo, no
   `mira-studio` (9:16) e no `mira-studio-full` (16:9).
3. A medição é feita no **início e no fim** de um clipe longo, para separar deslocamento
   constante de deriva acumulada e provar que a correção não introduziu a segunda.
4. O desvio A/V medido passa a aparecer no diagnóstico do painel, ao lado de `dupFilled`,
   `dupDropped` e `gapJumped`. Hoje a afirmação de "≤ 1 frame" não é verificável por quem
   grava, e é assim que ela sobreviveu errada por tanto tempo.
5. A correção **não** reintroduz o defeito do `6e84363`: duração do MP4 correta e vídeo não
   congelado no primeiro frame, verificado por `ffprobe`.
6. A grade CFR continua íntegra: `test/mira-record-cfr.test.mjs` segue com 18/18.
7. O caminho de fallback (`MediaRecorder`) recebe o mesmo tratamento ou tem seu
   comportamento declarado explicitamente.
8. A afirmação de `agents/mira-studio/SKILL.md:82` e o texto equivalente do
   `mira-studio-full` são corrigidos, e o adendo de spec registra qual é o contrato real de
   alinhamento entre as trilhas.
9. Teste de regressão automatizado cobre a montagem dos timestamps das duas trilhas, no
   estilo de `test/mira-record-cfr.test.mjs`, que roda o Worker de verdade com stubs.

## Traceability

| Eixo | Referência |
|---|---|
| Comportamento documentado (contraditado) | `agents/mira-studio/SKILL.md:82`, `agents/mira-studio-full/SKILL.md:137` |
| Âncora do vídeo | `mira-record.js:1121-1124`, `mira-record-16x9.js:1266-1269` |
| Âncora do áudio | `mira-record.js:1035`, `mira-record-16x9.js:1180` |
| Bombeamento do áudio | `mira-record.js:1240-1258` |
| Abertura das duas capturas | `mira-record.js:1450-1457`, `mira-record-16x9.js:1596-1601` |
| Premissa não verificada | `mira-record.js:1028-1034` ("desvio A/V <= 1 frame") |
| Correções anteriores | `6e84363` (cross-track), `c7a3222` (grade CFR) |
| Causa raiz | não preenchida; é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum (a suíte do CFR, 18/18, cobre outro defeito) |

## Resolution

Corrigido em 2026-08-16. **Não fechado**: a closure policy é `package` e exige merge e versão
publicada. Estado atual `active` / `delivering`.

### O que a medição mudou no diagnóstico

O bug foi registrado a partir de leitura de código. Duas gravações reais do autor, com o
instrumento da volta 1 já aplicado, mudaram três coisas:

| | registrado | medido |
|---|---|---|
| distância entre as âncoras | "não é zero" | **-1,1 ms** numa gravação, **-30,4 ms** na seguinte |
| bases de relógio | "diferentes", conforme o comentário do código | **a mesma** (ambas ~290,8 s de uptime) |
| descarte de áudio | suspeita aberta | `audioDropped: 0`, excluído |

A hipótese central se confirmou **e ganhou precisão**: a distância varia de gravação para
gravação, exatamente como a latência de inicialização dos dois pipelines previa. Numa ela é
irrelevante, na outra passa do limiar de percepção.

Registro honesto do caminho: depois da primeira medição (-1,1 ms) eu dei a causa por
**refutada** e escrevi isso aqui. A segunda medição (-30,4 ms) mostrou que eu tinha desistido
cedo, com uma amostra só. Uma medição não refuta um mecanismo variável.

### A armadilha que quase levou à correção errada

Com as duas âncoras na mesma base, a correção "óbvia" era trocar a constante do muxer para
`'cross-track-offset'`. **Teria reproduzido o commit `6e84363`.**

O motivo está num arquivo diferente daquele onde a constante mora: a grade CFR **já rebaseia
o vídeo em zero** antes do muxer. Então `Math.min(0, ~290 s) = 0`, o muxer subtrai zero e o
áudio fica na marca nativa dele, minutos adiante. Vídeo congelado no primeiro frame, duração
absurda: a descrição exata daquele commit.

Nenhuma das duas constantes resolve sozinha. `'offset'` destrói o alinhamento,
`'cross-track-offset'` destrói o arquivo.

### Causa raiz (confirmed)

O alinhamento entre as trilhas nunca foi responsabilidade de ninguém. O vídeo chega ao muxer
rebaseado em zero pela grade CFR, o áudio chega no relógio nativo, e
`firstTimestampBehavior: 'offset'` zera cada um na própria origem, descartando a distância
entre eles.

### O que mudou

`mandaAoMux()`, caminho único dos chunks para o muxer, nos dois gravadores
([CHG-001](fix/CHG-001.diff), [CHG-002](fix/CHG-002.diff)):

1. **Basing explícito.** `origemComum = min(primeiroVideoUs, primeiroAudioUs)`; vídeo
   deslocado de `primeiroVideoUs - origemComum`, áudio de `-origemComum`. A distância real
   sobrevive.
2. **`'cross-track-offset'` como rede**, não como mecanismo: com o basing certo ele subtrai
   zero.
3. **Porta de espera.** Enquanto as duas âncoras não são conhecidas, os chunks ficam numa
   fila. Medido: 1 a 30 ms. Teto de 240 chunks contra vazamento.
4. **Guarda dos relógios.** Distância acima de 5 s significa bases incomparáveis: volta ao
   comportamento antigo e registra `av-relogios` como falha visível, em vez de entregar
   arquivo torto calado.
5. **Pré-roll descartado.** Áudio anterior ao primeiro quadro não tem imagem para acompanhar.

### Prova vermelho para verde

```
antes  x a distância entre as duas capturas sobrevive no arquivo
       x o muxer não pode voltar a zerar cada trilha sozinho
       x relógios em bases incomparáveis não recebem alinhamento inventado
       v a grade de vídeo continua regular depois do alinhamento

depois v os quatro, nos dois gravadores
```

Suíte completa: **257 testes, 257 passando, 0 falhas.** `mira-record-cfr.test.mjs` segue
18/18: o alinhamento não tocou na grade.

### Veredito de spec: `spec-desatualizada`

Havia documentação, e ela afirmava que o problema estava resolvido. Adendo aditivo em
`_reversa_sdd/addenda/bug-BUG-20260815-HYRG-v001.md` (R9a a R9g), e o texto errado corrigido
nos dois SKILL.md ([CHG-004](fix/CHG-004.diff)). A spec original não foi tocada.

**O veredito é recomendação do agente e está sujeito a veto do autor.**

### O que continua aberto

- **A captura entrega metade dos quadros** (`worker.frames` 330 de 551). Registrado como
  BUG-20260816-FJAU, não atacado nesta sessão.
- **O áudio termina antes do vídeo** (0,66 s numa gravação, 0,13 s e 0,08 s nas seguintes),
  com `audioDropped: 0`. Provavelmente a cauda perdida no `stop`, **não investigado**. Se
  aparecer de novo depois desta correção, precisa de bug próprio.
- **Nenhuma medição de claquete foi feita.** A correção é validada por teste automatizado e
  pelos números do instrumento, não por um arquivo medido quadro a quadro num editor. Esse
  é o critério de aceite 2 do bug e continua pendente do autor.

## Agent Notes

- **Não é regressão e não reabre nada.** O commit `c7a3222` corrigiu deriva progressiva por
  VFR, e a suíte dele passa 18/18 hoje. Este bug é sobre deslocamento constante, que aquele
  commit declarou fora de escopo por acreditar que já estava resolvido. Não registrar como
  `regression-of`: nada que funcionava parou de funcionar.
- **A chave CFR não é decisiva aqui.** `git show c7a3222^` mostra `firstTimestampBehavior:
  'offset'` já presente nos dois gravadores, linhas 945 e 1090. Deck com cópia velha e deck
  com cópia atual têm o mesmo deslocamento constante. O autor não soube dizer se o painel
  dele tem a chave, e para este bug isso não muda a classificação.
- **Mas confira as cópias mesmo assim.** Nenhum deck no disco tem o gravador pós-CFR
  (`grep -c mrc-cfr` devolve 0 em `decks/vasco-da-gama/`, `decks/vasco-da-gama-plus-teste/` e
  no exemplo do Studio). Se aparecer deriva progressiva além do deslocamento constante, a
  causa é essa, e a solução é `npx mira-animator edit <deck>`, não código novo.
- **Cuidado com a correção que parece funcionar.** Foi exatamente assim que a afirmação de
  `SKILL.md:82` passou: uma troca de constante, um raciocínio plausível sobre relógios e
  nenhuma medição do arquivo final. Qualquer estratégia aqui precisa de número medido antes
  e depois, no mesmo setup.
- **O `audioDropped` é um segundo caminho, não investigado.** `mira-record.js:1247-1249`
  descarta `AudioData` quando `encodeQueueSize >= 40`. Descarte de pacote com timestamp
  preservado abre buraco, não desloca, mas o efeito no arquivo final não foi verificado e o
  contador não aparece no painel ao vivo. Se a claquete mostrar deslocamento variável entre
  gravações, olhar aqui também.
- **Relação com o TW4D fica `proposed`.** Mesmos dois arquivos e mesma trilha, mas causas
  diferentes: o mono nasce nas constraints do `getUserMedia`, o deslocamento nasce no
  zeramento por trilha. Se o fix mostrar que uma correção mexe na outra, promova a aresta
  com evidência.
- **Proposta de taxonomia** (as listas de `taxonomy.yaml` continuam vazias):
  `area: gravacao-de-video`, `module: templates-studio`, `feature: sincronia-audio-video`.
