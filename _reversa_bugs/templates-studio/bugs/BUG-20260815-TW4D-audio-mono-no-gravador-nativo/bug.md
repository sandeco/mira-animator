---
schema_version: 1
id: BUG-20260815-TW4D
display_number: 16
title: A gravação nativa do mira-studio e do mira-studio-full grava o áudio sempre em mono, sem opção de stereo
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
  - spec-gap
  - paridade-de-formato
  - audio

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "relatado pelo autor nos dois formatos; NÃO reproduzido pelo registrador (nenhuma gravação executada)"
  suspected_triggers:
    - "gravação nativa pelo painel do deck (tecla R), não OBS"
    - "microfone aberto com as constraints default do Chrome (echoCancellation/noiseSuppression/autoGainControl ligados)"

blocking: []

relationships: []

traceability:
  specs: []
  affected_code:
    - "templates/authoring/mira-record.js:1451"
    - "templates/authoring/mira-record.js:1556-1567"
    - "templates/authoring/mira-record.js:1024"
    - "templates/authoring/mira-record.js:1719"
    - "templates/authoring/mira-record.js:1767"
    - "templates/authoring/mira-record-16x9.js:330-335"
    - "templates/authoring/mira-record-16x9.js:1703-1714"
    - "templates/authoring/mira-record-16x9.js:1169"
  root_cause:
    state: confirmed
    confirmado_por: >-
      MEDICAO de 2026-08-16 (diagnostico JSON do autor): mic.channelCount = 1 com
      echoCancellation, noiseSuppression e autoGainControl TODOS true. E ffprobe no MP4
      gravado: channels = 1. A track chega mono com a cadeia de voz do Chrome ligada,
      exatamente como a hipotese previa. Falta so saber se o dispositivo e mono de fabrica,
      o que decide entre a estrategia (b) e a (c) do plano.
    hypothesis: >-
      O número de canais nunca é pedido. As três chamadas de getUserMedia passam apenas
      `audio: true` (ou um deviceId), sem `channelCount` e sem desligar a cadeia de
      processamento de voz do Chrome, que opera em mono. A track chega com channelCount 1 e
      `numberOfChannels: ms.channelCount || 1` copia esse 1 para o AudioEncoder; o muxer
      apenas repete. O `|| 1` é, além disso, um default mono explícito.
    causal_path:
      - "o painel abre o microfone com getUserMedia({ audio: true }), sem constraint de canais"
      - "o Chrome aplica os defaults, com echoCancellation/noiseSuppression/autoGainControl ligados"
      - "essa cadeia opera em 1 canal e a track entrega channelCount 1"
      - "startWorkerPipeline lê micTrack.getSettings() e monta numberOfChannels: ms.channelCount || 1"
      - "o AudioEncoder é configurado em 1 canal (mp4a.40.2, 128 kbps)"
      - "o muxer declara a trilha AAC com o mesmo numberOfChannels"
      - "o MP4 entregue tem trilha de 1 canal"
    evidence:
      - ref: "evidence/analise-do-caminho-de-audio.md"
        observation: >-
          caminho lido linha a linha nos dois gravadores, idêntico nos dois: nenhuma das três
          chamadas de getUserMedia pede canais, e o `|| 1` fecha o caminho em mono
      - ref: "evidence/reproduction.md"
        observation: >-
          NÃO reproduzido: o valor real de micTrack.getSettings().channelCount na máquina do
          autor é desconhecido. É por isso que o estado é supported e não confirmed
    code_refs:
      - file: "templates/authoring/mira-record.js"
        symbol: "startWorkerPipeline · audioCfg"
        commit: "f564470"
      - file: "templates/authoring/mira-record-16x9.js"
        symbol: "getMic / startWorkerPipeline · audioCfg"
        commit: "f564470"
  reproduction_tests:
    - "test/mira-record-audio.test.mjs::TW4D · o diagnóstico publica o que o microfone realmente entregou"
  regression_tests:
    - "test/mira-record-audio.test.mjs::TW4D · hoje o número de canais é copiado da track, com default mono"


spec_verdict: spec-gap

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
    artifact: "test/mira-record-audio.test.mjs"
    diff: fix/CHG-003.diff

  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260815-TW4D-v001.md"
    purpose: especifica a trilha de audio pela primeira vez (R10a a R10g)

change_risk: media

addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260815-TW4D-v001.md"

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

