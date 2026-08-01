# Cápsula de reprodução · BUG-20260801-F74X

## Ambiente

| item | valor |
|---|---|
| commit base | `c7adeb2` |
| branch | `agent/documentacao-completa-mira` |
| OS | Linux 5.15.167.4-microsoft-standard-WSL2 |
| runtime | Node v24.15.0 |
| navegador | Chromium 150.0.7871.24 (puppeteer ^25.3.0) |
| servidor | réplica do `mira-studio-server.cjs`, com `POST /__mira_save` gravando em disco e compare-and-set por `baseSha` |

## Comando

Dois roteiros de reprodução, cada um dirigindo o navegador de verdade: entra no modo E
(tecla `e`), clica na seta ↑ de um slide, clica em Salvar, espera, recarrega e fotografa o
DOM slide a slide.

1. **Deck escrito à mão**, cópia fiel dos dois templates de demonstração, nos dois formatos
   (9:16 defeituoso e 16:9 como controle).
2. **Deck gerado**, montado pelo pipeline real (`buildSkeleton` + `assembleRun`) a partir de
   um plano de 4 slides com palcos `<slug>-stage`.

Exit code 0 nas duas execuções: o defeito não levanta exceção, é silencioso.

## Taxa

3 execuções completas, 3 falhas. **`deterministic`, 3/3.** Sem aleatoriedade: o protocolo
(HTTP) é gatilho, não fonte de variância, e o resultado é bit a bit o mesmo a cada rodada.

## Resultado 1: deck escrito à mão, 9:16 vs 16:9

```
========================================================
9:16  mira-studio
========================================================
window.miraOrderSource registrado : false
entrou no modo E                  : true
ordem na tela apos subir o slide 3: [ '0', '2', '1', '3' ]
toast                             : "Salvo"
gravacoes POST /__mira_save       : [{"path":"/index.html","baseSha":false}]
roteiro.md mudou no disco         : false
index html mudou no disco         : true
cabecalhos antes                  : [ Slide 1 | capa …, Slide 2 | camera,
                                      Slide 3 | split …, Slide 4 | full … ]
cabecalhos depois                 : [ Slide 1 | capa …, Slide 2 | camera,
                                      Slide 3 | split …, Slide 4 | full … ]   <-- IDÊNTICO

DEPOIS DO RELOAD, slide a slide:
  pos 1 | (sem palco)  | Um roteiro, três formatos  | "Um roteiro, três formatos. Este é o…"
  pos 2 | (sem palco)  | (camera)                   | "Aqui a câmera preenche a coluna in…"
  pos 3 | sv-slide-3   | Três formatos, um roteiro  | "No meio a meio, a metáfora animada…"
  pos 4 | sv-slide-4   | Do roteiro ao vídeo        | "E na tela cheia, a animação toma c…"
                                                       <-- a ordem original, intacta

========================================================
16:9  mira-studio-full        (CONTROLE: funciona)
========================================================
window.miraOrderSource registrado : true
ordem na tela apos subir o slide 3: [ '0', '2', '1', '3', '4' ]
gravacoes POST /__mira_save       : [{"path":"/roteiro.md","baseSha":true}]
roteiro.md mudou no disco         : true
index html mudou no disco         : false
cabecalhos depois                 : [ Slide 1 | camera,
                                      Slide 3 | thirds | Órbita da *Produção* …,   <-- trocou
                                      Slide 2 | thirds | Linha de *Produção* …,    <-- trocou
                                      Slide 4 | full …, Slide 5 | camera ]

DEPOIS DO RELOAD, slide a slide:
  pos 2 | sv-slide-2 | Órbita da Produção | "Cada satélite é uma etapa orbitando o núcleo…"
  pos 3 | sv-slide-3 | Linha de Produção  | "No layout de terços, a animação ocupa os do…"
                                             <-- título e fala acompanharam o slide
```

Leitura: no 9:16 o POST vai para `/index.html` **sem `baseSha`**; no 16:9 vai para
`/roteiro.md` **com `baseSha`**. São dois caminhos de gravação inteiramente diferentes para o
mesmo gesto do usuário, e a diferença é a presença do hook.

No deck escrito à mão o efeito visível é que **a reordenação some**: o `index.html` no disco
muda, mas o `roteiro.md` (que é quem manda no load) não, e o builder devolve tudo para a ordem
de antes. Toast verde, "Salvo", nada aconteceu.

## Resultado 2: deck gerado (o sabor que o relato descreve)

```
ANTES da reordenação (deck gerado, 9:16):
  pos 1 | (sem palco)  | Titulo UM     | "Fala do slide um."
  pos 2 | corrida-svg  | Titulo DOIS   | "Fala do slide dois."
  pos 3 | panela-svg   | Titulo TRES   | "Fala do slide tres."
  pos 4 | fecho-svg    | Titulo QUATRO | "Fala do slide quatro."

  (subi o slide 4 para a posição 3 e salvei)

gravações                : [{"path":"/index.html","baseSha":false}]
roteiro.md mudou no disco: false
index.html mudou no disco: true
toast                    : "Salvo"
ordem dos palcos no arquivo, antes : corrida-stage panela-stage fecho-stage
ordem dos palcos no arquivo, depois: corrida-stage panela-stage fecho-stage   <-- NÃO reordenou

DEPOIS (recarreguei):
  pos 1..4 idênticos ao ANTES
```

## Descoberta durante a reprodução: o arquivo é CORROMPIDO

O `index.html` "mudou no disco" mas os palcos ficaram na mesma ordem. O `diff` do arquivo
antes e depois do Salvar mostra o que realmente aconteceu:

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

Contagem de marcadores no arquivo:

| marcador | antes | depois |
|---|---|---|
| `@MIRA:FAST:SLIDES:START` | 1 | 1 |
| `@MIRA:FAST:SLIDES:END` | 1 | **2** |
| `<!-- === SLIDE N · … === -->` | 4 | **6** |

Causa: o esqueleto gerado **preserva os quatro comentários-banner**
`<!-- === SLIDE N · LAYOUT … === -->` que o template traz para documentar os slides de
demonstração. Eles ficam órfãos: as seções reais foram injetadas entre
`@MIRA:FAST:SLIDES:START` e `:END`, e os banners sobraram depois do bloco.

O `MARKER` do `mira-edit.js` (`/<!--\s*=*\s*SLIDE\b[\s\S]*?-->/gi`, linha 298) casa com esses
banners. Então o `composeSource` fatia o arquivo **pelos banners órfãos**, que não têm relação
nenhuma com as fronteiras das `<section>` reais, e reordena essas fatias. Resultado: os slides
não se movem, os banners e o `@MIRA:FAST:SLIDES:END` sim.

Isso quebra o contrato de marcadores de que a Fase 3 da montagem depende: um deck que passou
por um Salvar de reordenação tem `SLIDES:END` duplicado.

**Este é um defeito distinto e mais grave que o F74X**, descoberto aqui e ainda não
registrado. Ver a seção "O que não entra nesta correção" do plano.

## Classificação final

`reproduction.classification: deterministic`, 3/3, nos dois sabores. Gatilhos confirmados:
deck servido por HTTP + `roteiro.md` presente + uso das setas do modo E + Salvar.
