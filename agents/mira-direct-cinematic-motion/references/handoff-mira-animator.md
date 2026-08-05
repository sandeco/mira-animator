# Handoff para o `/mira-animator`

## Sumário

1. Princípios
2. Formato do handoff
3. Marcadores e invariantes do deck
4. Validação antes de entregar

## 1. Princípios

- Entregar **direção**, não código. Quem escreve a animação dentro do `index.html` é o `/mira-animator`.
- Representar intenção semântica antes de propriedade de biblioteca.
- Usar `id` estável para cada ator, porque ele vira seletor de plano, alvo de câmera e marcação fixa.
- Declarar posição de beat por label, nunca por delay acumulado.
- Não pedir API que não existe. Luz de cena, âncora entre slides e atmosfera estão planejadas e não devem ser chamadas.

## 2. Formato do handoff

Um bloco por cena, em texto. A beat sheet é a mesma que o `/mira-animator` já escreve, com três colunas a mais.

```text
Slide: s03, "A fila que não anda"
Temperamento: sereno · ciclo 11 s · 4 beats · repouso 1,6 s
Metáfora: [uma frase] · Loop: [uma frase]
Stack: D3 com SVG + mira-cinema.js (câmera, 3 planos, grade "brasa")
Grade do deck: brasa
Enquadramento base: palco inteiro, área segura 50 px, nada focal na faixa do título
Atores: #fila (plano 2), #guiche (plano 1), #cidade (plano 4, fundo)
Oclusão: a carga passa ATRÁS de #guiche entre 3,4 s e 4,1 s
Fixos: data-mira-texto-fixo em #rotulo-senha
```

| Beat | Acontecimento | Ator | Duração | Easing | Enquadramento | Plano | Luz |
|---|---|---|---|---|---|---|---|
| 1 | estado inicial legível | #fila | 1,8 s | `sine.inOut` | `estabelecer` | 2 | 🟡 |
| 2 | a carga chega | #carga | 2,2 s | `power2.out` | nenhum | 2 | 🟡 |
| 3 | o guichê fecha | #guiche | 1,4 s | `power2.in` | `aproximar`, razão: a consequência é pequena e precisa ser lida | 1 | 🟡 |
| 4 | leitura da consequência | nenhum | 1,6 s | nenhum | `segurar` | 2 | 🟡 |

Regras das três colunas:

- **Enquadramento:** qual cue, com razão narrativa. Cue sem razão é reprovado. Teto do temperamento: 2 em `sereno`, 3 em `natural`.
- **Plano:** a que plano de profundidade o ator pertence, de 3 a 5 planos. A cena declara **onde acontece a oclusão**, porque parallax sem oclusão lê como recorte deslizante.
- **Luz:** fica marcada 🟡 enquanto a luz de cena não existir. Não inventar chamada. Quando a cena usar sombra ou reflexo no futuro, ela precisa declarar o **plano de chão**, porque a maioria das cenas do MIRA flutua no vazio preto e o efeito viraria um no-op silencioso.

Fechar cada cena com:

```text
Loop interno: [o que continua vivo, e como o corte é escondido]
Saída: [o que atravessa para o próximo slide]
Formatos: [o que muda em 1:1, 9:16 e terços]
Reduced motion: [o que vira estado em vez de movimento]
Testes: [o que o autor deve olhar no navegador]
```

## 3. Marcadores e invariantes do deck

| Item | Regra |
|---|---|
| `@MIRA:SIZE` | nasce em `3/10`, na linha acima do palco, e é medido no enquadramento base |
| `@MIRA:SPEED` | fator de ritmo do slide, ajustado pela tecla `A`. A partitura não o define, o autor sim |
| Área segura | 50 px, em todo formato |
| Título | o palco ocupa o quadro inteiro e o título flutua por cima. Nada focal na faixa do título. No `mira-default`, essa faixa é medida pelo `palco()` inline do template, que expõe `F.topo`, `F.alturaUtil` e `F.vy(k)`. O `MiraCinema.palco()` é outra superfície e não tem esses nomes |
| Replay | a mesma função é rechamada, e não pode produzir duas execuções |
| Trigger | a cena toca ao entrar em tela e recomeça do zero ao voltar |
| Edição e pintura | as teclas `E` e `P` pausam a timeline. A cena nunca sobrescreve o que o autor moveu |
| `file://` | o deck abre com duplo clique, offline |

## 4. Validação antes de entregar

O handoff está pronto quando:

- todo beat tem alvo, duração, easing e função narrativa;
- a soma dos beats deixa uma janela contínua de 1 s sem evento focal;
- nenhum cue de câmera está sem razão, e o teto do temperamento é respeitado;
- a cena com profundidade tem pelo menos uma oclusão declarada;
- nenhum `Math.random()` aparece na direção;
- o estado em `t = 0` é reproduzível, e a mesma seed produz o mesmo quadro;
- o loop fecha sem salto perceptível;
- reduced motion preserva informação e ordem;
- o texto indispensável continua legível durante a câmera;
- a cena, descrita sem câmera, sem planos e com grade `neutra`, ainda conta a história.
