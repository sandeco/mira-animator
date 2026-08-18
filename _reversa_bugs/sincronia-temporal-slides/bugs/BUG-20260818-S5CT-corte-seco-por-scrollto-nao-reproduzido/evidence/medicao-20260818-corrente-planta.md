# Medição em Chrome real, 2026-08-18

Registro de medição a pedido do autor. **Não altera status nem fase do bug**, que seguem
`open` / `triaging`: quem fecha triagem é o `/reversa-debugger`.

## Arranjo

- Deck: `decks/semente-fotossintese/index.html`, corrente de 5 cenas e 4 juntas, construída
  pelo `/mira-sequence-director` com o contrato vigente (peça 5 incluída, `reger` com
  controle de relógio).
- Chrome real por `file://`, viewport 1280x800, puppeteer 25.7.0.
- Script: `dev/corrente-planta/reproduzir-glitch.mjs` (pasta `dev/` não é versionada).
- Amostragem **por quadro dentro da página** (`requestAnimationFrame`), 180 quadros por
  passagem. Ida e volta por CDP perderia exatamente os quadros que interessam.
- Uma aba nova por medição, com o estado de partida conferido antes de amostrar. Numa
  primeira rodada o Chrome restaurou a rolagem entre navegações e falseou o resultado.

## Resultado

| passagem | snap | passos de rolagem | reinícios do relógio de destino |
|---|---|---|---|
| cena 1 -> 2 (corte seco) | `y proximity` | 0 | 0 |
| cena 1 -> 2 (corte seco) | `none` | 0 | 0 |
| cena 3 -> 4 (corte seco) | `y proximity` | 1 | 0 |
| cena 3 -> 4 (corte seco) | `none` | 0 | 0 |
| volta cena 2 -> 1 (rewind) | `y proximity` | 0 | 0 |
| volta cena 2 -> 1 (rewind) | `none` | 0 | 0 |
| capa -> cena 1 (fora do par) | `y proximity` | 74 | 0 |
| capa -> cena 1 (fora do par) | `none` | 75 | 0 |

"Passos de rolagem" conta quadros em que `window.scrollY` mudou. 0 ou 1 é salto instantâneo,
com a diferença entre eles sendo fase de amostragem, não comportamento.

## O que isto diz sobre os três suspeitos do relato

1. **`scroll-snap-type: y proximity`**: **descartado nesta medição.** Desligar o snap não muda
   o resultado das passagens do par. A diferença de 1 para 0 passos no caso cena 3 -> 4 é ruído
   de amostragem, e ocorre com o snap **ligado**, ou seja, no sentido contrário ao da hipótese.
2. **`reger` zerando o relógio a cada reentrada**: **não observado.** Nenhuma cena de destino
   teve o relógio andando e voltando, nas oito passagens.
3. **`'instant'` herdando o `scroll-behavior` do CSS** (hipótese do documento do Gemini):
   **não sustentado.** O corte do par resolve em um passo; a transição fora do par continua
   levando 74 quadros, como deve. Os dois valores coexistindo no mesmo deck é a demonstração
   de que `'instant'` não está herdando o CSS.

## Limite desta medição

O deck medido nasceu com o contrato de hoje. Ela **não** cobre deck anterior à peça 5, nem
deck construído sobre template com timer solto. O sintoma relatado pelo autor pode ter vindo
de um desses caminhos, e o deck original ainda não foi identificado.

## Medição colateral, que sustenta o BUG-20260818-T3RG

Mesmo arranjo, comparando a chegada num slide 0,15 s depois do load contra 6 s depois:

| template | resultado |
|---|---|
| `aula-capitulo` | **diferente**: a animação rodou fora da tela |
| `demo-tecnica` | **diferente**: idem |
| `mira-default` | igual: relógio corretamente gateado |

Chegar num slide cuja história já começou é o mecanismo que produz a descrição do autor
("aparece um frame no futuro") sem envolver rolagem nenhuma. Nos templates acima ele está
reproduzido e medido.
