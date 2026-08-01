# Execução observada

Varredura `/reversa-depth-inspection` de 2026-07-31, no repositório fonte `/workspaces/.mira`,
commit `558a406`. Todos os trechos abaixo são saída real de comando, não reconstrução.

## Deck usado na reprodução

Montei `decks/2026-07-31 pente-fino-studio` num diretório temporário, com quatro slides
(capa, camera, split animado, full animado). Os fragmentos foram escritos exatamente como
`agents/mira-fast/references/formato-mira-studio.md` prescreve, sem nenhuma liberdade. O
esqueleto veio do template real, preparado por
`agents/mira-ultrafast/scripts/build-skeleton.mjs`, que é hoje a única forma automática de
obter um esqueleto válido a partir de `templates/decks/mira-studio-demo/index.html`.

Os scripts da reprodução estão no scratchpad da sessão e são reexecutáveis:
`repro.mjs`, `repro2.mjs`, `repro3.mjs`, `repro4.mjs`, `repro5.mjs`, `parse-test.mjs`.


## O deck gerado, com quatro falas próprias no plano

```
$ grep -n "__miraScript = " -A6 index.html
350:            window.__miraScript = [
351-                'Um roteiro, três formatos. Este é o deck vertical do Mira Studio.',
352-                'Aqui a câmera preenche a coluna inteira: só você falando.',
353-                'No meio a meio, a metáfora animada fica no quadrado de cima e você embaixo.',
354-                'E na tela cheia, a animação toma conta: do roteiro ao vídeo pronto.'
355-            ];
```

As falas do plano deste deck eram "Fala da capa.", "Fala da camera.", "Fala do split." e
"Fala do full.". Nenhuma delas aparece no `__miraScript`.

## A montagem não toca nisso

```
$ grep -rn "__miraScript\|mira-studio-state" agents/mira-fast/ agents/mira-ultrafast/ workflows/
(nenhum resultado)
```

## A cadeia de precedência do teleprompter, no deck gerado

```js
var SCRIPT = window.__miraScript || [];                                    // 849
/* roteiro.md > localStorage (cópia de trabalho entre polls) > SCRIPT. */   // 870
var R = window.__miraRoteiro || null;                                      // 875
function curText(i) { return (txt[i] != null) ? txt[i] : (SCRIPT[i] || ''); } // 884
```

E o builder do roteiro sai antes de definir `window.__miraRoteiro` quando não é HTTP:

```js
var isHttp = location.protocol === 'http:' || location.protocol === 'https:'; // 362
if (!isHttp) return;                    /* R-05: sem servidor, sem roteiro */  // 364
```

Logo, em `file://` com `localStorage` limpo, `curText` devolve `SCRIPT[i]`, que é a fala de
demonstração.
