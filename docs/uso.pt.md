# Como usar

Esta página percorre o fluxo completo, de uma pasta vazia até um deck animado pronto.

## 1. Instale e vincule

```bash
cd minha-pasta-de-slides
npx mira-animator install
npx mira-animator link ../meu-projeto --name=meuprojeto
```

Veja [Instalação](instalacao.md) e [Fontes vinculadas](fontes.md) para detalhes.

## 2. Crie um deck

Criar um deck é conversacional — basta falar com o `/mira-new` dentro do Claude:

```text
/mira-new crie uma nova apresentação chamada 'minha-aula'
```

Ela pergunta **só o nome do tema** e já cria a pasta `decks/<tema>/` com a `references/` pronta, mostrando o caminho completo dela. Aí ela para e pergunta como você quer começar: contar por texto ali no chat do que trata a apresentação, ou colocar seus arquivos (PDF, documento, prints, links) na pasta de referências e avisar. Só depois disso ela pergunta o resto (template do deck, tema base, cor principal), monta o deck e oferece acionar o pipeline.

A pasta primeiro existe por um motivo prático: quem já tem o material na mão precisa de um lugar para colocá-lo antes de decidir template e cor. Se você voltar mais tarde, na mesma sessão ou em outra, o `/mira-new` reconhece a pasta como deck em andamento, lista o que encontrou em `references/` e continua de onde parou.

Você também pode já indicar o template e o tema na própria frase:

```text
/mira-new crie uma apresentação chamada 'minha-aula' com o template aula-capitulo e o tema mira-dark
```

**Templates de deck**

| Template | Para |
|---|---|
| `mira-default` | **Padrao.** Titulo em cima, animacao ocupando o resto do slide |
| `aula-capitulo` | Uma aula ou palestra a partir de um capítulo / módulo |
| `pitch-projeto` | Um pitch de projeto |
| `demo-tecnica` | Uma demo técnica / walkthrough |
| `sandeco-just-animation-template` | Um palco preto, sem texto, apenas para a animacao do Mira |

**Temas:** `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald`.

### Atalho: o deck inteiro de uma vez

Se você não quer passar pelos passos 2 e 3 separados, o [`/mira-fast`](agentes/core.md#mira-fast) faz tudo numa única chamada, gerando os slides em paralelo:

```text
/mira-fast spec driven development
/mira-fast /mira-vertical o livro em references/meu-livro.pdf
```

Ele não pergunta nada, do tema ao HTML final, e por isso você não aprova o plano de slides no meio do caminho. Também cria a pasta do deck com a `references/` antes de planejar, e falha avisando se você apontar uma fonte que não existe. Precisa de **Dynamic workflows** habilitado em `/config`.

## 3. Preencha o deck

De volta ao Claude, aponte um deck para uma fonte em linguagem natural:

> *"preencha o deck minha-aula com o conteúdo da fonte meuprojeto"*

Isso dispara o [pipeline de agentes](pipeline.md):

```mermaid
flowchart LR
    E[mira-extract] --> P[mira-planner]
    P --> C[mira-copywriter]
    C --> B[mira-builder]
    B --> A[mira-animator]
    A --> V[mira-validator]
```

Cada orquestrador **pausa entre os agentes** e mantém você no controle. O planner, em particular, mostra o plano de slides e espera aprovação antes de qualquer coisa ser montada.

## 4. Ajuste as animações

Com o deck montado, você pode moldar o movimento:

- **Tamanho** — *"coloca as animações em 6/10"* ou *"esse slide está pequeno, deixa em 7/10"*. O agente `mira-size-animator` escala a percepção de tamanho de cada animação numa escala de 1 a 10 (o padrão que o `mira-animator` gera é 3/10).
- **Metáfora** — *"transforma esse conceito numa metáfora animada"*. O próprio `mira-animator` substitui a animação de um slide por outra analogia concreta do cotidiano, no lugar, mantendo título e pílulas.
- **Visuais** — peça ao `mira-visuals` painéis estáticos, diagramas ou infográficos, ou ao `mira-chart` gráficos de dados a partir de um CSV/JSON, uma imagem, ou até um rascunho à mão, ou ao `mira-chart-race` para dados temporais que correm no tempo (barras que reordenam ou linhas que se desenham).
- **3D, QR, quizzes e imagens:** coloque um elemento 3D de verdade, que gira sozinho, com `/mira-3d`, um QR code escaneável (de um link ou texto) com `/mira-qrcode`, um quiz ao vivo com resposta correta revelada pelo apresentador usando `/mira-quiz`, ou uma imagem que você já tem com `/mira-image`. Um slide 3D que carrega um `.glb` precisa de servidor local (o agente sobe um e gera um launcher de duplo-clique); todo o resto abre por `file://`.
- **Morph de formas:** faça uma forma SVG morfar em outra em loop com `/mira-svg-morph` (você passa os arquivos), ou `/mira-icon-morph` para fazer isso a partir de conceitos em palavras, com ícones buscados e licenciados na Iconify.
- **Animar um SVG:** faça um SVG que você fornece se mexer (bater, girar, deslizar, pulsar, desenhar) com `/mira-svg-animator`; se for um path único fundido, ele separa a parte a animar.

## 4.5 O deck aprende o seu gosto

O Mira guarda uma memória local das suas correções. A cada Salvar no modo edição (tecla `E`), a diferença entre o que o builder gerou e o que você corrigiu é anexada em `~/.mira-memory/evidencia.jsonl`. Nada sai da sua máquina.

- **Ditar uma regra agora:** `npx mira-animator memoria nota "menos texto por slide" --eixo densidade`. Vira nota ativa na hora e o builder obedece no próximo deck.
- **Deixar ele aprender sozinho:** `npx mira-animator memoria consolidar` transforma o que se repetiu (3 episódios, 3 decks distintos, 2 sessões) em nota **candidata**. Candidata nunca é aplicada até você ativar com `memoria estado <arquivo> ativo`.
- **As notas são suas:** markdown puro em `~/.mira-memory/notas/`. Abra, edite ou revogue. Revogar é estado, nunca delete.
- **A marca sempre manda:** `#FF904D`, equilíbrio da capa e área segura passam por cima de qualquer coisa aprendida.

## 5. Abra e apresente

O deck é um `decks/minha-aula/index.html` autossuficiente. Dê dois cliques — ele roda de `file://`, sem servidor. Navegue card a card. Para fazer um vídeo, grave a tela com a viewport ajustada à resolução do formato alvo.

## 6. Exporte para outros formatos (opcional)

A partir do mesmo deck 16:9, sem tocar no original, você pode gerar versões quadrada, vertical, em regra dos terços e com transição dissolve. Veja [Formatos de vídeo](formatos.md).

## Uma nota sobre idioma

O Mira gera o conteúdo do deck no idioma em que você trabalha. A regra de idioma compartilhada vive em `agents/_shared/idioma.md` e é respeitada por todos os agentes, então os slides saem no seu idioma, não no padrão do agente.
