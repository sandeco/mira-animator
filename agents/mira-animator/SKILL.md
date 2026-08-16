---
name: mira-animator
description: >-
  Cria e evolui a animação de um slide como METÁFORA visual animada (o M de MIRA): destila o conceito, acha uma analogia concreta do cotidiano e a anima com loop interno obrigatório, em D3.js v7+ ou CSS 3D, no padrão dos decks de mira-templates/decks/ (glass-card, icon-hero, attribute-pills, replay-btn). Dois modos, CRIAR um slide animado novo e SUBSTITUIR a animação de um slide existente no lugar. Use SEMPRE que o usuário disser "/mira-animator", "criar slide animado", "novo slide com animação", "adicionar card com D3", "anima essa figura", "transforma isso num slide animado", "slide criativo para o deck", "looping na animação", "animação contínua", "metáfora animada", "transforma em metáfora", "cria uma analogia", "vira metáfora", "quero uma metáfora pra esse conceito", "metáfora visual", ou pedir para animar, reanimar ou reexpressar um conceito do deck.
---

# Skill: Metáfora Animada com Looping Interno

MIRA é **Metáforas Inteligentes Responsivas Animadas**. A metáfora não é um modo especial desta skill, é o produto dela.

## REGRA ZERO

Toda animação DEVE ser **uma metáfora**, DEVE ser **uma história** e DEVE ter **loop interno perpétuo**.

- **Metáfora:** analogia concreta do cotidiano, nunca o diagrama do próprio conceito.
- **História:** começo, transformação e desfecho. Se a cena couber em "o ícone A vira o ícone B" ou "os elementos pulsam", está rasa. Morph, draw e motion path são vocabulário a serviço da história, não a história.
- **Loop:** entrar com fade-up e parar é proibido. Algo continua em movimento depois da entrada.

Antes de codar você tem que conseguir dizer as três frases. Ex.: *"débito técnico é uma torre que ganha um bloco sozinha"*, *"ela inclina até alguém tirar um bloco"*, *"a cada ciclo entra um bloco novo"*.

## Se o deck tem conceito alinhado, ele é REFERÊNCIA

Alguns decks têm uma pasta `storyboard/` com `concept-brief.md` e quadros em `approved/`. Ela nasce
quando o autor **pede explicitamente** o `/mira-concept-align` e o `/mira-storyboard`, porque a ideia
estava confusa e ele quis clarear antes de produzir. É fluxo alternativo, não o caminho normal.

**Deck sem essa pasta: nada muda. Comportamento de hoje, byte por byte.** É a maioria dos decks.

Existindo a pasta, uma obrigação só:

**Leia o `storyboard/concept-brief.md` antes de escrever a animação, e não contrarie o que está
lá.** A metáfora, os elementos obrigatórios e as interpretações proibidas já foram decididos pelo
autor; você implementa, não reinventa. É material de consulta, do mesmo jeito que `references/`.

Enxergando necessidade de contradizer (a metáfora aprovada não funciona visualmente, um elemento
obrigatório não cabe): **argumente ao autor**, citando a seção do brief. Não decida sozinho, e não
obedeça cegamente. A autoridade sobre o significado é dele.

Opcionalmente, e só se ajudar, declare qual quadro o slide realiza:

```html
<!-- @MIRA:CONCEPT quadro="approved/slide-03.svg" intent="a distância para a fonte original aumenta" -->
```

O marcador **não é obrigatório**. Ele serve ao `npx mira-animator storyboard verify <deck>`, que o
autor roda quando quiser conferir se a referência chegou nos slides. Nada trava sem ele.

## Método obrigatório: A/B, portões, escolha

Rode ANTES de qualquer linha de código, em qualquer modo e template. **É proibido implementar a primeira metáfora plausível**, e o custo disso é baixo de propósito: um A/B, não um brainstorm.

1. **Dinâmica como causa:** `Quando [causa], [estado] muda de [A] para [B] porque [mecanismo]. Se [falha], [consequência].`
2. **A/B, duas candidatas e só.** **A** é a que veio à cabeça primeiro, anote sem julgar. **B** é obrigatoriamente de **outra família de domínio** (casa, rua, trabalho manual, natureza, corpo, transporte, comércio, jogo): se A é cozinha, B não pode ser restaurante. Proibido pensar em coreografia ou técnica aqui, só sistemas do mundo. É a distância entre as famílias que mata o clichê, não a quantidade de candidatas.
3. **Mapeie** papel, estado, ação causal e evidência visual de cada uma. ❌ *Rejeite quem preserva os substantivos mas troca direção, condição, ordem ou consequência, e quem deixa parte sem correspondente dos dois lados.*
4. **Contrafactual:** a MESMA cena mostra o que acontece se uma parte falha, atrasa ou não age. ❌ *Se precisar de outra analogia para mostrar a falha, é rasa.*
5. **Especificidade.** ❌ *Se a cena servir sem alteração para três conceitos não relacionados, é decoração.*
6. **Distância útil.** ❌ *A associação lexical imediata (orquestração → maestro, fluxo → rio, memória → gaveta) perde o desempate: só vence se a outra falhar num portão duro.*
7. **História:** estado inicial, causa, transformação, consequência, recuperação. ❌ *Se só der "A vira B" ou "tudo pulsa", volte ao passo 2.*
8. **Loop da AÇÃO PRINCIPAL** em uma frase. Ambiente, brilho, órbita e pulso não contam. ❌ *Sem loop descritível, não serve.*

Compare A e B nos portões e implemente quem ganhar. **A pode vencer**, desde que vença; proibido é implementar A sem olhar para B. Gere uma terceira candidata só se as duas falharem ou empatarem de verdade, de família ainda não usada. Rodada extra por hábito é token à toa.

**Se o usuário rejeitar a metáfora entregue**, não conserte a animação: a analogia é que está errada. Volte ao passo 2, descarte a família inteira e traga outra. Polir metáfora reprovada é polir o erro.

## Exemplo de calibração

