# Duas gravações reais, medidas

Dois diagnósticos JSON gerados pelo próprio gravador, na máquina do autor, em 2026-08-16.
Arquivos brutos ao lado: `diag-2007-gpu-desligada.json` e `diag-2012-gpu-ligada.json`.

Entre uma e outra o autor **religou a aceleração por GPU do Chrome**, que ele havia desligado
para testar outra coisa. Nada mais mudou: mesmo deck, mesma máquina, mesma configuração de
gravação.

## O número que interessa

| | 20:07 (GPU do Chrome desligada) | 20:12 (GPU ligada) |
|---|---|---|
| `worker.frames` (quadros REAIS da captura) | 246 | 330 |
| `worker.dupFilled` (slots preenchidos com cópia) | 256 | 227 |
| `worker.encoded` (total no arquivo) | 500 | 551 |
| duração do vídeo | 16,67 s | 18,37 s |
| **fps real da captura** | **14,8** | **18,0** |
| proporção de quadro duplicado | **51%** | **41%** |

Religar a GPU levou a captura de 14,8 para 18 fps. O alvo é 30.

## O que ISENTA o encoder

```json
"dropped": 1,        // quadros descartados por backpressure
"maxQ": 3,           // pico da fila do encoder
"audioDropped": 0
```

`dropped: 1` em 551 e fila máxima de 3 significam que **o encoder nunca ficou para trás**. Se
o gargalo fosse codificação, a fila subiria e os descartes seriam muitos. Os quadros não
foram jogados fora: eles nunca chegaram.

Também isenta a máquina: `renderer` é uma `NVIDIA GeForce RTX 4070`, `encoderPreference` é
`gpu`, e o caminho é `direct` (o próprio encoder escala, sem canvas intermediário).

## Configuração idêntica nas duas

```json
"input":  { "w": 2560, "h": 1440 },
"output": { "w": 1920, "h": 1080 },
"crop":   { "x": 0, "y": 0, "w": 2560, "h": 1440, "path": "direct" },
"quality": "alta",
"timing": { "mode": "cfr", "fps": 30 }
```

A captura entrega 2560x1440 e a saída é 1920x1080: **há escala em todo quadro**. É a primeira
hipótese a testar, e a mais barata: gravar com a tela em 1920x1080 nativo e comparar
`worker.frames`.

## O que o arquivo NÃO mostra

`ffprobe` no MP4 resultante reporta `30/1`, `avg_frame_rate` 30, deltas constantes, nenhuma
marca de parcial, `falhas: []`.

**O defeito é invisível no arquivo.** A grade CFR faz seu trabalho: entrega 30 fps perfeitos
preenchendo o que falta com o quadro anterior. Quem abrir o MP4 vê um vídeo tecnicamente
correto e um pouco travado, sem nenhuma pista de que metade dele é cópia.

Por isso este bug precisou de instrumentação para existir: até 2026-08-16, `worker.frames` e
`worker.dupFilled` não apareciam em lugar nenhum que o autor olhasse.

## Hipótese que muda o desfecho

Se a captura de tela do Chrome só emite quadro quando a página **repinta**, então 15-18 fps
numa tela com animação parcial é o comportamento correto da API, não um defeito. Nesse caso a
correção não é acelerar nada: é **avisar**, porque 41% de quadro duplicado hoje passa como um
contador silencioso no painel.

Testar isso é simples: gravar um slide com animação contínua e cheia de movimento, e comparar
`worker.frames` com uma gravação de um slide estático. Se o número subir com movimento, a
hipótese está certa.
