---
schema_version: 1
id: BUG-20260816-FJAU
display_number: 18
title: A captura de tela entrega cerca de metade dos quadros e o CFR completa o resto com duplicatas, então o vídeo é gravado a 15-18 fps reais
status: open
phase: triaging
severity: medium
priority: P2
created: 2026-08-16
updated: 2026-08-16

origin:
  type: inspection
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-gap
  - desempenho
  - gravacao

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "2/2 nas duas gravações medidas do autor, com e sem aceleração por GPU no Chrome"
  suspected_triggers:
    - "captura de tela 2560x1440 escalada para 1920x1080 pelo próprio encoder"
    - "qualidade 'alta' (resolução de saída fixa) com encoder em GPU"
    - "possivelmente a taxa de atualização da tela ou o compositor do Windows, NÃO investigado"

blocking: []

relationships:
  - bug: BUG-20260815-HYRG
    type: related-to
    state: proposed
    evidence:
      - ref: "evidence/dois-diagnosticos.md"
        observation: >-
          descoberto ao medir o HYRG, no mesmo diagnóstico JSON. É outro defeito: o HYRG é
          sobre ALINHAMENTO entre trilhas e este é sobre TAXA de captura. Fica proposed
          porque um vídeo com metade dos quadros duplicados pode piorar a percepção de
          dessincronia sem ser a causa dela.

traceability:
  specs: []
  affected_code:
    - "templates/authoring/mira-record-16x9.js"
    - "templates/authoring/mira-record.js"
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

# A captura de tela entrega cerca de metade dos quadros e o CFR completa o resto com duplicatas, então o vídeo é gravado a 15-18 fps reais

## Summary

A grade CFR mantém o arquivo com 30 fps perfeitos no papel, mas **metade dos quadros é cópia
do anterior**. A captura de tela do Chrome não está entregando 30 quadros por segundo.

Medido em duas gravações do autor, numa RTX 4070 com encoder em GPU:

| gravação | quadros reais | duplicados | total | fps real |
|---|---|---|---|---|
| 20:07 (GPU desligada no Chrome) | 246 | 256 | 500 | **14,8** |
| 20:12 (GPU ligada) | 330 | 227 | 551 | **18,0** |

Ligar a aceleração por GPU melhorou, e não resolveu. O alvo é 30.

## Expected Behavior

**Não há spec.** `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md` seção 10 descreve a
gravação direta no disco e não estabelece nenhum piso de taxa de captura real. Os dois
SKILL.md descrevem a grade CFR e o que ela faz com slots vazios, mas nunca dizem quantos
slots vazios são aceitáveis.

Isso é uma lacuna com consequência: **a grade CFR foi desenhada para tapar buracos
ocasionais** (backpressure momentâneo, GPU ocupada). Ela está sendo usada para tapar metade
do vídeo, e o painel mostra isso como um contador (`N dup`) que ninguém lê como problema.

O comportamento desejado, a decidir com o autor: qual taxa real de captura é aceitável, e a
partir de que proporção de duplicatas a gravação deve avisar em vez de seguir calada.

## Actual Behavior

Do diagnóstico JSON de 2026-08-16 20:12 (`worker`):

```json
"frames": 330, "dupFilled": 227, "encoded": 551, "dropped": 1,
"maxQ": 3, "audioDropped": 0, "mode": "cfr"
```

`dropped: 1` e `maxQ: 3` são baixos: **o gargalo não é o encoder nem a fila**. O encoder dá
conta. Os quadros simplesmente não chegam da captura.

Configuração das duas medições, idêntica: entrada 2560x1440, saída 1920x1080, caminho
`direct` (escala feita pelo próprio encoder), qualidade `alta`, encoder `gpu`, renderer
`NVIDIA GeForce RTX 4070`.

O arquivo resultante passa em qualquer verificação: `ffprobe` reporta `30/1`, deltas
constantes, nada marcado como parcial. **O defeito é invisível no arquivo** e só aparece na
contagem interna.

