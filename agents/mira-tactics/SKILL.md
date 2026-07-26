---
name: mira-tactics
description: >-
  Cria um slide de MESA TÁTICA no Mira: campo de futebol cinematográfico com os
  dois times na formação real, cada jogador um boneco chibi (ou disco) na cor do
  time, editável ao vivo (mover, setas/zonas/paint), com jogadas gravadas e
  reproduzidas por quadros-chave (tecla R) e salvas como JSON. Com times reais,
  valide 4 atributos por titular: nome, número, posição e aparência.
  /mira-vertical gira o campo (tecla
  V). Use SEMPRE que o usuário disser /mira-tactics, mesa tática, quadro tático,
  prancheta tática, escalação, formação de time, campo de futebol com jogadores,
  montar a jogada, replay de jogada, posicionar os jogadores, tabuleiro tático,
  Magic Wall, ou pedir um slide com um campo e peças/jogadores posicionados.
  Para desenhar por cima de qualquer slide use o mira-draw; esta skill gera um
  slide dedicado.
---

# Skill: Mesa tática (campo com jogadores, jogadas gravadas e replay)

Um slide dedicado: campo cinematográfico com os dois times na formação real, cada jogador um boneco chibi animado (ou disco clássico) na cor do time (número acima da cabeça, nome ao clicar). O apresentador arrasta, adiciona, apaga e desenha setas/zonas/traços ao vivo, grava jogadas por quadros-chave e as reproduz com interpolação suave, salvando cada uma como JSON.

> **Fonte da verdade:** o motor oficial é embarcado no pacote e chega com a instalação. Procure-o nesta ordem e use o primeiro que existir:
>
> 1. `mira-templates/decks/mesa-tatica/index.html` (projeto com Mira instalado)
> 2. `templates/decks/mesa-tatica/index.html` (repositório fonte do Mira)
> 3. `node_modules/mira-animator/templates/decks/mesa-tatica/index.html`
>
> Se nenhum existir, a instalação está desatualizada: rode `npx mira-animator update` (ou `install`) e ele aparece. **NUNCA reconstrua o motor do zero.** Gere sempre a partir dele: copie o arquivo e reescreva apenas o bloco `var TACTICS = { ... }` no topo do `<script>`. Todo o resto (campo, peças, edição, jogadas, vertical) já vive no motor. O HTML é único e autocontido: sem CDN, sem D3, abre por `file://`.
>
> A especificação completa do motor está em `_reversa_sdd/manipulação/mesa-tatica.md` (repo fonte). As decisões de produto listadas lá e resumidas no fim desta skill **não podem regredir**.

## Modelo mental

O Mira não simula a partida. Ele monta um slide declarativo: a **CONFIG** (`TACTICS`) descreve orientação, título e os dois times (cores, formação e jogadores); o motor desenha o campo e posiciona tudo.

- **Coordenadas de campo, não de tela.** Tudo usa `u` 0..1 no comprimento (gol esquerdo ao direito) e `v` 0..1 na largura. Virar para a vertical é só remapear (u,v); nada é recalculado.
- **Número sempre visível, nome sob clique.** O número flutua acima da cabeça do boneco; o nome aparece num balão ao clicar (a peça selecionada escurece).
- **Goleiro sempre presente** em cada time, com uniforme próprio (`goalie`), o mais fiel possível ao uniforme real, posicionado pela formação (ver diretiva abaixo).
- **Campo abre limpo:** sem setas nem zonas pré-desenhadas (`arrows: []`, `shapes: []`).

## Visual (não simplificar)

Gramado escuro com faixas de corte em xadrez, vinheta nas bordas, moldura azul iluminada estilo mesa e varredura de luz em loop perpétuo (Regra Zero atendida no cenário). Setas com glow dourado e um filete de luz correndo dentro (loop infinito); zonas com brilho na cor escolhida. O **título** vive dentro do SVG, em caixa alta com o "x" minúsculo ("BRASIL x NORUEGA"), alinhado à linha lateral ESQUERDA do campo; o crédito "MIRA Animator by sandeco" fica discreto na mesma linha de base, alinhado à lateral direita. `eyebrow` oculto por padrão (só se o usuário pedir).

## Peças (jogadores)

Dois estilos, alternáveis em runtime pelo botão ●/⛹ da barra:

- **boneco** (padrão): miniatura chibi procedural em SVG: cabeça com cabelo, camisa na cor do time SEM número (borda da camisa na cor do calção), calção, bracinhos e pernas que TROTAM no lugar em loop perpétuo, cada jogador com fase e ritmo próprios. Número em branco com contorno escuro flutuando acima da cabeça.
- **botao**: disco clássico na cor do time com o número no centro.

Comum aos dois: sombra e halo pulsante na cor do time, goleiro com cor própria, seleção escurece e mostra o nome, entrada com pop escalonado.

**Aparência real:** cada player aceita `skin` e `hair` para refletir a aparência pública do atleta. Tons nomeados: `skin: 'clara' | 'media' | 'escura'`, `hair: 'preto' | 'castanho' | 'loiro' | 'ruivo' | 'grisalho'` (hex direto também vale). Sem os campos, o motor usa variação determinística. **Semântica calibrada:** jogador negro = `'escura'`; pardo = `'media'`; `'media'` NÃO serve para quem é negro (fica caramelo e não reflete a realidade); em dúvida entre os dois para um atleta negro, use `'escura'`.

## Fluxo conversacional

> ### Regra: sempre o ÚLTIMO JOGO, validando os 4 atributos
> Quando o usuário cita times reais, o Mira **sempre pesquisa o último jogo
> disputado de cada time citado** (ou o jogo do dia) e valida, para cada titular
> que COMEÇOU o jogo, **4 atributos obrigatórios**, nunca deduzidos de memória:
>
> 1. **Nome**: o onze que de fato começou, não "escalação provável" nem
>    time-base. Se um titular habitual não começou (lesão, rodízio, suspensão),
>    entra quem começou de fato.
> 2. **Número**: da numeração oficial do torneio (ex.: lista da CBF). Sem fonte
>    confiável, aproxime e MARQUE como não confirmado no reporte.
> 3. **Posição**: o slot real na formação (ponta esquerda x direita, lateral,
>    volante, centroavante), confirmado na fonte; a ordem do array `players`
>    codifica isso. (Ex. real: Vini Jr. é ponta ESQUERDA, nunca direita.)
> 4. **Aparência pública**: `skin` e `hair` refletindo a aparência real e
>    amplamente conhecida do atleta. **Método validado: confirmar por FOTO**,
>    baixando a imagem oficial de cada jogador (API da Wikipédia:
>    `action=query&prop=pageimages&pithumbsize=330`, título URL-encoded) e
>    OLHANDO a imagem, cruzando com mídia especializada quando houver. Memória
>    não vale como fonte (já errou Gabriel Magalhães, Casemiro, Cunha, Pedersen,
>    Heggem, Wolfe e Nusa). Em dúvida, use o tom mais provável e marque como
>    aproximação.
>
> **Fonte preferencial: sites locais/oficiais de cada time** (federação ou
> imprensa local do país; ex.: ge.globo/CBF para o Brasil), cruzando com uma
> segunda fonte. Busque também a **cor do uniforme de goleiro** e a **cor do
> calção** (`shorts`). O reporte final cita as fontes e lista explicitamente o
> que ficou como aproximação. Um jogador sem qualquer um dos 4 atributos é um
> erro de geração, não uma opção.

Quando o pedido **não** tiver times reais ("um time azul e um vermelho, 11 contra 11"), pule a pesquisa: gere direto com as cores pedidas e números sequenciais (`name` vazio; o usuário renomeia no slide com duplo clique).

## Schema da CONFIG (`TACTICS`)

Reescreva apenas este objeto no topo do `<script>`:

```js
var TACTICS = {
  sport: 'futebol',
  orientation: 'horizontal',      // ou 'vertical' (tecla V vira em runtime; ?vertical=1 na URL)
  eyebrow: '',                    // oculto se vazio (padrão)
  title: 'Brasil x Noruega',      // no SVG, caixa alta com "x" minúsculo
  teams: [{
    name: 'Brasil',
    color: '#FFDF00',             // cor da camisa
    shorts: '#1D50C8',            // calção e borda da camisa
    goalie: '#5B5F63',            // uniforme do goleiro (o mais real possível)
    formation: '4-3-3',           // 4-3-3 | 4-4-2 | 3-5-2 | 4-2-3-1 (11 jogadores); fora disso, grade
    side: 'left',                 // 'left' | 'right'
    players: [
      { num: '1', name: 'Alisson', gk: true, skin: 'clara', hair: 'ruivo' }
      // ... um por jogador; a ORDEM casa com os slots da formação
    ]
  }, { /* time 2 */ }],
  arrows: [],                     // padrão: vazio (campo abre limpo)
  shapes: []                      // padrão: vazio
};
```

