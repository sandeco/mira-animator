---
name: mira-direct-cinematic-motion
description: >-
  Transformar um MIRA Slide Score e uma Encenação em uma partitura de movimento pronta para o /mira-
  animator implementar, especificando temperamento, estado inicial, beats, câmera, easing,
  profundidade, loop interno, transição, responsividade e fallbacks. Usar quando a história, a
  sequência de slides e a encenação já estiverem definidas e for necessário coreografar as animações
  de um deck MIRA em D3 com SVG, GSAP pelo mira-cinema.js ou CSS 3D. Exige um Slide Score, e de
  preferência uma Encenação, já prontos. Não usar para criar a premissa, reestruturar a história nem
  encenar o quadro, que é mira-direct-scene. NÃO usar para animar, reanimar ou consertar um slide:
  criar metáfora animada e escrever o código da animação são do /mira-animator, e pedidos como
  "anima esse slide", "essa animação está fraca" ou "transforma em metáfora" vão para ele.
---

# MIRA Direct Cinematic Motion

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 7.** Recebe Slide Score e Encenação. Entrega o MIRA Motion Score e o handoff para o `/mira-animator`.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Converter cada cena-slide em um **MIRA Motion Score**: uma partitura de movimento determinística que o `/mira-animator` implementa slide a slide. Fazer movimento, câmera, ritmo, transição e efeitos carregarem significado narrativo e conceitual.

O resultado deve permitir que o agente implementador escreva o código da cena sem inventar intenção dramática durante a codificação.

Receber preferencialmente `mira-direct-slide-sequence` e `mira-direct-scene`. Quando o usuário solicitar o arquivo final, entregar a partitura ao `/mira-animator`, que é quem escreve a animação dentro do `index.html` do deck.

## O que o MIRA executa de verdade

Ler esta seção antes de qualquer decisão de motor, formato de saída ou API.

**Não existe motor de animação, IR nem compilador no MIRA.** O motor é o agente escrevendo D3 com SVG, GSAP e CSS caso a caso, dentro do `index.html` do deck. Logo, esta skill produz **direção**, e a direção vira código pelo `/mira-animator`, não por um runtime que consome JSON.

Consequências que valem como regra:

- **Não gerar Deck IR, Scene Graph em JSON nem contrato de compilador.** A saída é texto de direção mais a beat sheet que o `/mira-animator` já sabe ler.
- **Nada de PixiJS, Three.js, Lottie, Rive, Motion Canvas ou Paper.js** como renderizador do palco. Ver as exceções nomeadas em [engine-routing-and-performance.md](references/engine-routing-and-performance.md).
- **O alvo é `file://` com duplo clique**, offline, sem build e sem servidor.

### O que a biblioteca de cinema já entrega

O `mira-cinema.js` é código-fonte versionado, copiado para `mira/` do deck, opt-in por enquanto. API em português, disponível hoje:

| Superfície | O que faz |
|---|---|
| `MiraCinema.palco(svgId)` | cria a cena, casa o `viewBox` com a caixa real, dá uma timeline GSAP por palco, toca ao entrar em tela e para ao sair |
| `Cam.estabelecer`, `Cam.aproximar`, `Cam.revelar`, `Cam.recuar`, `Cam.segurar`, `Cam.tremor`, `Cam.tensao` | os sete cues de câmera, cada um devolvendo uma tween para encaixar na timeline por label |
| `Prof.plano(cena, seletor, {z, desfoque, escurecer})` e `Prof.foco` | profundidade por planos com parallax e foco seletivo |
| `Grade.aplicar(cena, preset)` | grade de cor do deck: `neutra`, `noite-fria`, `brasa`, `clinica`, `penumbra` |
| `Ritmo` | fator de velocidade por slide, tecla `A`, marcador `@MIRA:SPEED` |

### O que ainda não existe

🟡 **Planejado, não chamar.** Instruir o agente a usar API inexistente é instruí-lo a inventar:

- **Luz como estado de cena** (`Luz.*`, clarão, sombra derivada, reflexo). O estado `cena.luz` existe como canal reservado, sem escritor.
- **Âncora entre slides e match cut** (`data-mira-ancora`). A transição entre slides continua sendo a atual.
- **Biblioteca de atmosfera** (`Atmosfera.*` pronta para chuva, névoa, fogo). Não existe função de prateleira.