**Conceito:** orquestração de agentes. **Candidata A:** maestro e naipes pulsando em uníssono. Parece boa, e é fraca: é a associação lexical de "orquestração" (passo 6), mostra sincronia e não integração de entregas parciais (passo 3), nada acontece se um naipe atrasa (passo 4), e "todos pulsam juntos" serve igual para colaboração, consenso ou rede (passo 5).

**Candidata B:** cozinha profissional com passe de expedição. Comanda = tarefa, estações = agentes, expedidor = orquestrador, componentes do prato = dependências, prato completo = resultado, espaço vazio no prato = falha. **História:** a comanda entra, cada estação faz sua parte no próprio ritmo, o expedidor monta o prato, vê uma parte faltando, segura a saída, recebe o atrasado e libera. **Loop:** o prato sai e outra comanda entra. Carrega dependência, atraso e consequência, que a orquestra não carrega.

Isto é padrão de **processo**, não biblioteca: não reutilize cozinha, comanda ou passe sem justificativa causal própria.

## Deck inteiro: método em lote

Escopo de um slide só: rode o método normal. Escopo do deck todo (caso comum do modo SUBSTITUIR sem slide indicado): **não repita o método inteiro slide a slide**, isso estoura o contexto e o método vira teatro. Faça em duas passadas. **O lote muda ONDE cada portão roda, nunca dispensa nenhum.**

**Passada 1, quadro de metáforas do deck**, uma vez só, rodando os passos 1, 2, 3, 5 e 6:

1. Frase causal de cada slide.
2. Com as frases lado a lado, **distribua as famílias de domínio** entre os slides antes de inventar qualquer cena. O deck não pode morar em duas famílias.
3. A/B de cada slide, **compartilhando o pool**: candidata já usada em outro slide está queimada, e isso só se vê com o quadro montado.
4. Aplique os portões baratos (mapeamento, especificidade, distância lexical). São eles que ELEGEM a metáfora; escolher antes inverte o método.
5. Feche o quadro: slide, frase causal, metáfora eleita, família, verbo causal, assinatura temporal. O quadro já é o ledger preenchido, planejado em vez de checado depois.

**Passada 2, slide a slide**, com os passos 4, 7 e 8 sobre a metáfora eleita (contrafactual, história, loop), depois beat sheet, rubrica e código.

Reprovou na passada 2? Use a candidata perdedora do A/B daquele slide, se for de família livre, ou gere uma substituta dentro da família atribuída. O quadro segue válido; só reapresente se a própria família mudar. **Acima de 4 slides, apresente o quadro ao usuário antes de codar**: vetar ali é barato, depois de implementado é caro.

## Ledger de diversidade

Antes de aprovar, anote de cada slide animado do **mesmo deck**: sistema do cotidiano, família de domínio, verbo causal, silhueta dominante, organização espacial, movimento principal e assinatura temporal. Assinaturas possíveis: acumulação com colapso, rajada com pausa, fluxo interrompido, alternância, onda em cascata, perseguição, compressão e liberação.

**Rejeite** a candidata que: reutiliza sistema do cotidiano de qualquer outro slide; repete a família de um vizinho; coincide com um vizinho em 4 dos 6 eixos (verbo, silhueta, espaço, movimento, tempo, reinício); repete o movimento dominante de um adjacente; ou usa partícula, órbita ou pulso como movimento dominante quando outro slide do deck já usa.

Repetição só vale como motivo narrativo pedido pelo usuário, e aí varia mecanismo, consequência, enquadramento e ritmo. Ao entregar, informe a assinatura: `domínio | verbo | silhueta | espaço | movimento | tempo`.

## Direção de movimento

### Temperamento, escolha antes da beat sheet

O temperamento decide quantos beats cabem e que easing vale, então ele vem primeiro. **`sereno` é o padrão. `tenso` só entra quando o usuário pede tensão na cena** (uma torre desabando, um alarme). Pedido implícito não conta.

| | `sereno` (padrão) | `natural` | `tenso` |
|---|---|---|---|
| Ciclo do loop | 9 a 14 s | 7 a 10 s | 4,5 a 7 s |
| Beats | 4 a 5 | 5 a 6 | 6 a 7 |
| Janela mínima entre eventos focais | 1200 ms | 800 ms | 500 ms |
| Repouso antes de reiniciar | 1,2 a 2,0 s | 0,8 a 1,2 s | 0,4 a 0,7 s |
| Atraso causa e efeito | 250 a 500 ms | 150 a 350 ms | 120 a 250 ms |
| Famílias de easing | `sine`, `power1`, `power2` | `power2`, `power3` | `power4`, `expo`, `back` |
| Atores em movimento simultâneo | 1 focal, 1 ambiente | 1 focal, 2 apoios | livre |
| Duração de cue de câmera | 1,5 a 2,5 s | 1,0 a 1,8 s | 0,3 a 0,8 s |
| Cues de câmera por cena | no máximo 2 | no máximo 3 | livre |

As duas últimas linhas só valem em cena com câmera. Sem câmera, são inertes, não impedimento.

**Regra do repouso.** Todo ciclo contém pelo menos **um trecho de 1 segundo em que nada focal se move**. Só ambiente. É a respiração da cena, e é o que separa uma animação de um letreiro luminoso. Some as durações mais o repouso: se não sobrar janela contínua de 1000 ms sem evento focal, tire um beat ou estenda o repouso. Nunca encurte a janela.

**O ciclo longo é deliberado.** O slide é visto enquanto alguém fala por cima dele. Ciclo longo não cansa, ciclo curto sim. Se 4 beats parecerem pouco para 9 segundos, aumente a duração de cada beat ou resolva o estado vivo por deriva lenta; não acrescente beat.

Declare o temperamento na primeira linha da beat sheet: `Temperamento: sereno · ciclo 11 s · 4 beats · repouso 1,6 s`.

### Beat sheet

Antes de codar, escreva uma **beat sheet** com acontecimento, ator focal, duração, easing ou física, estado resultante. O número de beats e a duração do ciclo saem da tabela do temperamento escolhido.