Regras: o goleiro tem `gk: true` e vem primeiro; a ordem dos `players` casa com as posições da formação (goleiro, defesa, meio, ataque); `side` separa as metades; cores em hex (se as camisas forem parecidas, escolha um tom distinto para um deles e avise). O motor desenha campo de futebol; times com nº de jogadores diferente de 11 (ou formação desconhecida) são posicionados em grade.

> ### DIRETIVA: a base começa SEMPRE com os dois times completos em formação
> O `TACTICS` inicial traz os **dois times completos** (11 x 11, ou o elenco cheio combinado) na **formação real**, posicionados pelo motor — **sem `u,v` absolutos no config**. Gol, jogada ou lance é sempre um **quadro gravado** (`data/*.json`) por cima dessa formação cheia, nunca um elenco reduzido com posições fixas como estado inicial; a animação (fluida no telão e no remote) reconstrói o lance a partir daí. Para congelar um momento, navegue até o quadro; não corte o elenco nem cole `u,v` absolutos no `TACTICS`.

> ### DIRETIVA: todo time SEMPRE tem goleiro
> Nenhuma mesa sai sem os dois goleiros, com `gk: true` e uniforme próprio (`goalie`). Como a base começa 11 x 11 na formação, o goleiro já entra no gol pela própria formação. Um time sem goleiro é erro de geração.
>
> **Cuidado com jogadas salvas ao alterar o elenco:** os `id` são sequenciais na ordem do array (time 1 e depois time 2), então inserir/remover jogador desloca os `id` seguintes e desalinha os `.json` de `data/`. Prefira **acrescentar o goleiro no fim do array do time** e, se algum id posterior mudar, **remapeie as chaves dos frames** nos `.json` afetados (jogadores ausentes de um frame ficam parados na posição da CONFIG, então o goleiro fica no gol durante a jogada).

## Barra de ferramentas (janela flutuante)

Só ícones com tooltip, sem rótulos de texto, `zoom: 1.21`, arrastável pela alça ⠿. **SEM botão de ocultar** (decisão explícita: usuário se trancava para fora); ocultar/mostrar é só pela tecla `F`. No modo vertical a barra cola no rodapé do slide e re-centraliza.

Ferramentas: ✥ mover/selecionar (arrasto no vazio = seleção em caixa; grupo move junto), adicionar jogador com um MINI BONECO nas cores de cada time, ➜ seta, ✎ paint (desenho livre com glow, tecla `P`), ▭/◯ zonas, ✕ apagar setas/zonas/traços, 🗑 apagar jogador (clique no jogador), 💾 salvar tudo da mesa no navegador, paleta de 6 cores (setas/zonas/paint), ●/⛹ estilo das peças, ⟳ virar, ↺ desfazer, ⌧ limpar (setas+zonas+traços), 🎬 abre/fecha o painel de jogada (mesmo que a tecla `R`; essencial no celular/touch), `?` help (painel "COMANDOS" com fechar estilo macOS sempre visível; Esc fecha).

## Gravação de jogada (quadros-chave, tecla R)

Janela flutuante própria "JOGADA" (arrastável, aberta/fechada por `R` ou pelo botão 🎬 da barra — o botão é a única via no celular/touch), que nasce dentro do campo, canto inferior esquerdo. No primeiro `R` sem quadros, a cena atual vira o quadro 1 automaticamente.

- ⏺ Quadro captura um snapshot (jogadores + bola); contador `atual/total`.
- ▶ Play / ⏸ (barra de espaço) interpola entre quadros (1,2s por trecho) numa **linha do tempo única** da jogada: ease só no começo e no fim, movimento linear entre os quadros intermediários (flui sem parar em cada quadro; nunca aplicar ease por trecho, que dá "pula-pula"). O trote dos bonecos roda por cima; tocar no campo pausa.
- ✓ ATUALIZA o quadro atual com as posições da tela; ⌫ apaga só o quadro atual; ⏮ ◀ ▶| navegam; ✕ apaga todos. **Ordem dos botões (UX, não mudar):** ⏺ · contador · ✓ · ⏮ ◀ ▶ Play ▶| · ⌫ ✕ · | · 💾 ▤ (destrutivos juntos no fim, ⌫ longe do ⏮).

### Persistência: um JSON por jogada em `data/`

As jogadas são ARQUIVOS `.json` na pasta `data/` do deck (`decks/<nome>/data/<slug>.json`), no schema `mira-tactics-play/1`:

```json
{
  "schema": "mira-tactics-play/1",
  "name": "contra-ataque pela esquerda",
  "title": "Brasil x Noruega",
  "frames": [
    { "players": { "1": [0.045, 0.5] }, "ball": [0.5, 0.5] }
  ]
}
```

Ids de jogador são sequenciais na ordem da config (time 1 depois time 2); coordenadas u,v normalizadas 0..1. Escrita/leitura via File System Access API do Chrome: **ao apertar `R`, a lista de jogadas carrega automaticamente da pasta `data/`** (na primeira vez o picker abre sozinho e o usuário confirma; conectada, vale a sessão inteira). Jogada carregada (▶) fica com o nome pré-preenchido, então 💾 sobrescreve o mesmo arquivo; cada linha da lista tem 💾 próprio. Fallback sem a API: 💾 baixa o .json e ⇪ importa um avulso. Esse JSON é também o contrato de saída do futuro pipeline vídeo→jogada (YOLO; ver `dev/brainstormings/BRAINSTORM_VIDEO_PARA_JOGADA.md`): **não quebrar o schema**. Um exemplo embarcado vive em `mira-templates/decks/mesa-tatica/data/vini-correndo.json`.

## Vertical (/mira-vertical)

Não aplique o reflow genérico da skill `mira-vertical`: aqui o campo apenas **gira 90 graus**. Três formas: `orientation: 'vertical'` na CONFIG, `?vertical=1` na URL, ou tecla `V` ao vivo. A formação é preservada; não crie arquivo novo só para virar.

## Atalhos

| Tecla | Ação |
|---|---|
| F | mostra/oculta a barra de ferramentas |
| P | liga/desliga o paint |
| R | abre/fecha o painel de jogada (1ª vez grava o quadro 1) |
| V | vira o campo |
| espaço | play/pausa da jogada |
| Ctrl+Z | desfazer |
| Delete | apaga selecionados |
| Esc | fecha help/lista ou limpa seleção |
| duplo clique | renomeia o jogador (nº e nome); Enter/clique fora salva, Esc cancela |

## Passos

1. **Interpretar o pedido:** times, cores, nº de jogadores, orientação.
2. **Pesquisar o último jogo de cada time** (via `WebSearch` + `WebFetch`) e validar os **4 atributos** de cada titular (nome, número, posição, aparência por FOTO), mais cores de camisa, calção e goleiro. Só pule se não houver times reais.
3. **Copiar o motor de referência** (ver "Fonte da verdade") para `decks/<nome>/index.html` e criar a pasta `decks/<nome>/data/` (vazia) para as jogadas.
4. **Reescrever o `var TACTICS = { ... }`** com os dados: os **dois times completos (11 x 11)** na formação, sem `u,v` absolutos. Não toque no motor abaixo.
5. **Conferir:** os dois times completos (11 x 11) posicionados pela formação (sem `u,v` no config), 4 atributos em todos, goleiro com cor própria, cores distintas, campo abrindo limpo.
6. **Se for vertical:** `orientation: 'vertical'` (ou instruir `?vertical=1` / tecla `V`).
7. **Reportar:** caminho do arquivo, atalhos (F, P, R, V, espaço, Ctrl+Z), as fontes usadas e o que ficou como aproximação.

## Decisões de produto (não regredir)