Quando a cena pedir um desses, **descrever a intenção na direção e marcar como pendente**, sem escrever chamada de API.

### Atmosfera: não tem biblioteca, mas tem canal

Poeira, brasa, fumaça e faísca **podem** ser dirigidas, e o `/mira-animator` as escreve à mão. O que
mudou é que elas têm um lugar certo: o **segundo relógio** da cena, `cena.aoAtualizar()`, que roda
todo quadro independente da timeline.

Isso importa para a direção, não só para o código: a timeline obedece ao loop do slide e **para**
numa cena que fecha no último quadro. Atmosfera presa a ela morre junto e o último quadro vira foto.
Dirigida no segundo relógio, ela continua respirando depois de a história terminar, que é o que
sustenta a Regra Zero num slide de fecho.

Ao pedir atmosfera, diga **o que ela faz na cena** (para onde a fumaça sobe, o que a poeira revela do
feixe de luz) e que ela é contínua. Não escreva chamada de API: não existe uma.

## Regra Zero

Nenhuma cena MIRA termina simplesmente estática. Projetar sempre:

1. estado inicial legível;
2. coreografia de entrada;
3. acontecimento dominante;
4. impacto e acomodação;
5. loop interno vivo;
6. preparação da saída;
7. transição para a cena seguinte.

O loop precisa preservar tensão, mecanismo, atmosfera ou consequência. Movimento ornamental contínuo é ruído.

## Leis cinematográficas

### Movimento é verbo e significado

Associar cada animação a um verbo narrativo: aproximar, comprimir, disputar, revelar, falhar, dividir, contaminar, pesar, distribuir, transformar. Não aceitar “animar”, “dar vida”, “flutuar” ou “brilhar” como intenção suficiente.

### Câmera é ponto de vista

Usar câmera para controlar conhecimento, escala, intimidade, poder e revelação. Não mover a câmera apenas para parecer cinematográfico.

### Easing é comportamento

Escolher aceleração e desaceleração de acordo com massa, intenção, resistência, surpresa e emoção. Objetos, personagens, dados e partículas não devem compartilhar automaticamente a mesma curva.

### Transição preserva causalidade

Fazer a saída de uma cena fornecer matéria, direção, pergunta, som, luz ou consequência para a entrada seguinte.

### Espetáculo serve ao ouro

Efeito visual só passa quando aumenta compreensão, emoção, participação ou memória. Se o conceito puder ser trocado sem alterar a animação, a cena é genérica.

## Entradas

Obter ou inferir:

- MIRA Slide Score completo;
- premissa, princípio organizador e imagem inesquecível;
- Audience Journey Map e curvas emocionais;
- metáforas, símbolos e continuidade;
- narração, diálogo e texto de tela;
- duração total e por cena;
- Encenação de `mira-direct-scene`: planos, oclusão, grade do deck e elementos fixos;
- formatos-alvo: 16:9, 1:1, 9:16 ou terços;
- template do deck (`mira-default`, `aula-capitulo`, `sandeco-just-animation-template`, Studio) e se o cinema está ligado nele;
- tempo de produção e destino (apresentação ao vivo, gravação ou exportação de vídeo);
- necessidade de reduced motion.

`file://`, offline e ausência de build são premissa, não pergunta. Não inventar engine disponível: a rota é a de [engine-routing-and-performance.md](references/engine-routing-and-performance.md). Quando o deck não tiver o `mira-cinema.js`, produzir direção sem câmera, grade nem planos, e dizer isso no handoff.

## Fluxo obrigatório

### 0. Trancar a tese de movimento

Definir:

- **verbo mestre:** processo que atravessa o deck;
- **lei de movimento:** como o mundo responde a esse verbo;
- **contraste:** movimento associado à crença antiga versus nova;
- **imagem UAU:** transformação culminante;
- **assinatura de câmera:** ponto de vista dominante e sua mudança;
- **assinatura de ritmo:** padrão que será estabelecido, tensionado e quebrado.

Essas decisões precisam nascer do princípio organizador, não de uma estética importada.

### 0.1 Declarar o temperamento de cada cena

O temperamento decide quantos beats cabem, que easing vale e quantos cues de câmera são permitidos, então vem antes da timeline. **`sereno` é o padrão. `tenso` só entra quando a cena pede tensão** (uma torre desabando, um alarme). Pedido implícito não conta.

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