1. **Uma ação por vez.** Em qualquer janela de 500 ms, no máximo um acontecimento focal. O resto apoia.
2. **Causa antes do efeito.** O efeito começa depois da causa, no atraso da linha "atraso causa e efeito" do temperamento. Mesmo frame vira decoração sincronizada.
3. **Antecipação.** Preparação curta antes da ação (recuo, compressão, inclinação, pausa), 8% a 15% do tempo dela.
4. **Peso.** Pesado acelera devagar, arco menor, quase sem overshoot. Leve acelera rápido, admite overshoot e follow-through maior.
5. **Easing semântico.** Fluxo uniforme linear; queda ease-in; chegada e dissipação ease-out; orgânico sine-in-out. **Deslocamento de objeto (ator viajando de A a B) usa por padrão o perfil explode-assenta**: `miraMotionBlur.explodeAssenta(h, k)` do `mira/mira-motion-blur.js` (instale o helper se o deck não tiver), explosão em velocidade máxima até a metade do tempo e chegada em cauda longa, rastejando. Em `sereno`, alongue a janela do deslocamento em vez de trocar a curva; pedido do autor veta ou troca. Nunca o mesmo easing em tudo, e sempre dentro da família do temperamento. **`back`, `elastic` e `bounce` ficam fora do padrão**, liberados só em `tenso` ou quando a física da metáfora os exigir (uma mola é uma mola, e a beat sheet declara o motivo). São as curvas que produzem overshoot visível, e overshoot repetido faz a cena parecer agitada mesmo quando é lenta.
6. **Hierarquia.** Um ator primário e no máximo dois movimentos secundários. Durante a ação principal o ambiente perde contraste, amplitude e velocidade.
7. **Leitura da consequência.** Segure o estado resultante antes de reiniciar, pelo tempo da linha "repouso" do temperamento.
8. **Follow-through.** Depois de impacto ou parada, partes flexíveis e rastros continuam 150 a 500 ms.
9. **Arcos.** Objeto transportado, lançado ou articulado não anda em reta sem justificativa mecânica.
10. **Loop invisível.** Reinicie na saída de quadro, oclusão, retorno natural ou troca de ciclo. Nunca teletransporte o estado inteiro na cara do espectador. Em `sereno`, a forma preferida do estado vivo é **deriva lenta contínua**: algo que respira, oscila devagar ou avança de forma quase imperceptível, em vez de repetir visivelmente o gesto focal. Ação focal repetindo a cada 5 segundos é o que mais cansa numa apresentação longa.

Movimento ambiente não é narrativa. Se a beat sheet puder ser trocada por "tudo pulsa", volte à metáfora.

## Autoavaliação antes de entregar

Pontue com uma evidência concreta por linha. Polimento não compensa causalidade fraca.

| Critério | Peso | Veto |
|---|---|---|
| **Fidelidade causal.** Papéis, direção, condição, ordem e mecanismo correspondem. | 25 | Só associação temática ou lexical. |
| **Consequência e contrafactual.** A causa muda estado visível, e a cena aguenta a falha. | 20 | Movimento sem mudança de estado. |
| **Ganho pedagógico e especificidade.** Ensina o que o título não dá, não serve para conceito alheio. | 20 | Cena intercambiável. |
| **História e loop.** Estado inicial, causa, transformação, consequência e reinício legíveis, corte escondido. | 15 | Entrada seguida de ambiente. |
| **Direção de movimento.** Timing, antecipação, peso, easing, hierarquia e follow-through coerentes. | 10 | Tudo junto ou mesmo easing em tudo. |
| **Diversidade.** Passa no ledger e contrasta com os vizinhos. | 10 | Repete domínio, silhueta, composição e movimento. |

**Corte: 85 de 100 e nenhum veto.** Abaixo disso, volte ao A/B ou à beat sheet. Não entregue "o que deu para fazer".

**A nota é avaliada com o cinema desligado.** Câmera, luz, grade de cor e atmosfera entram depois de a cena passar, nunca para fazê-la passar. Se ao desligar os quatro a animação deixa de contar a história, a história não existia.

**A nota é sobre o plano**, antes de codar. Não invente que assistiu à animação: a conferência no navegador é do usuário. Ao entregar, diga o que ele deve olhar (a história aparece com o título escondido? o corte do loop aparece? o Replay deixa dois atores correndo juntos?).

## Os dois modos

Mesma skill nos dois casos, o que muda é onde o resultado pousa.

**CRIAR** (padrão, etapa 5 do pipeline): slide novo em `decks/<tema>/index.html` (ou `decks/<tema>/index.html`, conforme o fluxo). Você monta o card inteiro. Se o deck não existir, crie a partir de um esqueleto de `mira-templates/decks/` (mira-default é o padrão; também aula-capitulo, pitch-projeto, demo-tecnica, sandeco-just-animation-template).

**SUBSTITUIR** (retrofit de palco existente, "transforma esses slides em metáforas", "essa animação está fraca"):

- Troca a animação **no lugar**: mesmo id de stage (`#st-XXXX` / `#sv-XXXX`), mesmo título, subtítulo e pílulas. Só o palco muda, com no máximo um ajuste leve de subtítulo para amarrar a analogia.
- Não reescreve título, pílulas nem cores, não reordena o deck, não cria slide novo.
- Reescreva a função daquele stage no `<script>`, mantendo trigger e Replay, e **reinicie o marcador para `<!-- @MIRA:SIZE 3/10 -->`**.
- Escopo: slide indicado → só aquele. Sem indicação → todos os animados do deck.

## Vocabulário de coreografia

Arrumações espaciais que o Mira já sabe montar. São **vocabulário de última hora**: a beat sheet já decidiu quem age e com que consequência, aqui você só acha a geometria que serve.

Hub-and-spoke, staircase com um ator subindo, duas colunas em confronto com centro que arbitra, flip cards 3D, grade que reage em cascata, trajetória entre nós com carga que viaja.

**Não existe mapa conceito para formato.** Se pensou "isso é comparação, então battle arena", parou no atalho: volte à beat sheet e pergunte que geometria a HISTÓRIA exige. Se outra metáfora qualquer pudesse ocupar a mesma composição com os mesmos tempos, refaça. Pulso em uníssono, órbita e partícula genérica ficam fora desta lista de propósito, viraram muleta. E nada de "8 cards retangulares enfileirados" (o usuário já reclamou).

