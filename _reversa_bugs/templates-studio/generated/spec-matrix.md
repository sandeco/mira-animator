<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-16T21:05:00Z a partir de 9 bugs -->

# Matriz BUG ↔ SPEC · templates-studio

Spec efetiva = original + adendos vigentes.

| bug | seção de spec | veredito |
|---|---|---|
| JZNJ | `_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` | spec-gap |
| JZNJ | `_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10` | spec-gap |
| S3TX | `_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` | spec-gap |
| S3TX | `_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17` | spec-gap |
| OI56 | `_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` | spec-correta |
| RNYU | `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md#4-texto-por-slide--navegação` | spec-gap |
| F74X | `_reversa_sdd/addenda/bug-BUG-20260801-F74X-v001.md#r8-quem-manda-na-ordem-dos-slides` | spec-gap |
| ADQX | `_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md#r1f-os-marcadores-de-montagem-sao-invariantes-para-a-autoria` | spec-gap |
| **TW4D** | `_reversa_sdd/addenda/bug-BUG-20260815-TW4D-v001.md#r10-a-trilha-de-áudio-da-gravação-nativa` | **spec-gap** |
| **HYRG** | `_reversa_sdd/addenda/bug-BUG-20260815-HYRG-v001.md#r9-quem-manda-no-alinhamento-entre-as-trilhas` | **spec-desatualizada** |
| **HYRG** | `agents/mira-studio/SKILL.md#82` e `agents/mira-studio-full/SKILL.md#137` | **corrigidos: o texto afirmava o contrário** |

## O primeiro `spec-desatualizada` do registro

Até 2026-08-16 todos os vereditos eram `spec-gap` (faltava spec) ou `spec-correta` (a spec já
dizia o certo). O HYRG é o primeiro caso em que **a documentação existia e estava errada**:
ela afirmava que o offset inicial de A/V "já é resolvido pelo `firstTimestampBehavior:
'offset'`". Não era. A frase foi corrigida nos dois SKILL.md e o contrato real está no adendo.

Diferença que importa para quem for corrigir algo aqui depois: uma lacuna deixa você sem
resposta; uma afirmação errada te dá a resposta errada com confiança. A segunda é pior, e
sobreviveu porque nada media o desvio A/V do arquivo gerado.

## Adendos gerados por bugs deste contexto

- `bug-BUG-20260731-JZNJ-v001.md`, `bug-BUG-20260731-S3TX-v001.md`,
  `bug-BUG-20260731-RNYU-v001.md`, `bug-BUG-20260801-F74X-v001.md`,
  `bug-BUG-20260801-ADQX-v001.md`
- **`bug-BUG-20260815-TW4D-v001.md`** — R10a a R10g: a trilha de áudio, especificada pela
  primeira vez
- **`bug-BUG-20260815-HYRG-v001.md`** — R9a a R9g: quem manda no alinhamento entre as trilhas

> `_reversa_sdd/` está no `.gitignore`. Os adendos existem no disco e são referenciados pelos
> `bug.md`, mas não entram nos commits.

## Bugs sem seção de spec

| bug | o que não está especificado |
|---|---|
| **FJAU** | qual taxa real de captura é aceitável, e a partir de que proporção de quadro duplicado a gravação deve avisar. Hoje `dupFilled` é um contador silencioso: 227 de 551 quadros duplicados não gerou nenhum aviso. |
