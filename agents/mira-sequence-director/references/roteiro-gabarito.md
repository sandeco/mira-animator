# Gabarito do roteiro de continuidade

O arquivo vive em `references/sequence-director-<id>.md`, na pasta do deck. Um arquivo por corrente. Ele é a fonte da verdade daquela corrente: quem abrir o deck em seis meses acha ali por que a corrente tem essas cenas, quem atravessa cada corte e onde cada cena repousa.

Não confunda com o `roteiro.md` da raiz do deck, que é do `/mira-studio` e é o roteiro de fala do gravador.

Copie a estrutura abaixo inteira. Nenhum campo é opcional.

---

```markdown
# Corrente: <nome curto da corrente>

> Roteiro de continuidade, gerado pelo `/mira-sequence-director`.
> Deck: `<caminho do deck>` · id da corrente: `<id>` · cenas: `<N>`
> Data: `<AAAA-MM-DD>`

## Teste de forma

**Veredito:** aprovado.
**Por quê:** <uma frase dizendo o que se transforma ao longo da corrente. Precisa ser
uma coisa só mudando de estado, não coisas diferentes se sucedendo.>

## Metáfora única

<Uma frase. Vale para a corrente inteira e nenhum elo pode trocá-la. É a mesma frase
que o `/mira-animator` elegeu na cena 1.>

## Palco

- **Template:** `<mira-default | outro>`
- **Título da corrente:** "<texto exato, o mesmo em todos os elos>"
- **Política de título:** `constante` (padrão) ou `rótulo de etapa`
- **Modo cinema:** `não` ou `sim, câmera travada em <posição>`

## Elenco da corrente

| Ator | O que é | Entra na cena | Sai na cena |
|---|---|---|---|
| `<nome>` | <uma frase> | 1 | permanece |
| `<nome>` | <uma frase> | 2 | 4 |

O elenco não cresce em todas as cenas. Se ninguém sai, a cena final fica carregada, e
isso tem que estar dito aqui.

---

## Cena 1, <nome curto>

- **id do par:** `<id-curto>`
- **elenco herdado:** nenhum, é a cena de abertura
- **entra:** `<ator>`, `<ator>` (podem entrar coreografados, é a única cena que pode)
- **sai:** nenhum
- **ação:** <uma frase. O que acontece nesta cena.>
- **pose de repouso:** `{ x: F.W / 2, y: F.vy(.82), r: 46 }`
- **o que muda na cena seguinte:** <uma frase. É a única entrada que o `/mira-sequence`
  declara não conseguir deduzir sozinho.>

## Cena 2, <nome curto>

- **id do par:** `<id-curto>`
- **elenco herdado:** `<ator>` (entra sem coreografia nenhuma, já está em cena)
- **entra:** `<ator novo>`
- **sai:** nenhum
- **ação:** <uma frase>
- **pose de repouso:** `{ ... }`
- **o que muda na cena seguinte:** <uma frase>

## Cena N, <nome curto>

- **id do par:** `<id-curto>`
- **elenco herdado:** ...
- **entra:** ...
- **sai:** ...
- **ação:** ...
- **pose de repouso:** `{ ... }`
- **o que muda na cena seguinte:** fim da corrente

---

## O que este roteiro altera no deck

<Lista honesta. Normalmente: as N seções novas, o barramento uma vez, a guarda de corte
seco nos caminhos de navegação encontrados. Se a cena 1 for um slide existente sem
compasso de repouso, a alteração dele entra aqui, nomeada, antes de acontecer.>
```

---

## Como preencher a pose de repouso

Escreva **com a mesma expressão que a cena usa**, não com número mágico. Se a cena calcula o repouso como `F.vy(.82)`, o roteiro diz `F.vy(.82)`. É essa expressão que o elo seguinte vai copiar para o `poseEntrega(F)` dele, e é por isso que copiar o número resolvido quebra: o título do elo seguinte pode ter outra altura, e o número deixa de bater.

O que o barramento grava em tempo de execução é outra coisa: ali são coordenadas absolutas do viewBox, resolvidas, objeto novo a cada quadro. Isso é o contrato do `/mira-sequence` e não é assunto do roteiro.

Só entra na pose o que **atravessa**: posição, raio, ângulo, opacidade, deformação. Estado interno da cena não atravessa.

## Como preencher "o que muda na cena seguinte"

Uma frase, no presente, dizendo o comportamento novo. "A bola só sobe e desce". "O feixe passa a atravessar a folha". Não descreva a cena inteira, descreva a mudança. É literalmente o texto que vai para o `/mira-sequence` quando aquele elo for construído.

## Como preencher o elenco

Três listas por cena, e as três importam por motivos diferentes:

- **Herdado** define quem não pode ter entrada nenhuma naquele elo. Sem fade, sem stagger, sem escala 0, sem `data-aos`.
- **Entra** define quem pode entrar coreografado, porque é novo em cena e não veio do corte.
- **Sai** define quem some, e quem some tem que sumir **dentro** da cena, antes do repouso. Ator que desaparece no corte é o defeito mais visível que uma corrente pode ter.