## Motion blur (efeito de velocidade)

Efeito **opcional** para DISPAROS: um ator que estava parado cruza o quadro rápido. **Nunca é padrão**: slide sem disparo não recebe nada, e "sem motion blur" no pedido do autor veta o efeito. Dose: o rastro é o corpo do efeito e cabe em qualquer disparo; o blur é acabamento e só aparece no pico da velocidade.

Helper: `mira/mira-motion-blur.js` (copie de `templates/authoring/` ou de `mira-templates/authoring/` se o deck não tiver), com a tag logo após o d3: `<script src="mira/mira-motion-blur.js"></script>`. A API está documentada no cabeçalho do próprio arquivo. Três regras que não se negociam:

- **Força = velocidade normalizada** (`miraMotionBlur.forca(vel, pico)`), com `vel` por diferença central da função do movimento. Parado, tudo desliga sozinho e o repouso fica limpo.
- **Rastro analítico** (`.eco()`): o fantasma k é a posição de onde o ator estava há `k*passo` ms, tirada da própria função do movimento. Nunca guarde histórico de posições: o regente congela e zera o relógio, e histórico vira lixo na tela.
- **Blur direcional**: movimento reto usa `.filtro()` aplicado no grupo rastro + ator, o conjunto borra num risco contínuo. Trajetória curva usa `.ator()`, que gira o blur para o ângulo do voo, com o rastro fora do rig, nítido.

O perfil de velocidade padrão do disparo é o **explode-assenta** (`miraMotionBlur.explodeAssenta()`, regra 5 da beat sheet): normalize a força com o `.pico` anexado à função (`picoMs = ease.pico / duraçãoMs do disparo`).

## Ícone flat como ator, não bolinha

O círculo (dot, partícula, satélite, anel, pulso radial) é legítimo só para o **genuinamente abstrato**: fluxo, energia, sinal, conexão, propagação. Para o resto, empobrece.

**Com referente concreto, o ator é um ícone reconhecível.** Se dá para nomear o objeto (livro, engrenagem, foguete, chave, moeda, funil, bússola), anime o objeto. Vale igual para o que a metáfora trouxe: se a analogia é a despensa, desenhe a despensa.

**Flat é o estilo**, silhueta cheia, cantos suaves, pouco detalhe, leitura instantânea na projeção. É o oposto do traço fino vazado do Lucide, que fica só na moldura do card.

- **Inline como `<path>`** no mesmo `<svg>` da animação. Dentro do SVG nunca use `<i data-lucide>`.
- **O ícone é o ator do loop**: age, sofre a consequência e se recupera dentro da beat sheet. Parado no centro é proibido. Evite resolver o loop com órbita ou pulso, que é a muleta que esta regra veio corrigir.
- **Cor da paleta do deck, preenchimento cheio.** No deck card laranja/preto, recolore para laranja e neutros. Nunca cor fora do tema num deck card.
- **Fonte aberta apenas**, licenças MIT, Apache-2.0, CC0 ou CC-BY: Google Material Symbols (eixo *fill*) ou API do Iconify. Prefira path único, viewBox `0 0 24 24`. Embuta inline, o deck roda offline por `file://`. Atribuição no `CREDITS.md` se a licença pedir; recuse IP protegida e sugira arte original.
- Slide inteiro de morph de ícones já é o `/mira-icon-morph`.

### Proibido desenhar à mão

Ícone flat resolve objeto. Não resolve o que tem anatomia. Estes referentes **nunca** viram `path`
escrito por você: **figura humana** (inteira ou parte), **mão, braço, perna**, **rosto ou feição**,
**animal**, **veículo**, **anatomia articulada**, **objeto de uso cheio de detalhe**. Sai trapézio
com bola em cima, e já saiu.

Caiu na lista, chame o **`/mira-asset-scout`**: ele acha o SVG em fonte aberta e o embute inline, ou
pede o arquivo ao autor com plano B. Só volte a desenhar quando ele devolver DESENHAR.

## Texto e título

- **Idioma:** siga `agents/_shared/idioma.md`. Português brasileiro, acentuação correta, UTF-8 direto, `<meta charset="UTF-8">`. Nunca Unicode escapes (`é`) nem entidades (`&eacute;`).
- **Proibido travessão (—)** em qualquer texto: use vírgula, dois-pontos ou reescreva. Ênfase via `<span class="primary-color italic">`.
- **Título sem ícone**, nenhum `icon-hero` ou `<i data-lucide>` acima ou ao lado do `<h2>`. Ícones só dentro do card.
- **No máximo 6 palavras no título**, salvo pedido explícito.
- **Título colado no topo:** `<section>` com `px-6 pt-3 pb-6`, wrapper sem `pt-10`, bloco do título fechando com `mb-2`.
- **Capa com quebra equilibrada (diretiva):** segue `agents/_shared/titulo-capa.md`, `text-wrap: balance` escopado só à capa (`body > section:first-of-type h1, body > section:first-of-type h2`). Só a capa, slides de conteúdo não precisam.
- **O palco ocupa o quadro inteiro e o título flutua por cima dele** (`mira-default`). O `palco()` mede o título e devolve a faixa livre: `F.topo`, `F.alturaUtil` e `F.vy(k)`. **Use `F.vy(k)` no lugar de `F.H * k`** para toda coordenada vertical: `F.H * .24` vira `F.vy(.24)`. Nada FOCAL acima de `F.topo`. Movimento de ambiente pode atravessar, porque atrás do título ele lê como profundidade, não como conflito.

## Variante: sandeco-just-animation-template (animação pura)

Deck sem cards. As regras de card (título, subtítulo, pílulas, glass-card, icon-hero, .anim-stage) ficam SUSPENSAS. **O método da metáfora continua valendo integralmente**, aqui com mais peso, porque a animação é a única coisa na tela.