# A gravação nativa do mira-studio e do mira-studio-full grava o áudio sempre em mono, sem opção de stereo

## Summary

Os dois gravadores nativos do Studio (`mira-record.js` no 9:16, `mira-record-16x9.js` no
16:9) abrem o microfone com `getUserMedia({ audio: true })`, sem pedir número de canais, e
depois copiam para o `AudioEncoder` o que a track reportar, com `numberOfChannels:
ms.channelCount || 1`. Como o Chrome, com a cadeia de processamento de voz ligada por
default, entrega uma track de **1 canal**, o AAC nasce mono e o MP4 declara a trilha mono.

O caminho é idêntico nos dois arquivos, e não há nenhum ponto entre o microfone e o arquivo
onde 2 canais possam aparecer. O painel de gravação também não oferece escolha de canais.

O autor quer stereo.

## Expected Behavior

**Não há spec.** `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md` tem a seção 10
("Gravação direta no disco (sem teto de memória)") e não menciona áudio, microfone, canais
nem AAC em nenhuma linha. `agents/mira-studio/SKILL.md` e
`agents/mira-studio-full/SKILL.md` descrevem o gravador (resolução, bitrate, CFR, Element
Capture, seletor de GPU) e também não dizem nada sobre a trilha de áudio. Nenhum checklist
de conformidade cobra o número de canais.

Por isso o bug carrega `spec-gap`: o número de canais nunca foi decidido, foi **herdado**
do default do Chrome.

O comportamento desejado, declarado pelo autor neste relato: o MP4 gravado deve ter trilha
de áudio em **2 canais (stereo)**.

Fica aberta para o veredito de spec do fix a pergunta que este registro não decide: se
stereo deve ser o padrão, ou uma opção no painel ao lado das chaves que já existem. Ela
importa porque conseguir 2 canais reais exige mexer nas constraints de captação, o que tem
efeito colateral audível (ver Suspected Area).

## Actual Behavior

Nos dois gravadores, em ambos os caminhos de codificação:

1. `getUserMedia({ audio: true, video: false })` sem `channelCount` e sem desligar o
   processamento de voz. A track chega com `channelCount: 1`.
2. `numberOfChannels: ms.channelCount || 1` copia esse 1 para a config do `AudioEncoder`
   (`codec: 'mp4a.40.2'`, `bitrate: 128000`). O `|| 1` é, além disso, um default mono
   explícito para o caso de a track não reportar nada.
3. O muxer declara a trilha AAC com o mesmo `numberOfChannels`.

No fallback `MediaRecorder` (Chrome sem WebCodecs/TrackProcessor) não há `AudioEncoder`: a
track mono é gravada como veio, com o mesmo resultado.

Detalhamento com trechos e números de linha em
`evidence/analise-do-caminho-de-audio.md`.

## Steps to Reproduce

1. Abrir um deck do formato `mira-studio` pelo launcher (`mira-studio-windows.bat`), em
   `http://localhost:<porta>`.
2. No painel de gravação, deixar o microfone ligado.
3. Gravar com a tecla **R**, falar alguns segundos, parar.
4. Abrir o MP4 gerado num editor ou rodar `ffprobe` sobre ele: a trilha de áudio é AAC de
   **1 canal**.
5. Repetir num deck `mira-studio-full` (16:9), que usa `mira-record-16x9.js`: mesmo
   resultado.

**O registrador não executou estes passos.** O bug foi registrado a partir do relato do
autor mais a leitura estática do caminho de áudio. A reprodução, com `ffprobe` sobre um MP4
real e a leitura de `micTrack.getSettings()` no Chrome do autor, é o primeiro trabalho do
`/reversa-debugger-fix`, e é ela que vai dizer se a track chega mono por causa do
processamento de voz ou por causa do próprio dispositivo.

## Evidence

- `evidence/analise-do-caminho-de-audio.md` — o caminho de áudio dos dois gravadores linha a
  linha, com os trechos exatos, na árvore de trabalho com os dois arquivos sem alterações
  locais.
- `../../intake/relato-20260815-1716.md` — relato bruto e as respostas do autor sobre
  gravador e severidade.

Nenhum MP4 de exemplo foi anexado. Um arquivo gravado pelo autor, com a saída do `ffprobe`,
seria a evidência empírica que falta.

## Suspected Area

`templates/authoring/mira-record.js` e `templates/authoring/mira-record-16x9.js`, no trecho
entre a abertura do microfone e a configuração do `AudioEncoder`.

