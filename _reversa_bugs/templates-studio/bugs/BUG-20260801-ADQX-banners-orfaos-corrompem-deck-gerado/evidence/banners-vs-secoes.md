# Evidência · os banners órfãos num deck gerado

Medido no commit `c7adeb2`, sobre um deck `mira-studio` montado pelo pipeline real
(`buildSkeleton` + `assembleRun`), com uma réplica exata do `MARKER` e do `reorderSource`
do `templates/authoring/mira-edit.js`.

## Deck gerado com 3 slides

```
<section> de topo no arquivo        : 3
banners que o MARKER casa           : 4
slides na tela (perm.length)        : 3

banner 1 @ 13322: <!-- === SLIDE 1 · CAPA (sem data-layout: layout próprio) ===
banner 2 @ 14240: <!-- === SLIDE 2 · LAYOUT CAMERA (você em tela cheia) === -->
banner 3 @ 14307: <!-- === SLIDE 3 · LAYOUT SPLIT (metáfora 1:1 em cima + você embaixo) ==
banner 4 @ 14390: <!-- === SLIDE 4 · LAYOUT FULL (metáfora vertical em tela cheia) === -->

região reordenável: de 13322 até 14203 (tamanho 881)
```

Repare nos deslocamentos: a região reordenável termina em **14203**, e os banners 2, 3 e 4
começam em **14240, 14307 e 14390**. Eles estão inteiramente **fora** da região. Sobraram do
template, sem os slides que descreviam, porque as seções reais foram injetadas entre
`@MIRA:FAST:SLIDES:START` e `:END`, antes deles.

## Os dois regimes de falha

O `reorderSource` escolhe o caminho dos banners sempre que `marks.length >= 2`. O que
acontece depois depende de uma coincidência numérica:

| deck | banners | slides | resultado |
|---|---|---|---|
| gerado, 3 slides | 4 | 3 | **recusa**: `Nº de blocos no arquivo (4) ≠ nº de slides na tela (3).` A reordenação simplesmente não acontece. |
| gerado, 4 slides | 4 | 4 | **corrompe**: passa da guarda de contagem e reescreve o arquivo embaralhando comentário em vez de slide. |

### Regime 1: recusa (em navegador real)

```
carregou. seções: 3
[console] [mira-edit] falha ao salvar: Error: Nº de blocos no arquivo (4) ≠ nº de slides na tela (3).
toast   : "Falha ao salvar: Nº de blocos no arquivo (4) ≠ nº de slides na tela (3)."
gravou  : []
md mudou: false
html mud: false
```

Nada é gravado, o que é seguro, mas o usuário não consegue reordenar um deck gerado. É este
regime que bloqueava o critério de aceite do BUG-20260801-F74X.

### Regime 2: corrupção (deck gerado de 4 slides)

`diff` do `index.html` antes e depois de um Salvar de reordenação:

```diff
283a284,290
> 
> <!-- @MIRA:FAST:SLIDES:END -->
> 
>     <!-- === SLIDE 2 · LAYOUT CAMERA (você em tela cheia) === -->
> 
>     <!-- === SLIDE 3 · LAYOUT SPLIT (metáfora 1:1 em cima + você embaixo) === -->
> 
```

Contagem de marcadores:

| marcador | antes | depois |
|---|---|---|
| `@MIRA:FAST:SLIDES:START` | 1 | 1 |
| `@MIRA:FAST:SLIDES:END` | 1 | **2** |
| `<!-- === SLIDE N · … === -->` | 4 | **6** |

E a ordem dos palcos no arquivo **não muda**:

```
ordem dos palcos, antes : corrida-stage panela-stage fecho-stage
ordem dos palcos, depois: corrida-stage panela-stage fecho-stage
```

O usuário vê um toast verde "Salvo", os slides não se moveram, e o arquivo saiu com o
marcador de fim duplicado. O contrato de marcadores de que a Fase 3 da montagem depende está
quebrado a partir daí.

## Por que o `mira-studio-full` não sofre igual

O template 16:9 registra `window.miraOrderSource` em modo `replace`, então o
`composeSource` nunca é chamado para a ordem e o `reorderSource` nunca roda. O defeito está
latente lá: qualquer deck 16:9 que perca o hook (servido por `file://`, ou com o
`roteiro.md` ausente) cai no mesmo caminho.

## O sinal que distingue banner legítimo de banner órfão

Num deck escrito à mão, cada banner delimita de fato um slide: fatiar por eles produz blocos
com **exatamente uma** `<section>` cada. Num deck gerado, o primeiro bloco engole todas as
seções e os demais ficam vazios. É essa a checagem que a correção usa, em vez de confiar na
contagem.