- **Sem texto sobreposto.** Só a animação de tela cheia sobre fundo preto. Labels mínimos DENTRO do SVG (parte da metáfora) são permitidos; título de slide, não.
- Cada slide é uma `<section class="slide">` filha direta do `<body>`, com `<svg class="stage">` full-bleed (`position: absolute; inset: 0`).
- **Enquadramento fixo:** `viewBox="155.15 87.27 969.70 545.45"` com `preserveAspectRatio="xMidYMid slice"` e marcador `<!-- @MIRA:SIZE 5/10 -->` acima do svg. Componha centrado em (640, 360) ocupando o palco inteiro, sem reservar topo.
- **Paleta LIVRE multicor**, alto contraste com o preto, nenhuma cor predominante. NÃO trave em `var(--mira-primary)`. Distribua `#00E5FF`, `#7CFF6B`, `#FFD166`, `#FF5C8A`, `#B388FF`, `#FF904D` e branco.
- Mantém loop perpétuo, anti-vazamento (`window.__slugGen`), trigger e Replay. Novo slide: duplique a `<section>` e registre em `ANIM.sN`.

## Variante: mira-default (template PADRÃO do Mira)

É o template que o `npx mira-animator new` usa quando ninguém pede outro. Um slide é **um título em cima e a animação ocupando todo o resto do quadro 16:9**. Sem card, sem pílulas, sem moldura: a animação É o slide.

Estrutura de um slide de conteúdo (é o contrato, não sugestão):

```html
<section>
    <div class="slide-main">
        <h2>Título <span class="accent">com destaque</span></h2>
        <div class="anim-stage"><svg id="SLUG-svg" preserveAspectRatio="xMidYMid meet"></svg></div>
    </div>
</section>
```

Capa e encerramento trocam `.slide-main` por `.slide-centro` (texto centrado, sem palco).

- **O palco é o QUADRO INTEIRO.** `.anim-stage` é `position: absolute; inset: 0` e cobre a `<section>` de borda a borda, por baixo do título. Não é mais "o que sobra depois do título". Case o `viewBox` com a caixa real (`getBoundingClientRect`) em vez de fixar `0 0 1280 720`, senão o desenho estica quando a altura do slide muda.
- **O título flutua por cima, e a animação desvia dele.** O `palco()` mede o título e devolve a faixa livre: `F.topo`, `F.alturaUtil` e `F.vy(k)`. **Use `F.vy(k)` no lugar de `F.H * k`** em toda coordenada vertical. Nada FOCAL acima de `F.topo`; ambiente pode atravessar, porque atrás do título lê como profundidade, não como conflito.
- **Componha para preencher o quadro**, agora que ele é seu por inteiro.
- **Os 50px de padding do `.slide-main` são área segura das bordas.** Nada essencial encosta na borda.
- **UMA cor de marca dominante**, lida de `--mira-primary` / `--mira-accent-2`. Sem arco-íris.
- **Camada cinematográfica: só se o deck pediu.** Ver a seção abaixo.

## Modo cinema: câmera, profundidade e grade

**Só existe se o deck tiver `mira/mira-cinema.js`.** Confira o arquivo antes de escrever uma linha de câmera. Se não estiver lá, escreva a animação sem câmera, sem planos e sem grade, e diga isso na entrega. Nunca chame API que o deck não carrega.

O deck nasce com cinema quando é criado com `npx mira-animator new <nome> --cinema`, que instala o módulo e o GSAP e injeta as tags na ordem certa.

**O princípio:** o GSAP não anima elementos, anima ESTADOS, e os renderizadores derivam. Existem duas fontes únicas de verdade por palco, `cena.camera` e `cena.luz`. Você nunca escreve o `viewBox` na mão.

```js
const cena = MiraCinema.palco('slug-svg', { grade: 'noite-fria', seed: 41721 });

Prof.plano(cena, '#g-fundo',  { z: 0.85, desfoque: 2.5, escurecer: 0.35 });
Prof.plano(cena, '#g-meio',   { z: 0.45 });
Prof.plano(cena, '#g-frente', { z: 0.10 });
```

**A câmera NÃO se escreve em JS. Ela se escreve como marcador, dentro da `<section>`:**

```html
<section>
  <!-- razões: 1 foco na decisão do ator; 2 o impacto é o acontecimento da cena -->
  <!-- @MIRA:CICLO 12.0 BEATS 12 -->
  <!-- @MIRA:LOOP on -->
  <!-- @MIRA:VOLTA on -->
  <!-- @MIRA:FOCO 1 tipo=aproximar cx=480 cy=300 r=180 beat=2.0 dur=2.2 -->
  <!-- @MIRA:FOCO 2 tipo=tremor amp=0.01000 beat=8.8 dur=0.3 -->
  ...
</section>
```

O `mira/mira-foco.js` lê esses marcadores no load e monta a câmera dentro da `cena.tl`, chamando os
`Cam.*` por você. É o mesmo motor, com uma diferença que decide tudo: **a tecla C só enxerga
marcador**. Cue chamado inline via `cena.tl.add(Cam.aproximar(...))` roda, mas não aparece na
timeline do modo câmera, e o autor não consegue ajustar o que não vê. Foi o defeito medido no deck
de 2026-08-07: 27 cues em JS, 1 marcador, câmera ineditável. Por isso o contrato:

- **Todo cue de câmera nasce como `@MIRA:FOCO`.** Zoom é `tipo=aproximar cx= cy= r=`; travelling é
  `tipo=revelar cx= cy= r=`; pontuação é `tipo=tremor amp=`; estado é `tipo=tensao amp=`, com
  `loop=1` quando sustenta o ciclo. `beat` e `dur` aceitam fração.
- **Declare `@MIRA:CICLO <segundos> BEATS <n>` com `n` = segundos arredondado**, para 1 beat valer
  cerca de 1 segundo e o marcador ser legível por gente.
- **`@MIRA:VOLTA on` cobre o estabelecer no beat 0 e o recuar no fim.** Não escreva esses dois como
  foco. `Cam.segurar` é ausência de cue. Estabelecer no meio da cena é um foco de quadro cheio:
  `cx=W/2 cy=H/2 r=H/2`.