1. Escalações reais validando os 4 atributos obrigatórios por jogador, com aproximações marcadas no reporte.
2. Campo abre limpo: sem setas/zonas pré-desenhadas.
3. Barra sem rótulos de texto; times como mini bonecos.
4. Sem botão de ocultar painéis; teclas F/R são a única via.
5. Número acima da cabeça, camisa limpa (borda na cor do calção).
6. Painel de jogada nasce dentro do campo, embaixo à esquerda.
7. Título e crédito dentro do SVG, alinhados às linhas laterais.
8. Aparência confirmada por FOTO; negro = 'escura', pardo = 'media'.
9. R carrega a lista de jogadas de `data/` automaticamente; primeiro R grava o quadro 1.
10. Botões destrutivos do painel de jogada (⌫ ✕) agrupados, longe do ⏮.
11. Jogada salva é atualizável (nome pré-preenchido + 💾 por linha da lista).
12. Não quebrar o schema `mira-tactics-play/1` (jogadas já salvas do usuário).
13. **Todo time sempre tem goleiro** (`gk: true`), posicionado pela formação (base sempre completa; ver decisão 23).
14. Renomear jogador (nº e nome) por duplo clique é robusto ao arrasto (detectado no `pointerup`, não só no `dblclick` nativo) e a área clicável cobre o número flutuante; **Enter e clicar fora salvam, Esc cancela**.
15. O motor expõe `window.miraTactics` (`getState`/`setState`/`onchange`) para o mira-remote espelhar peças, bola, setas, zonas e desenhos entre notebook e celular. Em `file://` (sem shell) `onchange` fica null e nada trafega (regressão zero). Não remover.
16. O painel de jogada abre também pelo botão 🎬 da barra (não só pela tecla `R`), para funcionar no celular/touch; e o estado da gravação (quadros, índice e painel aberto) entra no sync do `window.miraTactics`, então gravar/abrir num aparelho reflete no outro.
17. Bola "colada" ao portador: mover um jogador encostado na bola arrasta a bola junto (condução), até o usuário mover a bola para longe (desencosta). Limiar de contato ~32px no espaço do tabuleiro.
18. Reprodução da jogada numa linha do tempo ÚNICA (ease só no começo/fim, linear entre os quadros): flui sem parar em cada quadro. Nunca voltar ao ease por trecho.
19. Botão 💾 na barra salva TUDO da mesa no navegador (localStorage por deck): elenco (nº/nome/aparência), posições, bola, setas, zonas, desenhos e a jogada gravada; ao recarregar, restaura (se o elenco-base do TACTICS não mudou). É o único jeito de renomear/editar e não perder no reload.
20. Duas borrachas distintas: ✕ apaga setas/zonas/traços; 🗑 apaga jogador. Não voltar a apagar jogador com o ✕.
21. Ao salvar uma jogada em `data/`, o `.json` grava também um `roster` (id → nº/nome/aparência) e o load aplica; o schema segue `mira-tactics-play/1` (campo novo é opcional, jogadas antigas sem `roster` continuam carregando).
22. **Reprodução (▶ Play) NÃO é sincronizada por stream de posições no remote** (senão engasga o telão). Durante o Play, `getRemoteState` CONGELA o que muda a cada frame (posições e `rec.next`) e emite só UM comando `play: { token, playing, from }`; cada aparelho roda a PRÓPRIA `playRec` local a partir de `play.from` (fluido). O emissor incrementa `token` no `startPlay` (Play do usuário); o espelho ADOTA o token recebido em `setRemoteState` e chama `playRec` sem gerar outro (sem bounce). Enquanto `rec.playing`, `setRemoteState` retorna cedo (não deixa o sync cortar a animação local). Isso mantém o PC 100% fluido, pois some o trabalho por frame que competia com o rAF. **Nunca voltar a transmitir posições por frame durante o Play.**
23. **A base começa SEMPRE com os dois times completos (11 x 11) na formação definida, sem `u,v` absolutos no config.** Gol/jogada/lance vive em `data/*.json` (quadros gravados) por cima da formação cheia, nunca um elenco reduzido com posições fixas como estado inicial. Para mostrar um momento, navegue até o quadro; não corte o elenco.

## Checklist

- [ ] Slide gerado a partir do motor embarcado (só o `TACTICS` mudou; motor intacto).
- [ ] **Pesquisou o ÚLTIMO JOGO de cada time e validou os 4 atributos: nome, número, posição e aparência (por foto)**, em sites locais/oficiais, cruzando fontes.
- [ ] Citou fontes e marcou aproximações (número sem fonte, cor de goleiro, skin/hair em dúvida).
- [ ] `shorts` e `goalie` preenchidos, fiéis aos uniformes reais.
- [ ] **Os dois times completos (11 x 11) na formação definida, sem `u,v` absolutos no config**; gol/lance (se houver) mora em `data/*.json`.
- [ ] **Os dois goleiros presentes** (`gk: true`), posicionados pela formação.
- [ ] Campo abre limpo (`arrows: []`, `shapes: []`).
- [ ] Pasta `data/` criada no deck novo.
- [ ] Título em caixa alta com "x" minúsculo, alinhado à lateral esquerda; `eyebrow` oculto salvo pedido.
- [ ] Cores dos dois times distintas e fiéis.
- [ ] Vertical vira o campo (orientation/`?vertical=1`/tecla `V`) sem quebrar a formação.
- [ ] Preserva a Regra Zero do Mira (loops perpétuos: varredura de luz, trote dos bonecos, halo).
- [ ] Texto em português correto, sem travessão.