**A correção não é trocar `|| 1` por `|| 2`.** Isso configuraria o encoder para 2 canais
enquanto a track continua entregando `AudioData` de 1 canal, trocando o defeito de lugar. O
ponto que decide o número de canais é o `getUserMedia`, e mexer nele tem consequência real:

- Pedir `channelCount: 2` sozinho costuma ser ignorado enquanto `echoCancellation`,
  `noiseSuppression` e `autoGainControl` estiverem ligados, porque essa cadeia opera em
  mono.
- Desligar essa cadeia para conseguir 2 canais muda a qualidade do áudio captado, e num
  setup de gravação com caixas abertas pode reintroduzir eco. É decisão do autor, não do
  código.
- Um microfone mono (a maioria dos microfones de mesa e de webcam) não vira stereo por
  constraint. Se o dispositivo do autor for mono, o stereo real só sai duplicando o canal
  na saída, que é outra coisa, e precisa ser decidido explicitamente em vez de acontecer por
  acidente.

O fix precisa medir o que o dispositivo do autor entrega antes de escolher a estratégia.

## Acceptance Criteria

1. Um MP4 gravado pela tecla R num deck `mira-studio` tem trilha de áudio com 2 canais,
   verificável por `ffprobe`.
2. O mesmo vale para `mira-studio-full` (`mira-record-16x9.js`), com o mesmo mecanismo, sem
   divergir entre os dois formatos.
3. Com microfone que só entrega 1 canal, a gravação **não falha nem fica sem áudio**: o
   comportamento nesse caso é declarado explicitamente e informado na UI, em vez de
   degradar em silêncio.
4. Se a correção alterar as constraints de captação (`echoCancellation`,
   `noiseSuppression`, `autoGainControl`), a mudança é aprovada pelo autor antes de ser
   aplicada, porque muda o som do que ele grava.
5. O caminho de fallback (`MediaRecorder`, Chrome sem WebCodecs) recebe o mesmo tratamento
   ou informa que não suporta, sem entregar arquivo com cara de normal.
6. O veredito de spec vira adendo que fixa o número de canais para os **dois** formatos, e
   o item correspondente entra nos checklists de conformidade dos dois SKILL.md.
7. Teste de regressão cobre a config passada ao `AudioEncoder` e ao muxer, no estilo dos
   testes existentes em `test/`.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | nenhuma (`spec-gap`): nem `SPEC.md` seção 10 nem os dois SKILL.md mencionam áudio ou canais |
| Código afetado (9:16) | `templates/authoring/mira-record.js` (1451, 1556-1567, 1024, 1719, 1767) |
| Código afetado (16:9) | `templates/authoring/mira-record-16x9.js` (330-335, 1703-1714, 1169) |
| Propagação para decks | `lib/commands/edit.js:79` (`npx mira-animator edit <deck>`) |
| Causa raiz | não preenchida; é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

Corrigido em 2026-08-16. **Não fechado**: closure policy `package`. Estado `active` /
`delivering`.

### Causa raiz (confirmed pela medição)

Diagnóstico JSON da máquina do autor:

```json
"mic": { "channelCount": 1, "sampleRate": 48000,
         "echoCancellation": true, "noiseSuppression": true, "autoGainControl": true }
```

E `ffprobe` no MP4 gravado antes da correção: `channels=1`.

A track chega mono com a cadeia de voz do Chrome inteira ligada, exatamente como a hipótese
previa, e o `numberOfChannels: ms.channelCount || 1` copiava esse 1 até o arquivo.

### O que mudou

[CHG-001](fix/CHG-001.diff) e [CHG-002](fix/CHG-002.diff), idênticos nos dois gravadores:

1. **Pede 2 canais como `ideal`, nunca `exact`.** `exact` faria o `getUserMedia` falhar em
   microfone mono e a gravação sairia **sem áudio nenhum**, que é pior que o defeito.
2. **`paraStereo()`**: se a track vier com 1 canal mesmo assim, o sinal passa por um grafo
   Web Audio com destino stereo e o canal é duplicado nos dois lados.
3. **O default virou 2**: `ms.channelCount || 2`. O `|| 1` era um caminho silencioso de volta
   ao mono.
4. **O `AudioContext` é fechado no cleanup**, para não vazar entre gravações.

### A decisão que eu tomei, e que você pode vetar