- **O elemento que a câmera enquadra tem posição FIXA no código, não sorteada.** Marcador guarda
  coordenada absoluta; coordenada que vem da semente não cabe num comentário. Visualmente dá no
  mesmo: o que importa é enquadrar UM prédio, não o prédio sorteado.
- **A razão de cada cue vai num comentário comum ao lado dos marcadores** (e no Motion Score, se
  houver). O campo do marcador só carrega número, e razão continua obrigatória: cue sem razão é
  câmera decorativa.
- **`Cam.*` inline só quando o efeito não existe no vocabulário do marcador** (um punch-in composto,
  um Vertigo), e aí com comentário no código dizendo por que não pôde ser marcador. É exceção
  justificada, não caminho paralelo.

| Peça | O que faz |
|---|---|
| `MiraCinema.palco(id, opts)` | cria a cena, casa o `viewBox`, dá uma timeline GSAP por palco, toca ao entrar em tela e congela ao sair. Substitui `palco()` + `reger()` |
| `Cam.estabelecer`, `aproximar`, `revelar`, `recuar`, `segurar`, `tremor`, `tensao` | os sete cues do motor. Quem os chama é o `mira-foco.js`, a partir dos marcadores; chamada direta na timeline é só a exceção justificada acima |
| `Cam.tremor(cena, {dur, amplitude, razao})` | impacto: ataque seco, cabeça curta em força cheia, queda. Escreve em `cena.abalo` |
| `Cam.tensao(cena, {dur, amplitude, razao})` | a mesma vibração do tremor, fraca, plana e longa. Escreve em `cena.tensao` |
| `Prof.plano(cena, seletor, {z, desfoque, escurecer})` | profundidade; `z` de 0 (colado) a 1 (infinito), parallax = `1 - z` |
| `Prof.foco(cena, {plano, dur})` | foco seletivo; é o ÚNICO lugar onde desfoque anima |
| `Grade.aplicar(cena, preset)` | `neutra`, `noite-fria`, `brasa`, `clinica`, `penumbra` |
| `cena.rnd()` | PRNG semeado. **Nunca use `Math.random()`** |
| `cena.aoAtualizar(fn)` | o tique livre: roda todo quadro, **independente da timeline**. Único canal para derivar câmera, luz e atmosfera |

**Tetos, e são números, não bom senso:**

- **`razao` é obrigatória** em `aproximar`, `revelar`, `recuar`, `tremor` e `tensao`. Cue sem razão é câmera decorativa.
- **Cues por cena:** no máximo 2 em `sereno`, 3 em `natural`, livre em `tenso`.
- **Planos:** de 3 a 5, nunca mais. Raio de desfoque no máximo 4.
- **`tremor`:** 400 ms é conselho, não corte. O motor honra até 1,2 s e avisa no console acima de 400 ms. Num slide gravado, tremor longo lê como falha de captura, não como intenção.
- **`tremor` contra `tensao`:** mesma vibração, papéis opostos. Tremor é **pontuação**, um instante, amplitude até 0,03. Tensão é **estado**, sustenta o tempo que a cena pedir, amplitude até 0,008. Tensão forte e curta vira tremor mal feito; tremor longo vira motor ligado.
- **Os cues coexistem, e é assim que efeito novo nasce.** `camera`, `abalo`, `tensao` e os planos são canais separados que o tique soma. Tensão sustentada com um tremor por cima durante um zoom é uma frase legítima, não conflito. O que conflita é dois cues do **mesmo** canal no mesmo intervalo. Se a direção pedir um efeito que não tem cue com esse nome (punch in, trovão, Vertigo), monte com os canais em vez de recusar: a lista de cues é o vocabulário, não a lista de efeitos possíveis.
- **Filtro de tela cheia animado é proibido.** Vinheta, grão e grade são estáticos.

**DOIS RELÓGIOS POR CENA. Partícula não anda no relógio da história.**

A timeline da cena obedece ao `@MIRA:LOOP` e à tecla L, então ela **para** num slide que fecha no último quadro. Poeira, fumaça, brasa e faísca não são a história: são o mundo continuando a existir. Presas à timeline, morrem junto e o último quadro vira foto.

- **História:** o callback de quadro na `cena.tl`. Move os atores, a luz, o texto. E **anota** o estado que a atmosfera precisa ler (onde a luz está, quanta intensidade).
- **Atmosfera:** `cena.aoAtualizar(fn)`, com relógio próprio acumulado. Move as partículas lendo a última anotação. Nunca para, exceto com o slide fora de tela ou o modo edição ligado.

Acumule o tempo da atmosfera, não leia o relógio de parede: ela pausa em três situações (edição, slide fora de tela, aba em segundo plano) e ler o relógio direto faria o ar saltar o buraco inteiro num quadro só ao voltar. Teto de 0,1 s por quadro resolve.

**Oclusão é doutrina, não API.** Resolva por ordem de empilhamento no SVG e máscara, e planeje pelo menos uma passagem atrás de alguma coisa: parallax sem oclusão continua lendo como recorte deslizante.

**Marque o que não pode engordar no zoom:** `data-mira-traco-fixo` no traço e `data-mira-texto-fixo` no texto. Sem isso, todo push-in engorda a arte, e o sintoma não sugere a causa.

**A trava que vale acima de tudo:** nenhum recurso de cinema pode ser a única mudança de estado da cena. **A nota de corte é avaliada com o cinema desligado.** Ele entra depois de a cena passar, nunca para fazê-la passar.

> **Existe um irmão para o caso contrário.** Quando o autor pedir explicitamente uma cena em que o cinema **é** a cena, a skill é a `/mira-cine-animator`. Ela herda este método inteiro por referência e inverte exatamente estas duas travas, e só elas. Aqui, a trava continua valendo sem exceção: não afrouxe por conta própria porque a cena ficaria bonita. Se o caso for esse, diga ao autor que existe o irmão e deixe a escolha com ele.

