# O código do mp4-muxer distribuído confirma: `'offset'` é por trilha

Verificação feita em 2026-08-15 contra o `mp4-muxer.js` **vendorado no projeto**, não contra
documentação. Todo o diagnóstico do HYRG depende de `'offset'` significar "cada trilha se
zera na própria origem"; se significasse outra coisa, a Suspected Area do bug precisaria ser
reescrita.

Arquivo lido: `decks/vasco-da-gama/assets/vendor/mp4-muxer.js`. Todas as cópias vendoradas na
árvore são o **mesmo arquivo** (`md5sum` sobre `decks/*/assets/vendor/mp4-muxer.js`,
`templates/vendor/mp4-muxer.js` e `examples/32-mira-studio/deck/assets/vendor/mp4-muxer.js`
devolve um único hash), então não há divergência de versão entre decks.

## O trecho que decide

```js
} else if (options.firstTimestampBehavior === "offset"
        || options.firstTimestampBehavior === "cross-track-offset") {
    if (track.firstDecodeTimestamp === void 0) {
        track.firstDecodeTimestamp = decodeTimestamp;
    }
    let baseDecodeTimestamp;
    if (options.firstTimestampBehavior === "offset") {
        baseDecodeTimestamp = track.firstDecodeTimestamp;          // ← a PRÓPRIA trilha
    } else {
        baseDecodeTimestamp = Math.min(
            videoTrack?.firstDecodeTimestamp ?? Infinity,
            audioTrack?.firstDecodeTimestamp ?? Infinity
        );                                                          // ← mínimo COMPARTILHADO
    }
    decodeTimestamp -= baseDecodeTimestamp;
```

Não há ambiguidade:

- **`'offset'`** subtrai de cada trilha o primeiro timestamp **daquela trilha**. Cada uma
  chega a zero na própria origem, e a distância entre as duas é perdida.
- **`'cross-track-offset'`** subtrai de ambas o **menor** primeiro timestamp entre vídeo e
  áudio. A distância entre elas é preservada.

O gravador usa `'offset'` (`mira-record.js:1035`, `mira-record-16x9.js:1180`). Portanto o
alinhamento inicial entre as trilhas **não é preservado por construção**, e a afirmação de
`agents/mira-studio/SKILL.md:82` de que o offset inicial "já é resolvido pelo
`firstTimestampBehavior: 'offset'`" descreve o oposto do que o código faz.

## Um detalhe que abre uma porta para o fix

A mensagem de erro do próprio muxer, no caminho `'strict'`, diz:

> Non-zero first timestamps are often caused by directly piping frames or audio data from a
> MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of
> the document, which is probably what you want.

Ou seja, o autor do muxer **espera** que timestamps vindos de `MediaStreamTrack` estejam na
mesma base (idade do documento), caso em que `'cross-track-offset'` seria a opção correta e
preservaria a sincronia.

Isso entra em conflito direto com o comentário em `mira-record.js:1028-1034`, que afirma que
o microfone e a captura de tela usam origens de relógio diferentes. **A observação empírica
está do lado do comentário**: o commit `6e84363` registra que usar `'cross-track-offset'`
produziu vídeo congelado no primeiro frame e duração absurda, o que só acontece se o t0 do
vídeo for enormemente maior que o do áudio.

Não é contradição a resolver aqui, é uma **pergunta mensurável** que o instrumento deve
responder: em que base de tempo cada trilha realmente chega, no Chrome atual, nesta máquina?

## CORRIGIDO em 2026-08-16: a saída "mais simples" era uma armadilha

A versão anterior deste arquivo dizia que, se as duas âncoras estivessem na mesma base de
relógio, `'cross-track-offset'` voltaria a ser viável e seria "a correção mais simples".
**Isso está errado, e trocar só a constante teria reproduzido o commit `6e84363`.**

A medição confirmou que as âncoras estão na mesma base (`firstVideoUs` 290846800 e
`firstAudioUs` 290845672). Mas o que decide não é o relógio da captura, é **o que cada
trilha entrega ao muxer**:

| trilha | timestamp que chega ao muxer | por quê |
|---|---|---|
| vídeo | **já rebaseado em zero** | a grade CFR reescreve o PTS como `slotPts(n)`, começando no slot 0 |
| áudio | **relógio nativo (~290 s)** | o `AudioData` vai ao encoder intocado |

Com `'cross-track-offset'`, o muxer calcula
`Math.min(0, 290845672) = 0` e subtrai zero de tudo. O áudio fica onde está: **em 290
segundos**. Vídeo congelado no primeiro frame e duração absurda, que é exatamente a descrição
do `6e84363`.

Ou seja: a constante antiga (`'offset'`) destruía o alinhamento, e a constante "óbvia"
(`'cross-track-offset'`) destruía o arquivo. Nenhuma das duas resolve sozinha.

## A correção aplicada

As duas coisas juntas, em `mandaAoMux()` dentro do Worker:

1. **Basing explícito.** As duas trilhas são levadas a uma origem comum antes de entrar no
   muxer: `origemComum = min(firstVideoUs, firstAudioUs)`, com o vídeo deslocado por
   `firstVideoUs - origemComum` e o áudio por `- origemComum`. A distância real entre as
   capturas sobrevive.
2. **`'cross-track-offset'` como rede de segurança**, não como mecanismo. Com o basing certo,
   o mínimo já é zero e ele subtrai zero. Ele existe para o caso de algo escapar negativo.

Mais uma peça: uma **porta de espera**. Enquanto as duas âncoras não são conhecidas, os
chunks ficam numa fila (medido: os dois pumps começam com 1 a 30 ms de diferença, então a
fila é minúscula). Teto de 240 chunks contra vazamento.

E a **guarda dos relógios**: se `|firstAudioUs - firstVideoUs| > 5 s`, as bases não são
comparáveis (o caso que o comentário antigo do código descrevia). Aí o alinhamento **não é
inventado**: volta ao comportamento antigo e registra `av-relogios` como falha declarada, em
vez de entregar um arquivo torto em silêncio.

Coberto por `test/mira-record-sync.test.mjs`, que roda o Worker de verdade: alinhamento
preservado, constante correta, grade de vídeo ainda regular no timescale, e a guarda dos
relógios disparando.

## A lição, para quem mexer nisso depois

Ler a constante do muxer não bastava. Foi preciso perguntar **em que domínio de tempo cada
trilha chega até ele**, e essa resposta estava na grade CFR, num arquivo diferente daquele
onde a constante mora. Duas correções anteriores (`6e84363` e `c7a3222`) passaram por aqui
sem fazer essa pergunta.
