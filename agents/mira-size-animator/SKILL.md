---
name: mira-size-animator
description: Escala a percepção de tamanho das animações D3 de um deck numa escala de 1 a 10 (3/10 é o padrão gerado pelo mira-animator), lendo o marcador @MIRA:SIZE de cada animação e ajustando só o desenho dentro do SVG, sem mexer na altura do palco nem nos gatilhos. Use SEMPRE que o usuário disser "/mira-size-animator", "aumentar o tamanho da animação", "as animações estão pequenas", "a animação ocupa pouco espaço", "deixa tudo em 6/10", "coloca as animações em 5/10", "qual o tamanho das animações", "percepção de tamanho", "escalar a animação", "diminuir a animação", "deixa esse slide maior", ou pedir para crescer ou encolher um slide específico ou o deck inteiro.
---

# Skill: Percepção de Tamanho das Animações

Regula o quanto cada animação D3 **preenche o palco**, numa escala de 1 a 10. Não cria animações nem muda a metáfora: pega o que o `mira-animator` já gerou e ajusta a escala da composição.

## REGRA DE IDIOMA

Siga integralmente `agents/_shared/idioma.md`. Todo texto visível em português brasileiro com acentuação 100% correta. Proibido travessão (—): use vírgula ou dois-pontos.

## Conceito: a escala 1 a 10

- O `mira-animator` gera a animação no nível **3/10** (pequena, com margem morta sobrando). É o ponto de partida.
- O número que o usuário passa é o **nível-alvo absoluto**, não um incremento. "Coloca em 6/10" sobe de 3 para 6; "Deixa em 2/10" desce de 3 para 2.
- Nível alto (perto de 10) = composição enorme, quase todo o palco. Nível baixo (perto de 1) = tímida, com muita margem.
- Faixa válida: **1 a 10**. Recuse 0 ou valores fora da faixa.

## O marcador @MIRA:SIZE (fonte da verdade)

O nível atual de cada animação vive num comentário HTML, colado logo acima do palco:

```html
<!-- @MIRA:SIZE 3/10 -->
<div class="anim-stage" id="SLUG-stage">
    <svg id="SLUG-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"></svg>
</div>
```

Regras do marcador:

- **Um marcador por animação**, sempre na linha imediatamente acima do `.anim-stage` (ou do `<div id="...-stage">`) daquela animação.
- O número antes da barra é o nível atual. A skill **lê** esse número, escala a composição e **reescreve** o marcador com o novo nível.
- **Animação sem marcador** (deck antigo): trate como **3/10** e escreva o marcador ao tocá-la.
- O marcador é a única memória do nível: garante que reexecutar componha corretamente (3→6, depois 6→8) e seja reversível (8→3).

## Onde estão as animações

O deck fica em `decks/<deck>/index.html` ou `decks/<tema>/index.html` (os dois caminhos existem conforme o fluxo). Uma "animação" é todo card com `.anim-stage` + `<svg>` D3. Havendo mais de um deck e o usuário não dizendo qual, **pergunte qual deck** antes de editar.

## Dois modos de uso

### Modo 1: Reportar (sem alvo)

Quando o usuário só aciona a skill ou pergunta o tamanho, sem dar número:

1. Localize o deck.
2. Liste cada animação com seu nível atual (marcador, ou 3/10 se não houver).
3. Apresente uma tabela curta: título do card → nível atual. **Não edite nada.**

```
Card 2  "O ciclo do agente"      4/10
Card 4  "SPEC no centro"         3/10
Card 7  "Escada da evolução"     3/10
```

### Modo 2: Aplicar (com alvo)

Quando o usuário dá um nível-alvo ("deixa todas em 6/10", "esse slide em 7/10", "/mira-size-animator 5/10"):

O argumento aceita `5` ou `5/10` (mesmo alvo 5): parseie o número antes da barra. O alvo escala **só o desenho dentro do SVG**, partindo de 3/10. **Nunca** aumente o palco (`.anim-stage`), título, pílulas ou qualquer elemento fora do SVG.

1. **Resolva o escopo:**
   - Sem slide específico → **todas as animações** do deck.
   - Com slide específico (número do card, título ou id do stage) → **só aquela animação**.
2. Para cada animação no escopo, leia o nível atual no marcador (default 3).
3. Calcule o fator de escala `k` (fórmula abaixo) e aplique à composição.
4. Reescreva o marcador com o nível-alvo.
5. Reporte card a card: `nível antigo → nível novo`.

## Do nível ao fator de escala

Escala **multiplicativa**, passo de +15% por nível, nível 3 = 1,00 (o tamanho cru do `mira-animator`). Tabela de referência (escala absoluta em relação ao nível 3):

| Nível | Escala absoluta |
|---|---|
| 1  | 0,76 |
| 2  | 0,87 |
| 3  | 1,00 |
| 4  | 1,15 |
| 5  | 1,32 |
| 6  | 1,52 |
| 7  | 1,75 |
| 8  | 2,01 |
| 9  | 2,31 |
| 10 | 2,66 |

O fator que você **aplica** parte sempre do nível atual, não do nível 3:

```
k = escala(alvo) / escala(atual)
```

