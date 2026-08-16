# Cápsula de reprodução — BUG-20260815-TW4D

## Resultado: NÃO REPRODUZIDO

Nenhuma gravação foi executada e nenhum MP4 foi inspecionado com `ffprobe` nesta sessão.

## Ambiente

| item | valor |
|---|---|
| commit base | `f564470` |
| branch | `main` |
| árvore de trabalho | `mira-record.js` e `mira-record-16x9.js` sem alterações locais |
| OS | Windows 11 (win32) |
| runtime | Node v22.17.0 |
| navegador | **não executado** |

## Por que não foi reproduzido

O número de canais da trilha depende do que o **microfone físico do autor** entrega ao
`getUserMedia` do Chrome dele. O agente não tem microfone nem navegador, então não pode nem
gravar o MP4 nem ler `micTrack.getSettings()`.

Essa dependência não é acessória: ela decide qual correção é possível.

## O fato que falta, e por que ele mudaria a correção

O código faz `numberOfChannels: ms.channelCount || 1`, onde `ms` é
`micTrack.getSettings()`. **Ninguém sabe o que esse `channelCount` vale na máquina do
autor.** Três cenários, com correções diferentes:

| `channelCount` reportado | leitura | correção possível |
|---|---|---|
| `1`, e o microfone é mono de fábrica | não há stereo a capturar | só resta duplicar o canal na saída, decisão explícita do autor |
| `1`, mas o dispositivo é stereo | a cadeia de processamento de voz do Chrome está colapsando para mono | pedir 2 canais **e** desligar `echoCancellation`/`noiseSuppression`/`autoGainControl`, com custo audível |
| `2` | a track já entrega stereo e o `\|\| 1` não é o culpado | o defeito está em outro ponto do caminho e a análise precisa ser refeita |

O terceiro cenário derrubaria a Suspected Area registrada. Por isso a causa raiz fica em
`supported` e não em `confirmed`.

## O que FOI executado

| comando | resultado |
|---|---|
| leitura de `mira-record.js` e `mira-record-16x9.js` | caminho de áudio idêntico nos dois; nenhuma constraint de canais em nenhuma das três chamadas de `getUserMedia` |
| `grep -c "MICKEY\|micSel"` nos dois gravadores | 0 no 9:16, 6 no 16:9: só o 16:9 tem seletor de microfone |
| `node --test test/mira-record-cfr.test.mjs` | 18/18 passando (cobre a grade CFR, não o áudio) |

Nenhum teste do projeto toca na configuração de áudio. A suíte existente extrai apenas o
corpo de `recordWorkerBody()`, e a construção de `audioCfg` acontece em
`startWorkerPipeline`, no main thread, fora do alcance dela.

## Classificação de determinismo

`deterministic`, mantida do registro: o caminho no código é incondicional. Dado um
`channelCount` de entrada, a saída é sempre a mesma. A incerteza não está no comportamento do
código, está no **valor de entrada** que o microfone do autor fornece.

## Consequência para o ciclo

O primeiro change set é **instrumentação**, compartilhado com o BUG-20260815-HYRG: expor no
painel o que o microfone realmente entregou (`channelCount`, `sampleRate` e o estado das três
chaves de processamento de voz). Uma gravação do autor responde a pergunta e, com ela, a
causa raiz vai a `confirmed` ou é refutada.

Ver `fix/plan.html`.
