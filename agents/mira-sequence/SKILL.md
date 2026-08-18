---
name: mira-sequence
description: Cria o slide seguinte começando exatamente na pose em que a animação do slide indicado estava, com corte seco, para os dois se comportarem como um slide só e a animação continuar sem salto. Use SEMPRE que o usuário disser "/mira-sequence", "sequência desse slide", "continua a animação no próximo slide", "parte 2 dessa animação", "quero um slide que continua o anterior", "corte seco entre os slides", "os dois slides têm que parecer um só", "encadeia esses slides", ou pedir para quebrar uma animação longa em slides encadeados sem transição visível.
---

# Skill: Sequência, dois slides que se comportam como um

O autor indica um slide. Você cria o slide seguinte **nascendo na pose exata em que o anterior estava** e continuando dali. Na apresentação, a passagem não aparece: quem assiste vê uma animação só, que muda de comportamento no meio.

Exemplo: a bola quica pela tela e para no centro. No slide seguinte a bola já está no centro, parada onde ficou, e passa a subir e descer.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Todo texto visível em português brasileiro com acentuação correta. Proibido travessão (—): use vírgula ou dois-pontos.

## O que este agente faz, e o que não faz

**Faz:** a JUNTA. O contrato de continuidade entre dois slides, a pose de entrega, o corte seco na navegação e a animação nova começando de onde a anterior parou.

**Não faz:** escolher metáfora. A metáfora é herdada do slide de origem, por definição: é a mesma cena continuando. Se o autor quer outra cena, o agente é o `/mira-animator`, não este.

**Nunca faz:** mudar a transição global do deck. O corte seco é do par, e só dele. Todos os outros slides passam exatamente como passavam antes.

## As duas regras do Mira que esta skill suspende, de propósito

Diga isso na entrega, não deixe implícito.

1. **Entrada coreografada.** A regra zero manda toda animação entrar com coreografia. O slide de continuação **não entra**: ele já está em cena. Fade, stagger, escala 0, `data-aos`, tudo proibido nos atores herdados. A entrada já aconteceu no slide de origem.
2. **Método A/B da metáfora.** Não roda. A metáfora já foi eleita no slide de origem e continuar é o objetivo.

**O que continua valendo sem exceção:** loop interno perpétuo na continuação, temperamento e beat sheet, cor do tema, anti-vazamento, idioma pt-br, sem travessão.

## Entradas

- **Deck e slide de origem.** Se o autor não disser, pergunte. Nunca adivinhe o slide.
- **O que acontece na continuação**, em uma frase ("a bola só sobe e desce"). Sem isso, pergunte: é a única coisa que você não consegue deduzir do slide anterior.
- **Título da continuação**, opcional. O padrão é **repetir o título da origem**, porque título trocando é a única coisa que o espectador enxerga no corte. Se o autor pedir outro, avise que a troca aparece, e mantenha o mesmo número de linhas.

## O contrato de continuidade

Cinco peças. Nenhuma é opcional.

### 1. Marcadores do par

Na `<section>` de origem e na de continuação:

```html
<!-- @MIRA:SEQ origem="bola" · a continuação nasce da pose entregue aqui -->
<section data-mira-seq="bola">

<!-- @MIRA:SEQ continua="bola" · sem entrada: já está em cena -->
<section data-mira-seq-de="bola">
```

O comentário é para quem lê. **Os atributos são o que o código lê.** O id do par é curto, minúsculo e único no deck. Uma continuação pode carregar os dois atributos e virar origem da próxima: a corrente pode ter três ou mais slides.

### 2. Barramento da pose

Injete uma vez por deck, no topo do `<script>` das animações:

```javascript
/* @MIRA:SEQ:BUS  pose viva entregue de um slide para o seguinte */
window.__miraSeq = window.__miraSeq || {};
var MiraSeq = {
    gravar: function (id, pose) { if (pose) window.__miraSeq[id] = pose; },
    ler: function (id) { return window.__miraSeq[id] || null; }
};
```

**A origem grava.** Onde depende do estilo do palco:

- **Palco declarativo** (`reger(svgId, quadro)` com `quadro(ms)`, que é o `mira-default` e derivados), última linha do quadro:

  ```javascript
  if (ms > 0) MiraSeq.gravar('bola', { x: x, y: y, r: R, achatamento: k });
  ```

  **O `ms > 0` não é enfeite.** O `reger` chama `quadro(0)` a cada frame enquanto o slide está fora da tela. Sem a guarda, sair do slide sobrescreve a pose de entrega pelo primeiro quadro da história, e a continuação nasce no lugar errado.