Esta tabela é a mesma do `mira-animator`. Qualquer divergência numérica entre as duas é defeito: a fonte é o `mira-animator`.

**Regra do repouso.** Todo ciclo contém pelo menos **um trecho contínuo de 1 s em que nada focal se move**. Só ambiente. Se a soma dos beats não deixar essa janela, tirar um beat ou estender o repouso, nunca encurtar a janela.

O ciclo longo é deliberado: o slide é visto enquanto alguém fala por cima dele.

Declarar na primeira linha da partitura da cena: `Temperamento: sereno · ciclo 11 s · 4 beats · repouso 1,6 s`.

### 1. Construir o Scene Graph semântico

Para cada cena, registrar nós e relações:

- personagem, objeto, texto, dado, ambiente, luz, câmera e áudio;
- posição, escala, rotação, profundidade, opacidade e máscara;
- relações de posse, oposição, dependência, causa e foco;
- significado narrativo atual;
- estados `initial`, `active`, `impact`, `loop` e `exit`;
- persistência ou descarte após a transição.

Separar identidade semântica de aparência. O mesmo objeto persistente deve manter identidade mesmo quando forma ou escala mudarem.

Escrever o Scene Graph como **tabela de planejamento em texto**, não como JSON de runtime. Cada nó vira um `id` de grupo dentro do SVG do palco, e é esse `id` que o `/mira-animator` usa como seletor de plano, de alvo de câmera e de marcação fixa.

### 2. Escrever os verbos de coreografia

Para cada elemento animado, completar:

```text
[elemento] executa [verbo] porque [causa narrativa],
produzindo [mudança visível] e fazendo o público [efeito].
```

Remover movimentos sem causa ou efeito. Não animar todos os elementos; preservar hierarquia e repouso relativo.

### 3. Compor a timeline em beats

Usar a estrutura mínima:

1. **orientação:** quadro legível;
2. **antecipação:** preparação que cria previsão;
3. **ação:** verbo dominante;
4. **resistência:** força contrária ou atraso;
5. **impacto:** mudança decisiva;
6. **acomodação:** reação, overshoot ou silêncio;
7. **revelação:** novo significado torna-se legível;
8. **loop:** estado vivo;
9. **saída:** energia transferida à próxima cena.

Definir `at_ms`, duração, alvo, propriedade, estado inicial, estado final, easing e função narrativa. Sincronizar com palavras ou pausas específicas quando houver narração.

A cena com nove beats acima é o repertório completo, não a meta: o número de beats permitido é o do temperamento. Orientação, acomodação e repouso são beats legítimos e costumam ocupar mais tempo que a ação.

**Declarar posição por label, não por delay acumulado.** A partitura marca cada beat como um label de timeline (`impacto`, `impacto+0.3`), e o implementador o traduz em `tl.add(label)`. Somar delays na mão é a conta que o gerador erra com mais frequência, e o erro só aparece quando alguém assiste.

### 4. Dirigir a câmera

A câmera existe no MIRA como **enquadramento por `viewBox`**, e só em palco com o `mira-cinema.js` ligado. São sete cues, e nenhum outro:

| Cue | Função narrativa | Duração padrão |
|---|---|---|
| `estabelecer` | quadro aberto, mostra o mundo. É o enquadramento base, onde `@MIRA:SIZE` e a área segura são medidos | 0,8 s |
| `aproximar` | push-in: pressão, intimidade, importância | 1,2 s |
| `revelar` | travelling, mantém a escala e desloca o centro: acompanha causalidade | 1,4 s |
| `recuar` | volta ao base: escala, isolamento, consequência | 1,0 s |
| `segurar` | quadro parado, leitura da consequência. É beat legítimo, não tempo morto | 0,6 s |
| `tremor` | impacto: ataque seco e queda. **400 ms é conselho, não corte**; o motor honra até 1,2 s e avisa acima disso | 0,25 s |
| `tensao` | a mesma vibração, fraca e PLANA: o quadro que não assenta enquanto a ameaça dura. Sem teto de duração | 4 s |

Regras de dosagem, todas numéricas:

- **Teto de cues por cena:** 2 em `sereno`, 3 em `natural`, livre em `tenso`.
- **Todo cue declara a razão narrativa.** Cue sem razão é reprovado, e o próprio módulo avisa no console.
- **`tremor` longo num slide que vai ser gravado lê como falha de captura, não como intenção.** Fora de `tenso`, não usar.
- **`tremor` é pontuação, `tensao` é estado.** Mesma vibração, papéis opostos: tremor marca um instante, tensão sustenta enquanto a ameaça dura. Tensão forte e curta é tremor mal feito; tremor longo é motor ligado.
- **Cues coexistem, e isso não é exceção.** Enquadramento, tremor e tensão são canais separados que o motor soma. Tensão sustentada com um tremor por cima durante um push-in é uma frase de câmera. O que conflita é dois cues do mesmo canal no mesmo intervalo, e o teto por cena continua valendo.
- **A câmera não se move durante leitura de texto indispensável.**
- **Elemento de legibilidade crítica recebe `data-mira-traco-fixo` ou `data-mira-texto-fixo`**, senão todo push-in engorda traço e tipografia.
- **A câmera opera dentro do palco.** Nunca sobre o título, a área de câmera do Studio ou o teleprompter.

Órbita e corte de câmera não existem: órbita exigiria 3D, e corte é troca de slide. Usar [camera-easing-transitions.md](references/camera-easing-transitions.md) para a função narrativa de cada movimento. Garantir que o público tenha tempo de orientar-se antes de mudança complexa.

**Quando a intenção não couber nos sete cues**, consultar [catalogo-de-camera.md](references/catalogo-de-camera.md) antes de descrever qualquer coisa. É o inventário da linguagem de câmera com o estado de cada peça no motor, em quatro prateleiras: pronto, existe mas falta nomear, precisa de peça nova, e fora do motor. Serve para dois casos opostos e igualmente comuns: descobrir que o efeito desejado já existe com outro nome, e descobrir que ele não existe antes de instruir o implementador a inventá-lo.

Uma advertência dele que vale repetir aqui, porque foi medida e contraria a intuição: **zoom quase não produz parallax.** Zoom é lente, não passo, e todas as camadas crescem igual. Quando a cena pedir profundidade, o cue é `revelar`, não `aproximar`.

### 5. Dirigir easing e física percebida

Selecionar comportamento:

- **preciso:** dados, medição, encaixe;
- **orgânico:** personagem, tecido, crescimento;
- **pesado:** máquina, poder, custo;
- **elástico:** promessa, excesso, humor;
- **abrupto:** falha, choque, interrupção;
- **viscoso:** resistência, contaminação, atraso;
- **balístico:** lançamento, perda de controle.

Usar antecipação e overshoot quando revelarem intenção, massa ou consequência. Evitar catálogo de easings sem sistema.

**A família de easing sai do temperamento.** `back`, `elastic` e `bounce` ficam fora do padrão: só em `tenso`, ou quando a física da metáfora os exigir, e aí a partitura declara o motivo. São as curvas que produzem overshoot visível, e overshoot repetido faz a cena parecer agitada mesmo quando é lenta.

O `mira-cinema.js` nomeia curvas por comportamento, e é assim que a partitura deve pedi-las: `decisive`, `reluctant`, `heavy`, `fragile`, `reveal-breath`, `dread-creep`.

### 6. Projetar o loop interno

O loop deve começar depois do acontecimento principal e manter:

- respiração ou microtensão;
- fluxo de recurso;
- oscilação de risco;
- partículas com função;
- estado de máquina;
- contraste entre agentes;
- consequência ainda ativa.

Definir ponto exato de reinício e garantir continuidade visual. Bloquear loops que reiniciem a revelação, desviem atenção da fala ou acumulem erro numérico.

**Em `sereno`, a forma preferida do estado vivo é deriva lenta contínua:** algo que respira, oscila devagar ou avança de forma quase imperceptível, em vez de repetir visivelmente o gesto focal. Ação focal repetindo a cada 5 s é o que mais cansa numa apresentação longa.

O loop é **perpétuo e interno**: entrar com fade e parar é proibido, e o corte do ciclo é escondido em saída de quadro, oclusão ou retorno natural, nunca por teletransporte de estado.

### 7. Coreografar transições

Escolher continuidade de objeto, movimento, forma, luz, câmera, tempo, símbolo, som ou consequência. Definir:

