# Cada trilha é zerada no próprio primeiro quadro, e o desencontro real entre elas é descartado

Leitura estática feita em 2026-08-15, com `templates/authoring/mira-record.js` e
`mira-record-16x9.js` sem alterações locais. **Não é uma reprodução**: nenhuma gravação foi
executada e nenhum MP4 foi medido.

## O que já foi corrigido antes, e o que não foi

Duas correções anteriores tocaram o relógio do MP4. Nenhuma das duas trata deslocamento
constante:

| commit | data | o que corrigiu |
|---|---|---|
| `6e84363` | antes de 27/07 | vídeo congelado no 1º frame e duração absurda. Era `cross-track-offset` subtraindo o t0 minúsculo do áudio do t0 gigante do vídeo. A saída foi trocar para `'offset'`. |
| `c7a3222` | 2026-07-27 | trilha de vídeo em VFR. Sob backpressure o Worker abria buracos irregulares, e o Premiere, ao conformar VFR numa grade fixa, acumulava desencontro **progressivo**. A saída foi a grade CFR. |

O commit `c7a3222` declara explicitamente:

> Nao confundir com o defeito antigo de offset inicial de A/V, ja corrigido por
> firstTimestampBehavior: 'offset' — que continua como estava. O audio nao foi tocado.

E `agents/mira-studio/SKILL.md:82` repete a mesma afirmação como comportamento documentado:

> Isso é DIFERENTE do offset inicial de A/V, que já é resolvido pelo
> `firstTimestampBehavior: 'offset'` e continua como está.

**É essa afirmação que este bug contradiz.** `'offset'` não resolve o offset inicial: ele
zera cada trilha no próprio primeiro quadro, que é justamente como um deslocamento constante
sobrevive intacto no arquivo.

## O caminho do vídeo: zerado no primeiro VideoFrame

`templates/authoring/mira-record.js:1121-1124` (e `mira-record-16x9.js:1266-1269`):

```js
function encodeFrameCFR(frame, q) {
    var ts = frame.timestamp;
    if (slotT0 < 0) slotT0 = ts;                       // <-- âncora: 1º frame de VÍDEO
    var n = Math.round((ts - slotT0) * cfrFps / 1e6);
```

O PTS gravado é `slotPts(n) = Math.round(n * 1e6 / cfrFps)` (`:1068`), ou seja, a linha do
tempo do vídeo começa em zero **no primeiro frame de vídeo**, seja qual for o instante real
em que ele foi capturado.

No modo VFR (chave desligada) o efeito é o mesmo por outro caminho: os timestamps nativos
são preservados e o muxer zera a trilha no primeiro deles.

## O caminho do áudio: zerado no próprio primeiro AudioData

`mira-record.js:1240-1258` (e `mira-record-16x9.js` no par equivalente):

```js
function pumpAudio(readable) {
    aReader = readable.getReader();
    (function loop() {
        aReader.read().then(function (r) {
            ...
            try { aenc.encode(r.value); } catch (e) { falhaDegradada('audio-encode', e); }
```

O `AudioData` vai para o encoder com o **timestamp nativo dele, intocado**. Quem zera é o
muxer, em `mira-record.js:1035` (`mira-record-16x9.js:1180`):

```js
firstTimestampBehavior: 'offset'
```

No `mp4-muxer`, `'offset'` significa **offset por trilha**: cada trilha tem o próprio
primeiro timestamp subtraído de si mesma. Não é o mesmo que `'cross-track-offset'`, que
subtrai de todas as trilhas o menor primeiro timestamp e por isso preserva a distância entre
elas.

## Onde o deslocamento nasce

Com as duas trilhas zeradas separadamente, a distância real entre "instante do primeiro
frame de vídeo" e "instante do primeiro pacote de áudio" é **descartada por construção**. O
que sobra no arquivo é exatamente essa distância, agora como deslocamento fixo entre as
trilhas.

E há motivo para essa distância não ser zero. Em `mira-record.js:1450-1457`, o microfone é
aberto **antes** da captura de tela:

```js
if (ui.mic.checked) {
    try { S.mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
    ...
}

S.tab = await navigator.mediaDevices.getDisplayMedia({ ... });
```