- **Palco imperativo** (`animateSlug()` com transições D3, templates de card), um amostrador ao lado da animação:

  ```javascript
  d3.timer(function () { MiraSeq.gravar('bola', { x: +bola.attr('cx'), y: +bola.attr('cy') }); });
  ```

  Aqui não precisa de guarda: o `animateSlug()` só reseta os elementos quando o slide volta a aparecer, e a continuação já travou a pose antes disso.

Regras da pose: **objeto novo a cada gravação**, nunca um mutado no lugar. **Coordenadas absolutas do viewBox**, nunca fração de `F.vy(k)`, porque o título da continuação pode ter altura diferente e a fração mudaria de lugar. Só o que a continuação precisa: posição, raio, ângulo, opacidade, deformação. Não despeje o estado inteiro.

**Nada no desenho de um ator herdado pode sair do relógio local.** Sombra, brilho, rastro e escala derivada tiram valor da POSE, não de `ms`. É o erro que passa despercebido: a entrega no repouso fica perfeita, e entregar no meio do ciclo faz o elemento derivado pular, porque a continuação começa o relógio dela no zero e a origem estava no meio do dela.

### 3. A continuação trava a pose e começa nela

```javascript
function poseEntrega(F) { return { x: F.W / 2, y: F.vy(.82), r: 46, achatamento: 1 }; }

function animBolaSobe(svgId) {
    var p = palco(svgId); if (!p) return;
    var svg = p.svg, F = p.F;
    var base = poseEntrega(F);
    /* ...cria os elementos JÁ na pose, sem opacity 0, sem scale 0... */

    reger(svgId, function (ms) {
        if (ms === 0) base = MiraSeq.ler('bola') || poseEntrega(F);   /* trava ao entrar */
        /* ...desenha a partir de `base`... */
    });
}
```

`ms === 0` acontece nos quadros congelados e no primeiro quadro ao vivo, então a pose fica atualizada enquanto a origem roda e trava no instante da entrada.

**O portão duro do movimento:** a função de movimento avaliada em `ms = 0` tem que devolver **exatamente** `base`. `y = base.y - alt * (0.5 - 0.5 * Math.cos(2 * Math.PI * t))` serve, porque em `t = 0` o cosseno vale 1 e o deslocamento vale 0. `y = base.y - alt * Math.sin(...)` com fase diferente de zero não serve. Confira essa conta antes de escrever o resto.

**`poseEntrega(F)` é o plano B, e é obrigatório.** Escreva a pose de repouso da origem **com a mesma expressão que a origem usa**, não com número mágico. Ela é usada quando ninguém passou pelo slide anterior: link direto no meio do deck, e principalmente `/mira-slide-to-video`, que grava cada slide isolado a partir do zero. Continuação que só funciona depois da origem está quebrada.

### 4. Corte seco na navegação

O deck rola com `behavior: 'smooth'`. Rolagem suave mostra os dois slides deslizando e mata a ilusão.

**Procure por `scrollIntoView`, não por `function ir`.** Cada template chama a passagem de slide de um jeito, e um deck real costuma ter mais de um caminho: o teclado, o botão flutuante `#mira-next`, a barra `#mira-progress`, o `/mira-remote-control` mandando do celular. Patch aplicado só no teclado deixa o botão rolando suave, e o defeito só aparece na hora da palestra. Faça a busca, liste os caminhos e aplique a guarda em todos.

Guarda comum, com a nomenclatura do `mira-default`:

```javascript
function parSeq(a, b) {
    var origem = a.getAttribute('data-mira-seq');
    return !!origem && b.getAttribute('data-mira-seq-de') === origem;
}
function ir(d) {
    var de = atual(), i = Math.max(0, Math.min(secs.length - 1, de + d));
    if (i === de) return;
    /* @MIRA:SEQ  par em sequência salta sem rolagem, nos dois sentidos */
    var seco = parSeq(secs[de], secs[i]) || parSeq(secs[i], secs[de]);
    secs[i].scrollIntoView({ behavior: seco ? 'instant' : 'smooth', block: 'start' });
}
```

**É `'instant'`, nunca `'auto'`.** Pela especificação, `'auto'` quer dizer "use o valor de `scroll-behavior` do elemento", e todo deck do Mira traz `html { scroll-behavior: smooth }`. Escrever `'auto'` deixa o salto suave, não dá erro nenhum no console, e a continuidade morre sem explicação aparente. É a armadilha mais fácil de cair nesta skill inteira. Os templates `mira-studio` já usam `'instant'` pelo mesmo motivo.