## Steps to Reproduce

1. Abrir um deck Studio pelo launcher e gravar uns 15 segundos com a tecla R.
2. Clicar em "salvar diagnóstico JSON" no painel.
3. Comparar `worker.frames` (quadros reais) com `worker.encoded` (total no arquivo).
4. Se `frames` for muito menor que `encoded`, a diferença é `dupFilled`: quadro repetido.

## Evidence

- `evidence/dois-diagnosticos.md` — os dois diagnósticos JSON do autor, lado a lado, com a
  comparação das duas configurações de GPU.
- `../../intake/relato-20260815-1716.md` — a sessão em que isso apareceu, ao medir outro bug.

## Suspected Area

Não investigado. Registrado com causa raiz **em branco de propósito**: a medição mostra
*que* os quadros não chegam, e não *por quê*.

Hipóteses não testadas, em ordem de o que eu checaria primeiro:

1. **A escala 2560x1440 → 1920x1080 no caminho `direct`.** O encoder recebe quadros maiores
   que a saída e escala. Vale medir com a tela em 1920x1080 nativo.
2. **Element Capture / Region Capture.** A restrição da captura a uma subárvore pode custar
   caro por quadro.
3. **Taxa de atualização da tela e compositor do Windows.** Se o monitor estiver a 60 Hz mas
   a página só repintar quando algo muda, a captura entrega menos quadros por não haver
   quadro novo. **Se for isso, não é bug**: é a captura funcionando como projetada, e o
   defeito real passa a ser a ausência de um aviso.
4. **A qualidade `alta`**, que fixa a resolução de saída em vez de usar a nativa da coluna.

A hipótese 3 é a mais provável e a que mais muda o desfecho, porque transformaria este bug
de "corrigir a captura" em "declarar o comportamento e avisar o autor".

## Acceptance Criteria

1. Está determinado se a taxa baixa é um defeito do gravador ou o comportamento normal da
   captura de tela quando a página não repinta.
2. Se for defeito: a taxa real de captura sobe, medida pelo mesmo `worker.frames`.
3. Se for comportamento normal: está **declarado** na spec e no SKILL.md, e o painel avisa
   quando a proporção de duplicatas passa de um limiar acordado, em vez de mostrar só um
   contador silencioso.
4. Em qualquer dos dois casos, a grade CFR continua íntegra: `test/mira-record-cfr.test.mjs`
   segue verde.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | nenhuma (`spec-gap`): não existe piso de taxa de captura em lugar nenhum |
| Código afetado | os dois gravadores, ponto exato não determinado |
| Causa raiz | **não investigada** |
| Testes | nenhum |

## Resolution

Não resolvido, e **não foi tentada correção**.

## Agent Notes

- **Este bug foi registrado, não atacado, e isso é deliberado.** O autor pediu "corrija tudo",
  e os outros dois defeitos da sessão (TW4D e HYRG) foram corrigidos. Este não, por três
  motivos: a causa não está no código do Mira até prova em contrário, não há medição que
  isole a origem, e a hipótese mais provável (a página não repinta, então não há quadro novo
  para capturar) transformaria a "correção" num aviso, não num conserto.
- **Não confundir com o BUG-20260815-HYRG.** Aquele é alinhamento entre trilhas, corrigido e
  testado. Este é taxa de captura. Foram descobertos na mesma medição, o que não os torna o
  mesmo problema.
- **O `dupFilled` merece um limiar.** Hoje ele é um contador no painel. 227 de 551 é
  praticamente metade do vídeo, e nada avisou. Seja qual for o desfecho, isso precisa mudar.
- **Medir com a tela em 1920x1080 nativo é o primeiro experimento**, porque é barato e
  elimina a hipótese 1 de uma vez.
- **Proposta de taxonomia**: `area: gravacao-de-video`, `module: templates-studio`,
  `feature: taxa-de-captura`.