**Recurso novo que chegar aqui vale no irmão também, quando for viável.** A `/mira-cine-animator` não copia este arquivo, ela aponta para ele, então a herança é automática e não há nada a sincronizar. O que exige decisão humana é só o recurso que colidir com as duas inversões, e a exceção se registra lá.

> **Atenção ao tamanho.** O palco aqui é bem maior que o palco dentro de um card do `aula-capitulo`. Uma composição calibrada em 3/10 para card fica pequena e perdida aqui. Componha para preencher, e trate o `@MIRA:SIZE` deste template como escala própria (ver `/mira-size-animator`).

## Estrutura obrigatória do card

```html
<!-- Seção que envolve o card: class="min-h-screen flex flex-col items-center justify-center px-6 pt-3 pb-6" -->
<div class="w-full max-w-6xl" data-aos="fade-up" data-aos-delay="100">
    <div class="text-center mb-2">
        <h2 class="text-4xl md:text-5xl font-bold mb-2">
            Parte fixa <span class="primary-color italic">parte com ênfase</span>
        </h2>
        <p class="text-white/60 italic text-lg md:text-xl">Subtítulo curto e direto.</p>
    </div>

    <div class="glass-card rounded-2xl p-1 md:p-2">
        <div class="flex items-center justify-between mb-2 px-1">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-[#FFA203]/15 flex items-center justify-center">
                    <i data-lucide="ICONE" class="w-5 h-5 primary-color"></i>
                </div>
                <div>
                    <p class="text-white font-bold text-sm">Subtítulo da animação</p>
                    <p class="text-white/50 text-xs italic">Frase complementar curta.</p>
                </div>
            </div>
            <button id="replay-SLUG" class="replay-btn" type="button">
                <i data-lucide="rotate-cw" class="w-4 h-4"></i> Replay
            </button>
        </div>

        <!-- @MIRA:SIZE 3/10 -->
        <div class="anim-stage" id="SLUG-stage">
            <svg id="SLUG-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"></svg>
        </div>

        <div class="border-t border-white/10 pt-1 mt-1 mb-1">
            <p class="text-xs uppercase tracking-[3px] text-white/40 text-center mb-1">Tagline do slide</p>
            <div class="grid grid-cols-2 md:grid-cols-N gap-2">
                <div class="attribute-pill text-center p-1 rounded-xl">
                    <i data-lucide="..." class="w-4 h-4 primary-color mx-auto mb-1"></i>
                    <p class="text-sm font-semibold tracking-wide">Termo</p>
                </div>
            </div>
        </div>
    </div>
</div>
```

A altura do palco já vem do `.anim-stage` no `base.css` (`clamp(400px, 60vh, 620px)`). Só adicione override por slide se aquele precisar de outra altura:

```css
#SLUG-stage { height: clamp(400px, 60vh, 620px); }
#SLUG-stage + .border-t { padding-top: .25rem; margin-top: .25rem; margin-bottom: .25rem; }
```

## Marcador @MIRA:SIZE, trigger e anti-vazamento

Toda animação nasce em **3/10**, com o marcador na linha imediatamente acima do `.anim-stage`. O `mira-size-animator` lê esse comentário para escalar depois sem adivinhar o nível. Não invente outro valor, e reinicie para 3/10 no modo SUBSTITUIR.

Todo stage se registra em `setupAnimationTriggers()`, onde o `IntersectionObserver` existente dispara a função ao entrar no viewport e rearma ao sair; o Replay chama a mesma função:

```javascript
const stages = [
    { stage: document.getElementById('SLUG-stage'), fn: animateSlug, replay: 'replay-SLUG' }
].filter(s => s.stage);
```

Toda função com `setInterval` ou `setTimeout` recursivo DEVE implementar geração. Sem isso, dois atores correm juntos no Replay, vaza memória e a animação dessincroniza:

```javascript
function animateSlug() {
    clearInterval(window.__slugPulse);          // cancela loops antigos ANTES de reiniciar
    clearInterval(window.__slugFlow);

    window.__slugGen = (window.__slugGen || 0) + 1;
    const myGen = window.__slugGen;

    function loop() {
        if (myGen !== window.__slugGen) return;  // outra geração tomou o controle
        // ...trabalho do loop...
        setTimeout(loop, 1000);
    }
}
```

## Stacks e composições prontas

A cena já foi decidida na beat sheet. Aqui você só escolhe com que stack desenhá-la. Nada nesta seção escolhe conceito.

- **D3 SVG**, quando a cena precisa de geometria calculada (posições vindas de dados, caminhos, escalas, trajetórias). `<svg viewBox="0 0 1280 720">` no `.anim-stage`, D3 v7+ via CDN. `d3.easeBackOut.overshoot(1.1)` para entrada com snap, `d3.easeQuadInOut` para deslocamento. Continuidade via `attrTween`, `stroke-dashoffset` (algo sendo traçado, drenado ou percorrido) ou criar/animar/destruir elementos para carga que entra e sai.
- **Flip cards 3D**, quando a beat sheet pede que uma face esconda outra e a virada seja o acontecimento. CSS `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`, curva `cubic-bezier(0.34, 1.4, 0.64, 1)`, classe `.flipped` em cascata.
- **Revelação em dois lados**, quando há dois grupos entrando em tempos diferentes e algo atravessa de um para o outro. Grid de 3 colunas, estados iniciais escondidos (`opacity: 0; transform: translateX(±40px)`), classe `.revealed` em cascata, transição própria por lado.

## Tipografia, cores e ícones de moldura

- Título h2 `text-4xl md:text-5xl font-bold`; subtítulo `text-lg md:text-xl text-white/60 italic`; texto de card `text-xl`/`text-2xl`; pílula `text-sm`/`text-base`; label `text-xs uppercase tracking-[3px]`.
- Primária `#FFA203` (`.primary-color`, `.primary-bg`), fundo `#222222`, glass `rgba(255,255,255,0.30)` ou laranja `rgba(255,162,3,0.08)`.
- Glow `drop-shadow(0 0 Npx rgba(255,162,3,0.55))` com N de 20 a 40. Contornos tracejados `stroke-dasharray="5,5"` com opacidade 0.5 a 0.7. Texto secundário `text-white/65`, terciário `text-white/40`.
- Lucide via CDN, `<i data-lucide="ICONE">`, sempre outline na moldura (header, pílulas), tamanhos `w-4 h-4`, `w-7 h-7`, `w-12 h-12`. O ícone-ator dentro da animação é o oposto: flat preenchido.