- evento que inicia a saída;
- elementos persistentes;
- elementos destruídos ou convertidos;
- estado visual intermediário;
- primeiro quadro da próxima cena;
- duração e possibilidade de interrupção;
- fallback por corte ou dissolve.

Usar dissolve apenas para passagem suave, memória, ambiguidade ou mudança de tempo; não como padrão universal.

### 8. Selecionar a stack

Usar [engine-routing-and-performance.md](references/engine-routing-and-performance.md). A cena já foi decidida; aqui só se escolhe com que stack desenhá-la.

- **D3 v7 com SVG:** geometria calculada, dados, escalas, trajetórias, caminhos traçados. É a rota padrão do MIRA e continua sendo.
- **GSAP pelo `mira-cinema.js`:** tempo, timeline com labels, câmera, profundidade e grade. Entra quando a cena tem enquadramento, planos ou coreografia com muitos beats encadeados.
- **CSS 3D:** virada de face, perspectiva, cascata de cartões.

Não há percentual a cumprir. Uma cena que só precisa de D3 com SVG é uma cena resolvida.

### 9. Dirigir efeitos e profundidade

Para cada efeito, declarar:

- fenômeno representado;
- gatilho;
- área de atuação;
- densidade e limite;
- duração;
- interação com câmera e texto;
- condição de limpeza;
- fallback.

Tetos numéricos, porque adjetivo não muda o comportamento de um gerador:

- **3 a 5 planos de profundidade por cena**, nunca mais.
- **Pelo menos uma oclusão real por cena com profundidade.** Oclusão é doutrina, não API: ordem de empilhamento no SVG e máscara resolvem. Parallax sem oclusão continua lendo como recorte deslizante.
- **Desfoque de plano com raio máximo 4**, e o desfoque só anima na troca de foco seletivo.
- **Uma grade de cor por deck**, aplicada ao palco, nunca à `<section>` nem ao `body`.
- **Grão estático.** Grão animado quadro a quadro destrói a compressão na exportação para vídeo.
- **Glow em no máximo 1 elemento por cena**, e apenas no ator do acontecimento dominante.
- **Nenhum `Math.random()`.** A aleatoriedade vem do PRNG semeado da cena, senão duas execuções não produzem o mesmo quadro e a comparação lado a lado perde o sentido.

Partícula, órbita e pulso genérico não são efeito, são muleta: só entram quando o fenômeno representado é genuinamente abstrato (fluxo, sinal, propagação).

### 10. Sincronizar fala, silêncio e som

Marcar:

- palavra que inicia ação;
- palavra ou pausa que revela;
- momento em que a imagem deve antecipar a fala;
- momento em que a fala deve anteceder a imagem;
- silêncio necessário para avaliação;
- impacto, ambiente ou motivo sonoro;
- cauda de som que pode atravessar a transição.

Não presumir que haverá áudio. **O caso comum do MIRA é o deck mudo com narração ao vivo por cima**, e nos fluxos Studio a narração vem do `roteiro.md`. Sincronizar com a fala significa deixar espaço para ela, não disparar por evento de áudio. Garantir que a mudança central seja compreensível visualmente e manter texto indispensável quando necessário.

### 11. Reenquadrar para formatos

Tratar 16:9, 1:1 e 9:16 como direções diferentes:

- reorganizar eixo visual;
- mudar escala e trajetória;
- reenquadrar câmera;
- reduzir simultaneidade quando a largura cair;
- preservar objeto, ação e payoff;
- manter o loop funcional;
- reordenar texto e evidência sem alterar causalidade.

Não apenas redimensionar. Registrar no handoff as regras que `/mira-squared`, `/mira-vertical`, `/mira-thirds` e `/mira-size-animator` vão precisar, mais os **50 px de área segura**, que valem em todo formato e são medidos no enquadramento base.

### 12. Aplicar performance, fallbacks e acessibilidade

Definir:

- teto de elementos ativos e de nós do SVG;
- política de limpeza de timers, listeners e observers;
- `prefers-reduced-motion` com preservação de significado;
- reinício determinístico e seed;
- comportamento no Replay, na volta ao slide e na reordenação.

Regras que o MIRA já cobra e que a partitura não pode contradizer:

- **A animação começa quando o slide entra em tela e recomeça do zero ao voltar.**
- **Replay não pode produzir duas execuções.** Toda função com `setInterval` ou recursão de `setTimeout` cancela os timers anteriores e compara a geração (`window.__slugGen`); com o `mira-cinema.js`, a timeline é uma por palco e morre com `kill()` antes de recriar.
- **A timeline pausa nos modos de edição e pintura**, senão ela sobrescreve o que o autor acabou de mover.
- **Nada é gerado por rede em apresentação.** As bibliotecas viajam dentro do deck.

Não remover informação no modo reduzido. Substituir movimento por estados, cortes e realces legíveis.

### 13. Preparar o handoff para o `/mira-animator`

Mapear a direção para o formato de [handoff-mira-animator.md](references/handoff-mira-animator.md):

- cena, propósito e temperamento;
- atores com `id`, plano e oclusão;
- beat sheet com as colunas de enquadramento, plano e luz;
- câmera com razão por cue;
- loop interno e ponto de reinício;
- transição de saída;
- stack, marcadores (`@MIRA:SIZE`, `@MIRA:SPEED`) e elementos fixos;
- responsividade e formatos;
- reduced motion e fallback;
- testes de aceitação.

**Não escrever o HTML do deck aqui.** Quem escreve é o `/mira-animator`, e ele espera direção, não código pronto.

### 14. Aplicar o Gate UAU cinematográfico

Pontuar de 0 a 5:

| Critério | Teste |
|---|---|
| Legibilidade | O quadro orienta antes da ação? |
| Intenção | Todo movimento possui causa narrativa? |
| Ritmo | Antecipação, ação, impacto e respiro estão calibrados? |
| Câmera | O ponto de vista altera conhecimento ou emoção? |
| Continuidade | A energia atravessa cenas sem reinício arbitrário? |
| Singularidade | A coreografia pertence somente a esta história? |
| Emoção | Movimento intensifica consequência, não apenas aparência? |
| Educação | O mecanismo permanece correto em movimento? |
| Memória | Existe transformação visual inesquecível? |
| Robustez | Há determinismo, limpeza, responsividade e fallback? |

Exigir média mínima 4, nota 5 em fidelidade e robustez e nenhum slide decisivo abaixo de 4 em legibilidade, intenção ou educação.

**As duas travas contra decoração, acima de tudo nesta skill:**

1. **Nenhum recurso de cinema pode ser a única mudança de estado da cena.** Se ao desligar câmera, profundidade, grade e atmosfera a animação deixa de contar a história, a história não existia.
2. **A nota é dada com o cinema desligado.** Verificação prática: descrever a cena sem nenhum cue de câmera, sem planos e com a grade `neutra`. Se ela ainda encena o acontecimento, o cinema pode entrar. Ele entra depois de a cena passar, nunca para fazê-la passar.

A rubrica de 85 sem veto do `/mira-animator` continua valendo no momento da implementação, e é avaliada da mesma forma. As duas escalas convivem: esta pontua a direção, aquela pontua a metáfora.

## Contrato de saída: MIRA Motion Score

Entregar:

1. tese de movimento;
2. temperamento por cena e sistema de câmera e ritmo;
3. mapa de stacks e assets;
4. mapa de continuidade e transições;
5. Motion Score por slide;
6. espaço para narração e som;
7. loops internos;
8. regras para 16:9, 1:1, 9:16 e terços;
9. orçamentos de performance;
10. reduced motion e fallbacks;
11. handoff para o `/mira-animator`;
12. testes de aceitação;
13. Gate UAU e correções.

Usar [motion-score-schema.md](references/motion-score-schema.md) para cada cena.

## Auditoria final

Bloquear e refazer se:

- houver movimento sem verbo ou causa;
- câmera, easing ou partículas puderem ser trocados sem alterar significado;
- a orientação ocorrer depois da ação principal;
- todos os elementos se moverem ao mesmo tempo;
- o loop repetir a revelação ou competir com a narração;
- a transição reiniciar o mundo;
- a partitura pedir motor, IR ou API que o MIRA não tem;
- o teto de cues do temperamento for estourado, ou um cue não tiver razão;
- a cena tiver profundidade sem nenhuma oclusão;
- a cena degradar sem preservar informação;
- o formato vertical for apenas versão espremida;
- seek, replay ou retorno produzirem estados diferentes;
- a imagem UAU depender apenas de glow, velocidade, escala ou quantidade;
- menos de 80% das cenas comunicarem sua mudança central sem depender da fala.
