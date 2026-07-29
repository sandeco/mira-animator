# Agentes úteis

A cadeia de conteúdo que alimenta a montagem. Veja como eles se conectam no [Pipeline de agentes](../pipeline.md).

## `/mira-extract`
O extrator de contexto. Lê uma fonte vinculada no `mira.config.json` (pasta de projeto, PDF, LaTeX ou texto) e produz um briefing estruturado que alimenta o planner. Primeiro elo da cadeia.

## `/mira-planner`
Planejador de conteúdo. Analisa o conteúdo de um capítulo (LaTeX, PDF ou texto) e produz um plano de slides detalhado **antes** de qualquer montagem visual — quantos slides, o que cada um cobre, a estrutura — e espera aprovação.

## `/mira-copywriter`
Refina o texto dos slides e especifica imagens, trazendo o texto para a altura de slide (curto, direto, apresentável) em vez da altura de parágrafo.

## `/mira-validator`
Analisa o HTML gerado e valida conformidade visual, estrutural e de assets — um relatório final de qualidade. Rode após uma montagem, ou para diagnosticar um deck existente.

## Modo edição: `mira edit`
Reordene os slides de um deck **depois** da montagem, sem regenerá-lo. Decks novos já vêm com o modo edição embutido; para ligá-lo num deck que já existe, rode a CLI:

```bash
npx mira-animator edit <deck>   # nome do deck, pasta do deck ou o caminho do index.html
```

Isso copia `mira-edit.js`, `mira-edit-free.js` e `mira-draw.js` para `<deck>/mira/` e injeta as três tags antes de `</body>`. A edição livre carrega depois da edição-base. A tecla **E** abre a edição e a tecla **P** abre a pintura.

**Como funciona o reorder**

1. Abra o deck e aperte **E** (ou acrescente `?edit=1` na URL) para ligar e desligar o modo edição.
2. Cada slide mostra o número da sua posição e setas **↑ ↓**. Clique nelas para subir ou descer o slide; a numeração se atualiza na hora.
3. Clique em **Salvar ordem** para gravar a nova ordem de volta no `index.html` de origem. **Esc** ou **Sair** deixa o modo (ele avisa antes se houver mudança não salva).

O salvar não serializa o DOM ao vivo (que o GSAP, o D3 ou o Lucide já mexeram): ele relê o arquivo-fonte e troca apenas os blocos de texto entre os marcadores `<!-- ... SLIDE ... -->`, mantendo a formatação intacta. Funciona no layout Mira (slides são `<section>` no `<body>`) e em decks GSAP legados (slides dentro de `<main>`).

Sirva o deck por HTTP para salvar sem diálogo nenhum:

```bash
node lib/mira-serve.js decks/<nome>
```

No `file://`, a File System Access API do Chrome pede para você apontar o `index.html` uma vez (lembrado durante a sessão); navegadores sem ela caem no fallback de copiar a nova ordem para você repassar.