Exemplos:
- Atual 3, alvo 6: `k = 1,52 / 1,00 = 1,52` (cresce 52%).
- Atual 5, alvo 6: `k = 1,52 / 1,32 = 1,15` (só os 15% que faltavam).
- Atual 3, alvo 2: `k = 0,87 / 1,00 = 0,87` (encolhe 13%).
- Atual = alvo: `k = 1,00`. Não edite, só informe "já está no nível X".

## Como escalar a composição

Mexa **só dentro do SVG**. **Nunca** altere a altura do `.anim-stage` (o `height: clamp(...)`): o palco fica igual, quem cresce é o desenho. Escolha a técnica por animação:

### Técnica A (preferida): zoom no viewBox

A maioria das animações desenha uma composição centralizada num `<svg viewBox="minX minY W H" preserveAspectRatio="xMidYMid meet">`. Apertar o viewBox em torno do centro faz todo o desenho (formas, traços, fontes, glow) renderizar `k` vezes maior, com uma única edição de atributo:

```
cx = minX + W/2          cy = minY + H/2
novoW = W / k            novoH = H / k
novoMinX = cx - novoW/2  novoMinY = cy - novoH/2
viewBox = "novoMinX novoMinY novoW novoH"
```

Exemplo, orbital `viewBox="0 0 960 540"` de 3 para 6 (`k = 1,52`): `cx=480, cy=270`, `novoW=631,6`, `novoH=355,3`, `novoMinX=164,2`, `novoMinY=92,4` → `viewBox="164.2 92.4 631.6 355.3"`. Tudo renderiza 1,52× maior, centralizado. Para voltar a 3 (`k=0,658`) o cálculo recompõe exatamente o `viewBox="0 0 960 540"` original, então é reversível.

Use a Técnica A quando a composição estiver **centralizada com margem visível em volta**. Nunca distorce as proporções internas.

### Técnica B (precisa): escalar as constantes de geometria

Quando o SVG não tem viewBox limpo, ou a composição está **ancorada numa borda** (ex.: a escada usa `baseY = H - 90` e gruda no rodapé), o zoom central cortaria o desenho. Nesse caso, multiplique por `k` as **constantes nomeadas** que definem o tamanho:

- raios (`r`, `R`, `rx`, `ry`), comprimentos e larguras (`stepW`, `stepH`, `len`)
- espaçamentos e offsets entre elementos
- `font-size` de textos **dentro** do SVG
- raio do glow no `drop-shadow(0 0 N px ...)` (multiplique o N)
- `stroke-width` quando ele define a grossura visual

Mantenha o ponto de ancoragem coerente (recentralize `baseX`/`cx` se necessário) para a composição continuar emoldurada.

### Regra de verificação (obrigatória nas duas técnicas)

Depois de escalar, **confira que nada vaza do viewBox**: a composição maior precisa caber inteira no palco, sem cortar formas nem textos. Se estourar:

- recentralize, ou
- aumente o viewBox na mesma proporção para reacomodar, ou
- se a animação **já preenche o palco** e não cabe mais crescimento, **não force**: aplique o máximo que cabe e avise que ela já está perto do máximo.

### O que você NUNCA toca

- A altura do `.anim-stage` (`height: clamp(...)`).
- A função de animação, o loop interno, os `setInterval`/`setTimeout`, o contador de geração (`window.__slugGen`) e o registro em `setupAnimationTriggers()`.
- A metáfora visual, as cores, os textos, os ícones.
- Qualquer card fora do escopo pedido.

Cada linha alterada é só geometria, viewBox ou o marcador. Nada além disso.

## Workflow de Execução

1. **Localizar o deck** (`decks/<deck>/index.html` ou `decks/<tema>/index.html`). Se ambíguo, perguntar qual.
2. **Enumerar as animações** (cards com `.anim-stage` + `<svg>`) e ler o marcador `@MIRA:SIZE` de cada uma (3/10 se faltar).
3. **Sem alvo** → reportar a tabela de níveis e parar.
4. **Com alvo** → resolver o escopo (deck inteiro ou slide específico).
5. Para cada animação do escopo:
   - `k = escala(alvo) / escala(atual)`. Se `k ≈ 1,00`, pular e informar.
   - Escolher Técnica A ou B e aplicar a escala.
   - Rodar a regra de verificação (nada vaza do viewBox).
   - Reescrever o marcador para `@MIRA:SIZE <alvo>/10` (criar se não existia).
6. **Reportar** card a card: `nível antigo → nível novo`, marcando os que já estavam no máximo.

## Checklist Antes de Entregar

- [ ] Operou só no deck/slides pedido, nada fora do escopo.
- [ ] Cada animação tocada tem o marcador `@MIRA:SIZE` atualizado com o nível-alvo.
- [ ] Animações sem marcador foram tratadas como 3/10 e ganharam o marcador.
- [ ] A altura do `.anim-stage` não foi alterada.
- [ ] O loop interno, os gatilhos e o contador de geração continuam intactos.
- [ ] Nenhuma forma ou texto vaza do viewBox depois da escala.
- [ ] Animações que já preenchiam o palco foram sinalizadas como "perto do máximo".
- [ ] Relatório `antigo → novo` entregue para cada card do escopo.
- [ ] Nenhum travessão (—) e acentuação UTF-8 correta em qualquer texto tocado.