Duas chamadas `await` em sequência, com pipelines de captura independentes, cada uma com a
própria latência de inicialização. O áudio começa a produzir antes.

O comentário em `mira-record.js:1028-1034` reconhece o problema dos relógios e conclui:

> os dois processors nascem juntos no start, então o desvio A/V do offset por track é
> <= 1 frame.

Duas observações sobre essa conclusão:

1. **Os processors nascerem juntos não implica que os primeiros quadros correspondam ao
   mesmo instante.** As *tracks* foram abertas em momentos diferentes, e cada pipeline tem
   latência própria. O `MediaStreamTrackProcessor` só lê o que a track já está produzindo.
2. **Mesmo se a conclusão estivesse certa, ela não é boa notícia.** Um frame a 30 fps são
   33 ms. A literatura de percepção de sincronia labial situa o incômodo por volta de 20 ms
   com o áudio adiantado. "≤ 1 frame" é grande o bastante para um olho treinado, que é
   exatamente o relato.

Nada no código **mede** esse desvio: as métricas do painel trazem `fps`, `dropped`,
`audioDropped`, `maxNavPtsGapMs`, `dupFilled`, `dupDropped`, `gapJumped`, e nenhum campo de
offset A/V. A afirmação de "≤ 1 frame" nunca foi verificada contra um arquivo real.

## Por que isso é constante, e não crescente

Um deslocamento de âncora acontece uma vez, no início, e o resto da linha do tempo segue
regular. É consistente com o relato de "igual do começo ao fim".

A deriva do CFR era o oposto: buracos irregulares ao longo do clipe, deslocamento que cresce
com a duração. São mecanismos distintos, e por isso corrigir um não corrige o outro.

## O que isso significa para a correção

`'cross-track-offset'` **não** é a saída: já foi tentado e produziu o `6e84363` (vídeo
congelado, duração absurda), porque as duas origens de relógio são incomparáveis — o
`AudioData` do microfone começa perto de zero e o `VideoFrame` da captura de tela vem no
relógio de uptime. Trocar a constante reintroduz um defeito pior.

A correção precisa **medir** a distância real entre as duas capturas numa referência comum e
aplicá-la explicitamente na hora de muxar, em vez de deixar cada trilha se zerar sozinha. Que
referência usar, e como obtê-la de dentro do Worker, é o trabalho de diagnóstico do
`/reversa-debugger-fix`.

Antes disso é preciso **medir o erro atual**, com claquete: um estalo audível junto de um
flash visível, gravado e depois medido quadro a quadro no editor. Sem esse número não há como
saber o sinal do deslocamento (áudio adiantado ou atrasado) nem se ele é estável entre
gravações.

## O defeito está nas duas versões do gravador

`git show c7a3222^:templates/authoring/mira-record.js` mostra `firstTimestampBehavior:
'offset'` na linha 945, e o `mira-record-16x9.js` na linha 1090, ambos **antes** da correção
do CFR. Ou seja, o zeramento por trilha é idêntico no gravador velho e no novo.

Consequência prática: **a chave "CFR (edição)" não muda este defeito.** Deck com cópia velha
e deck com cópia atual têm o mesmo deslocamento constante. Isso torna o bug independente da
dúvida sobre qual cópia o autor usou.

Para registro, todas as cópias de gravador em decks no disco são anteriores ao CFR
(`grep -c mrc-cfr` devolve 0):

- `decks/vasco-da-gama/mira/mira-record.js`
- `decks/vasco-da-gama-plus-teste/mira/mira-record.js`
- `_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/exemplo/loop-sandeco-shorts-teste-overlay/mira/mira-record.js`

Isso **não** explica o relato de deslocamento constante, mas explica por que um relato de
deriva progressiva ainda seria possível hoje: nenhum deck no disco recebeu a correção de
27/07. Vale conferir de qualquer forma.

## Estado da correção anterior

`node --test test/mira-record-cfr.test.mjs`: **18 testes, 18 passando, 0 falhas**. A grade
CFR está íntegra nos arquivos canônicos. Este bug não a acusa nem a substitui.
