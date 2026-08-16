# O caminho de áudio dos dois gravadores nativos, linha a linha

Leitura estática feita em 2026-08-15, na árvore de trabalho em `c:\Users\sande\.mira`, com
`templates/authoring/mira-record.js` e `templates/authoring/mira-record-16x9.js` **sem
alterações locais** (`git status --short` vazio para os dois).

**Isto não é uma reprodução.** Nenhuma gravação foi executada. É a descrição do caminho
que o código percorre, com os números de linha para quem for corrigir conferir.

## Os dois arquivos e quem os usa

| Formato | Skill | Gravador canônico | Saída |
|---|---|---|---|
| 9:16 | `/mira-studio` | `templates/authoring/mira-record.js` | 1080x1920 |
| 16:9 | `/mira-studio-full` | `templates/authoring/mira-record-16x9.js` | 1920x1080 |

Confirmado em `agents/mira-studio/SKILL.md:76-78` e `agents/mira-studio-full/SKILL.md:129-131`:
cada deck recebe uma **cópia** do arquivo canônico em `mira/`.

## Passo 1: o microfone é aberto sem pedir canais

**9:16** (`templates/authoring/mira-record.js`), nos dois caminhos de gravação:

```js
// :1451  (caminho primário, WebCodecs + Worker)
S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

// :1719  (fallback MediaRecorder)
S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
```

**16:9** (`templates/authoring/mira-record-16x9.js:330-335`), que tem seletor de microfone:

```js
function getMic() {
    var id = devPref(MICKEY);
    if (!id) return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: id } }, video: false })
        .catch(function () { return navigator.mediaDevices.getUserMedia({ audio: true, video: false }); });
}
```

Nas três chamadas, a única constraint é `audio: true` ou o `deviceId`. **Nenhuma pede
`channelCount`**, e nenhuma desliga a cadeia de processamento de voz. O Chrome então aplica
os defaults dele: `echoCancellation`, `noiseSuppression` e `autoGainControl` ligados. Essa
cadeia opera em **1 canal**, e a track entregue reporta `channelCount: 1` mesmo quando o
dispositivo físico tem dois.

## Passo 2: o encoder copia o que a track disser

Idêntico nos dois arquivos, `mira-record.js:1556-1567` e `mira-record-16x9.js:1703-1714`:

```js
var micTrack = S.mic && S.mic.getAudioTracks()[0];
if (micTrack && typeof AudioEncoder !== 'undefined') {
    var ms = micTrack.getSettings ? micTrack.getSettings() : {};
    audioCfg = { codec: 'mp4a.40.2', sampleRate: ms.sampleRate || 48000, numberOfChannels: ms.channelCount || 1, bitrate: 128000 };
    ...
}
```

`numberOfChannels: ms.channelCount || 1`. O gravador **não decide** o número de canais: ele
copia o da track e, se ela não informar, assume 1. Como o passo 1 garante uma track mono, o
AAC nasce mono aqui. O `|| 1` também é um default mono explícito para o caso de a track não
reportar nada.

O bitrate é fixo em 128000 e não muda com o número de canais.

## Passo 3: o MP4 declara a trilha com o mesmo valor

`mira-record.js:1024` (e o par em `mira-record-16x9.js:1169`), dentro do Worker:

```js
audio: comAudio ? { codec: 'aac', sampleRate: cfg.audio.sampleRate, numberOfChannels: cfg.audio.numberOfChannels } : undefined,
```

O muxer só repete o que veio do passo 2. Nada entre o microfone e o arquivo altera a
contagem de canais.

## O fallback também sai mono, por outro motivo

`mira-record.js:1767`:

```js
S.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: BITRATE });
```

Aqui não há `numberOfChannels` porque não há AudioEncoder: o `MediaRecorder` grava a track
como ela veio. Sendo a track mono desde o `getUserMedia` do passo 1, o resultado é o mesmo.
Note que `audioBitsPerSecond` também não é declarado.

## O que isso significa para a correção

Trocar `|| 1` por `|| 2` no passo 2 **não resolve sozinho**: o `AudioEncoder` seria
configurado para 2 canais enquanto a track continua entregando `AudioData` de 1 canal, o
que muda o defeito de lugar em vez de corrigi-lo. O ponto que decide o número de canais é o
passo 1, e mexer nele tem consequência: desligar `echoCancellation` e `noiseSuppression`
para conseguir 2 canais muda a qualidade do áudio captado, o que é uma decisão do autor, não
do código.

Diagnóstico e escolha de estratégia são do `/reversa-debugger-fix`. Este arquivo só
estabelece onde o mono nasce.

## Assimetria observada de passagem (não é o bug)

O 16:9 tem seletor de microfone (`MICKEY`, `micSel`, 6 ocorrências); o 9:16 não tem nenhuma
(`grep -c "MICKEY\|micSel"` devolve 0 e 6). O 9:16 usa sempre o dispositivo default do
sistema. Isso não causa o mono, mas restringe onde um seletor de canais caberia no 9:16.

## Cópias congeladas na árvore

Decks já gerados carregam uma cópia do gravador e **não** recebem correção do canônico:

- `decks/vasco-da-gama/mira/mira-record.js`
- `decks/vasco-da-gama-plus-teste/mira/mira-record.js`
- `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/exemplo/loop-sandeco-shorts-teste-overlay/mira/mira-record.js`
- `dev/fase-0/e1-e2/mira/mira-record.js` e `dev/fase-0/e1-e2/mira/mira-record-16x9.js`

`lib/commands/edit.js:79` atualiza `mira-record.js` e `mira-record-16x9.js` num deck
existente, então `npx mira-animator edit <deck>` é o caminho de propagação.