### 5. A volta retrocede

Voltar da continuação para a origem não reinicia a história. Antes do corte seco, a continuação percorre o movimento para trás por cerca de um segundo e pousa em `base`; depois a origem reaparece no instante de entrega que havia gravado, com o loop de repouso ativo.

No **palco declarativo**, `gravar(id, pose, ms)` publica pose e relógio. Registre os relógios por palco em `RELOGIOS`: o relógio da continuação precisa aceitar um valor dirigido e o da origem precisa retomar com deslocamento. No rewind, pegue a fase corrente do ciclo e dirija `quadro(ms)` até zero com `d3.easeSinInOut`; o último quadro tem que chamar `quadro(0)` e devolver `base` exato. Nunca reproduza todo o tempo absoluto acumulado: no máximo um ciclo, senão a volta fica frenética depois de uma palestra longa.

A navegação arma uma **flag one-shot** antes do salto. Na ativação, a origem consome a flag e retoma no `ms` gravado; se não houver registro, usa o instante de repouso declarado pela origem. Sem flag, o relógio continua começando em zero: sair do par e retornar toca a história normalmente.

No **palco imperativo**, que não tem `quadro(ms)`, faça o fallback percebido: tween da pose atual da continuação até a pose base na mesma duração. Ao entrar com a flag, a origem monta direto no estado final e pula apenas a coreografia de entrada; loops internos continuam rodando.

Duas guardas são obrigatórias:

- **Deep link na continuação:** sem pose gravada, não invente movimento. Arme a flag e salte seco; a origem cai no repouso declarado.
- **Novo comando durante o rewind:** aborte timer ou tween e salte seco imediatamente, sem enfileirar navegação.

### A transição global do deck é intocável

**O corte seco vale para o par em sequência e para mais nada.** Todo o resto do deck continua passando exatamente como passava antes, byte por byte. Isto não é preferência de estilo, é requisito: o corte só lê como continuidade porque as outras passagens são diferentes dele. Deck inteiro seco não tem par em sequência, tem deck sem transição.

Proibido, sem exceção:

- Mexer no `html { scroll-behavior: smooth }` do CSS.
- Trocar o `'smooth'` das outras passagens, ou tirar o `else` do ternário.
- Desligar o `/mira-transition-dissolve` do deck. O par pula o fade; os outros slides seguem esmaecendo.
- Remover `data-aos` de qualquer seção que não seja a de continuação.
- Encostar em `scroll-snap`, `scroll-margin`, `#mira-progress` ou na duração de qualquer transição existente.

**A guarda é sempre condicional ao par.** `seco ? 'instant' : 'smooth'`, nunca um valor fixo. Valor fixo é o sintoma: se em algum ponto do patch você escreveu o comportamento novo sem o `parSeq` decidindo, você acabou de mudar o deck inteiro.

Antes de entregar, passe **todos** os outros slides do deck e confirme que a transição deles continua igual à de antes.

Em template de card (`aula-capitulo`, `pitch-projeto`, `demo-tecnica`) a coleção se chama `cardSections` e o índice vem de outro lugar, mas a guarda é a mesma. **Deck com crossfade** (`/mira-transition-dissolve`, `mira-studio`) já salta com `behavior: 'instant'` e o que precisa ser desligado é o esmaecimento: o par em sequência pula o `dissolve()` e chama o salto direto, senão o corte ganha um fade que é exatamente o que ele não pode ter.

## Identidade visual, o que precisa bater entre os dois slides

Qualquer diferença aqui aparece como um piscar no corte.

- Mesmo `viewBox` e mesmo `preserveAspectRatio`. No `mira-default` sai de graça, porque o `palco()` calcula pela caixa e as duas seções têm o mesmo tamanho.
- Mesma cor, vinda do tema pelo mesmo `COR.*`. Nunca hex escrito à mão em um dos lados.
- Mesmo raio, mesma espessura de traço, mesma opacidade, mesmo filtro nos atores herdados.
- Mesma ordem de empilhamento: quem estava por cima continua por cima.
- Gradiente e `clipPath` têm id derivado do `svgId`, então a continuação **redefine os seus**, com stops idênticos.
- Mesmo fundo de seção.
- `data-aos` fora da seção de continuação.

## Passo a passo