## Workflow

1. **Modo e escopo.** CRIAR ou SUBSTITUIR? No SUBSTITUIR: slide indicado → só aquele, sem indicação → todos os animados do deck.
2. **Entender o conceito** do alvo (título, subtítulo, texto, pílulas, intenção da animação atual). Se o conceito vier no comando, use esse texto. Se útil, consulte `decks/<tema>/references/`.
3. **Rodar o método:** frase causal, A/B de famílias diferentes, mapeamento, contrafactual, especificidade, distância, história, loop. **Deck inteiro usa a regra de lote.**
4. **Ledger de diversidade** contra os outros slides animados do deck.
5. **Temperamento e beat sheet**, antes de qualquer código. `sereno` por padrão.
6. **Rubrica.** Abaixo de 85 ou com veto, volte ao passo 3.
7. **Coreografia** derivada da beat sheet, nunca de um formato pronto.
8. **Esqueleto de `mira-templates/decks/`** como referência estrutural, CSS do stage no `<style>` e HTML do card dentro do `<main>` (modo CRIAR), ou localizar o stage e reescrever só a função (modo SUBSTITUIR).
9. **Função JS** com reset (clearInterval + `selectAll('*').remove()`), geração anti-vazamento, entrada coreografada com stagger e loop interno contínuo.
10. **Trigger** registrado em `setupAnimationTriggers()`, ou conferido se já existia.
11. **Reportar** slide a slide: `conceito → metáfora (loop em uma frase)`, mais a assinatura do ledger.

Você implementa direto, sem pedir aprovação prévia, quando o usuário já deu contexto suficiente. A exceção é o quadro de metáforas acima de 4 slides.

## Portões de entrega

Nenhum item é opcional. Item não marcado é trabalho não terminado, não detalhe.

**Metáfora**

- [ ] Dinâmica escrita como frase causal (quando / porque / se falhar).
- [ ] A/B feito, duas famílias diferentes, comparadas nos portões.
- [ ] Mapeada 1 para 1, nada sobrando dos dois lados, sem duas metáforas misturadas.
- [ ] Contrafactual descrito: a cena aguenta a falha sem trocar de analogia.
- [ ] Passa em especificidade e não é a associação lexical do termo.
- [ ] Não é o desenho literal do conceito nem clichê de catálogo ("engrenagens girando").
- [ ] História com estado inicial, causa, transformação, consequência e recuperação.
- [ ] Loop da ação principal em uma frase, ambiente não conta.
- [ ] Óbvia sem legenda.
- [ ] Ledger passado, assinatura do slide reportada.
- [ ] Rubrica: 85 ou mais, nenhum veto.

**Movimento**

- [ ] Temperamento declarado na primeira linha da beat sheet, `sereno` salvo pedido de tensão.
- [ ] Beat sheet escrita antes do código, com o número de beats do temperamento.
- [ ] Pelo menos uma janela contínua de 1 s sem evento focal no ciclo.
- [ ] Uma ação focal por vez, ambiente recuando durante ela.
- [ ] Efeito depois da causa no atraso do temperamento, nunca no mesmo frame.
- [ ] Antecipação de 8% a 15% na ação principal.
- [ ] Easing dentro da família do temperamento, sem `back`, `elastic` nem `bounce` fora de `tenso` ou de física declarada.
- [ ] Consequência sustentada pelo repouso do temperamento antes do reinício.
- [ ] Corte do loop escondido, sem teletransporte de estado.
- [ ] Coreografia derivada da história, não escolhida de um menu.
- [ ] Referente concreto animado como ícone flat, não bolinha genérica; atribuição no `CREDITS.md` se preciso.
- [ ] Nenhum referente da lista proibida (pessoa, mão, rosto, animal, veículo, anatomia) desenhado à mão; os que apareceram passaram pelo `/mira-asset-scout`.

**Execução**

- [ ] Título sem ícone, no máximo 6 palavras, margem enxuta (`pt-3 pb-6`, sem `pt-10`, `mb-2`).
- [ ] Palco no padrão `.anim-stage` com `viewBox="0 0 1280 720"` e CSS do `#SLUG-stage` (modo CRIAR).
- [ ] Marcador `<!-- @MIRA:SIZE 3/10 -->` acima do palco, reiniciado no modo SUBSTITUIR.
- [ ] HTML do card dentro do `<main>` em posição lógica (modo CRIAR).
- [ ] Modo SUBSTITUIR: mesmo id de stage, título, subtítulo, pílulas e cores intactos, deck não reordenado.
- [ ] Função com generation counter, todo `setInterval` com `clearInterval` na entrada, toda recursão comparando `myGen` com `window.__slugGen`.
- [ ] Registrado em `setupAnimationTriggers()`, Replay conferido no código.
- [ ] Algum elemento sempre em movimento depois da entrada.
- [ ] Cor dentro do tema do deck, sem travessão (—), acentuação UTF-8 direta.

## Referências e navegação do deck

Copie de `mira-templates/slides/` e `mira-templates/decks/` apenas **infraestrutura**: DOM, tema, navegação, trigger, Replay, dimensionamento e proteção contra vazamento. **Não copie de lá metáfora, atores, composição nem loop**, os exemplos de partícula, órbita e layout genérico são andaime, não padrão de qualidade. As diretrizes de D3 em `agents/mira-animator/references/` valem como referência de API, não de escolha criativa.

Todo deck mantém o sistema de passagem de slides dos esqueletos: barra de progresso (`#mira-progress`), botão flutuante (`#mira-next`) e navegação por teclado (setas, PageUp/PageDown, Home/End, F para tela cheia) rolando seção a seção via `scrollIntoView`. Cada slide é uma `<section class="min-h-screen">` filha direta do `<body>`. Nunca remova esse bloco.
