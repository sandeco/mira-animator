# Cápsula de reprodução — BUG-20260815-HYRG

## Resultado: NÃO REPRODUZIDO

Nenhuma gravação foi executada e nenhum MP4 foi medido nesta sessão. O que segue registra o
que foi tentado, o que foi verificado e por que a reprodução real não cabe no agente.

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

Reproduzir este defeito exige gravar um MP4 real pela tecla R e medir a distância entre o
áudio e o vídeo quadro a quadro. Isso precisa de:

1. um Chrome real com `getDisplayMedia` e `getUserMedia` autorizados,
2. um microfone físico,
3. um gesto sonoro e visível simultâneo (claquete) executado por uma pessoa na frente da
   câmera,
4. um editor de vídeo para medir o resultado.

Nenhum dos quatro está disponível para o agente. **Não é limitação contornável com mais
esforço**: o defeito só se manifesta na captura ao vivo de hardware.

## O que FOI executado

| comando | resultado |
|---|---|
| `node --test test/mira-record-cfr.test.mjs` | **18 testes, 18 passando, 0 falhas** |
| `git show c7a3222^:templates/authoring/mira-record.js \| grep firstTimestampBehavior` | linha 945, `'offset'` já presente antes da correção do CFR |
| `git show c7a3222^:templates/authoring/mira-record-16x9.js \| grep firstTimestampBehavior` | linha 1090, idem |
| `grep -c mrc-cfr` nas cópias de deck | 0 em todas: nenhum deck no disco tem o gravador pós-CFR |
| `md5sum` das cópias de `mp4-muxer.js` | hash único: não há divergência de versão entre decks |
| leitura do `mp4-muxer.js` vendorado | `'offset'` usa `track.firstDecodeTimestamp`; `'cross-track-offset'` usa `Math.min` entre as trilhas |

A suíte do CFR passar é informação relevante e **não** contradiz o bug: ela cobre a grade de
vídeo, que trata deriva progressiva. Não há nenhum teste, em lugar nenhum do projeto, que
meça alinhamento entre as duas trilhas.

## Classificação de determinismo

`intermittent`, mantida do registro. Justificativa: o autor diz "quase em todas as
gravações", o que indica que ocorre na maioria mas não em todas, e o mecanismo suspeito
(diferença entre o início de duas capturas independentes) tem motivo para variar entre
execuções conforme a latência de inicialização de cada pipeline.

**Isso é leitura do mecanismo, não medição.** A taxa real e a estabilidade do deslocamento
entre gravações são desconhecidas.

## Consequência para o ciclo

Sem medição não há como levar `root_cause.state` a `confirmed`: o mecanismo ser legível no
código não prova que ele produz o deslocamento de milissegundos observado. Poderia haver
outra fonte somando ou dominando.

Por isso o primeiro change set deste bug é **instrumentação**, não correção: expor o
alinhamento medido para que a próxima gravação do autor produza o número que falta. Ver
`fix/plan.html`.

O bug **não** é fechado como `resolution_kind: instrumentation-required`: o defeito continua
existindo e o autor continua sem poder publicar. Instrumentar é o primeiro passo do
diagnóstico, não o desfecho.