1. **Localize** a `<section>` de origem no `decks/<deck>/index.html` e leia a função da animação inteira.
2. **Ache o repouso.** Que pose a origem tem no fim do ciclo? Se a origem não repousa, é o momento de dizer isso ao autor: a pose viva resolve o corte, mas uma origem que nunca para entrega uma pose diferente a cada execução, e a continuação fica imprevisível. O caminho normal é a origem ganhar um compasso de repouso no fim do ciclo, com o loop sustentado por deriva lenta.
3. **Nomeie os atores herdados** e monte a pose: só o que atravessa.
4. **Instale o barramento** se ainda não existir no deck, e a gravação na origem.
5. **Beat sheet da continuação**, temperamento herdado da origem, sem beat de entrada. O primeiro beat começa na pose.
6. **Escreva a `<section>` nova logo depois da origem**, com os marcadores, o mesmo título e o palco.
7. **Escreva a função**, criando os elementos já na pose, com `poseEntrega(F)` de plano B, e registre em `ligar()` ou em `setupAnimationTriggers()`, conforme o template.
8. **Instale o retrocesso:** relógios por palco, pose+instante gravados, repouso declarado e flag one-shot.
9. **Aplique o corte seco e o rewind** em todo caminho de navegação do deck, achado por busca de `scrollIntoView`.
10. **Teste as bordas:** deep link na continuação, segundo comando durante o rewind e retorno à origem vindo de fora do par.
11. **Reporte** o que o autor precisa olhar no navegador: ida sem salto, volta visível até o repouso e loop da origem ativo depois do pouso.

## Portões de entrega

- [ ] Marcadores `data-mira-seq` e `data-mira-seq-de` nas duas seções, id do par único no deck.
- [ ] Barramento injetado uma vez só no deck.
- [ ] Origem gravando a pose, com `ms > 0` no palco declarativo.
- [ ] Pose em coordenadas absolutas do viewBox, objeto novo a cada quadro.
- [ ] Continuação travando com `ms === 0` e caindo em `poseEntrega(F)` sem a origem.
- [ ] `poseEntrega(F)` escrita com a mesma expressão do repouso da origem, sem número mágico.
- [ ] Movimento da continuação devolve `base` exato em `ms = 0`, conta conferida.
- [ ] Nenhuma entrada nos atores herdados: sem fade, sem stagger, sem escala 0, sem `data-aos`.
- [ ] Loop interno perpétuo na continuação.
- [ ] Título repetido, ou trocado com o mesmo número de linhas e o autor avisado.
- [ ] Cor, raio, traço, opacidade e empilhamento idênticos nos atores herdados.
- [ ] Corte seco com `behavior: 'instant'`, nos dois sentidos, em TODOS os caminhos de navegação do deck, não só no teclado.
- [ ] Barramento grava pose e relógio; origem declara o instante de repouso.
- [ ] Volta dirige o relógio da continuação para trás em cerca de um segundo e pousa em `base` exato.
- [ ] Flag one-shot consumida pela origem: retoma no instante gravado; vindo de fora do par, começa do zero.
- [ ] Deep link volta sem rewind pelo plano B; novo comando durante rewind aborta e salta sem fila.
- [ ] Palco imperativo usa tween até a pose base e monta a origem no estado final.
- [ ] Transição global intacta: guarda sempre condicional ao par, CSS de rolagem não tocado, dissolve e AOS dos outros slides preservados, passagens restantes conferidas uma a uma.
- [ ] Anti-vazamento preservado, deck não reordenado, nada mais tocado.

## Limites conhecidos, diga na entrega

- **A roda do mouse não aciona o rewind.** Ela é rolagem direta do espectador, não um comando da navegação do deck.
- **Controle remoto pendente.** O caminho do remoto ainda depende da correção `BUG-20260818-R7MC`; até ela convergir, não declare a volta remota como verificada.
- **Continuação sem origem cai no plano B.** É por isso que o plano B é obrigatório.
- **Origem sem repouso entrega pose imprevisível.** A continuação nasce correta de qualquer jeito, mas o autor não controla onde a cena começa.
- **Modo cinema:** se a origem usa `MiraCinema`, a câmera também faz parte da pose. Entregue `cena.camera` junto ou deixe as duas cenas na mesma posição de câmera, senão o corte tem zoom.

## Exemplo completo

`references/exemplo-bola.html` é um deck de verdade, no `mira-default`, que abre por `file://` e roda: a bola quica e para no centro, o slide seguinte continua dali e a volta retrocede até o repouso. Três slides, porque o primeiro existe para dar o contraste da rolagem suave contra o corte seco. As cinco peças do contrato estão implementadas e comentadas no lugar onde moram, e o cabeçalho do arquivo traz o que conferir no navegador.

Antes de escrever a sua, abra ele e passe os slides. É mais rápido que ler a especificação de novo.