**Não desliguei `echoCancellation`, `noiseSuppression` nem `autoGainControl`.**

Essa cadeia opera em mono e é a suspeita mais provável de estar achatando o microfone.
Desligá-la é o único jeito de arrancar stereo real de um dispositivo stereo. Mas muda o som
de todas as suas gravações, e sem cancelamento de eco uma caixa aberta volta a vazar para o
microfone.

O critério de aceite 4 deste bug diz que essa troca precisa da sua aprovação. Você não deu, e
"corrija tudo" não é aprovação para mudar como o seu áudio soa. Então a correção entrega
stereo sem tocar na qualidade da captação.

**Consequência:** se o seu microfone for mono de fábrica, o resultado é o melhor possível. Se
for stereo achatado pela cadeia, existe stereo real a recuperar e é uma segunda volta, com a
sua decisão.

### O stereo duplicado é declarado, nunca escondido

Painel mostra `stereo (dup)`, diagnóstico traz `mic.stereoDuplicado: true`. Critério de
aceite 3: degradar em silêncio é proibido. Chamar mono duplicado de stereo seria pior que
entregar mono.

### Prova vermelho para verde

```
antes  x o default mono explícito não existe mais
       x a captação pede 2 canais sem poder falhar em microfone mono
       x stereo duplicado é declarado, não escondido
       x o AudioContext do upmix é fechado no cleanup
       v a correção não desliga cancelamento de eco nem supressão de ruído

depois v os cinco, nos dois gravadores
```

Suíte completa: **257 testes, 257 passando, 0 falhas.**

### Veredito de spec: `spec-gap`

Nenhuma spec falava de áudio. Adendo aditivo em
`_reversa_sdd/addenda/bug-BUG-20260815-TW4D-v001.md` (R10a a R10g), especificando a trilha
pela primeira vez. **Recomendação do agente, sujeita a veto**, em especial R10c e R10d.

### O que continua aberto

- **Não foi verificado se o dispositivo é mono de fábrica.** Distinguir exige abrir a track
  com os filtros desligados e ler `getSettings()` de volta, o que mudaria a captação sem
  aprovação. É o experimento da segunda volta.
- **O bitrate continua fixo em 128 kbps** e não subiu junto com os canais. Para voz é
  suficiente; se você quiser mais, é decisão sua.
- **Nenhum MP4 foi gravado depois da correção.** A validação é por teste automatizado. Rodar
  `ffprobe` num arquivo novo e ver `channels=2` é o critério de aceite 1 e continua pendente.
- **O 9:16 ainda não tem seletor de microfone nem medidor de som.** Assimetria preexistente,
  fora do escopo deste bug. A contagem regressiva foi portada nesta sessão.

## Agent Notes

- **Um bug, dois arquivos.** O defeito foi registrado uma vez porque o código é o mesmo nos
  dois gravadores e a correção é a mesma. Se o fix descobrir que os dois divergem em algo
  que importa, ele deve dizer, não abrir bug novo em silêncio.
- **Cópias congeladas.** Decks já gerados carregam o gravador em `mira/` e não recebem a
  correção do canônico: `decks/vasco-da-gama/`, `decks/vasco-da-gama-plus-teste/`,
  `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/exemplo/loop-sandeco-shorts-teste-overlay/` e
  as cópias de trabalho em `dev/fase-0/e1-e2/`. A propagação para deck existente é o
  `npx mira-animator edit <deck>` (`lib/commands/edit.js:79`).
- **O 9:16 não tem seletor de microfone.** O 16:9 tem (`MICKEY`, `micSel`); o 9:16 usa
  sempre o dispositivo default do sistema. Não causa o mono, mas limita onde uma escolha de
  canais caberia no 9:16, e é uma assimetria preexistente entre os dois formatos.
- **O bitrate é fixo em 128000 e não escala com o número de canais.** Stereo em 128 kbps AAC
  é aceitável, mas se o fix mexer nos canais vale decidir conscientemente se o bitrate
  acompanha, em vez de deixar como está por omissão.
- **A closure policy é `package`.** Corrigir o código não fecha este bug: exige merge e
  versão publicada no npm. E publicar é ato do autor, não do agente.
- **Proposta de taxonomia** (as listas de `taxonomy.yaml` continuam vazias):
  `area: gravacao-de-video`, `module: templates-studio`, `feature: trilha-de-audio`.
