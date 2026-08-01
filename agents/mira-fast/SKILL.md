---
name: mira-fast
description: >-
  Cria um deck Mira completo em uma chamada, com uma folha por slide executada
  em paralelo por um workflow do Claude Code. Use quando o usuário pedir
  /mira-fast, deck rápido, modo turbo, deck inteiro de uma vez ou deck em
  paralelo. Aceita os formatos mira, mira-studio, mira-studio-full e
  mira-vertical. Para um slide avulso, use mira-animator.
---

# Mira Fast

Um tema entra; um deck Mira completo sai. A qualidade deve ser equivalente à cadeia normal, sem gates humanos intermediários. O workflow decide e paraleliza; o script Node monta.

## Motor obrigatório

**ORDEM ABSOLUTA:** a primeira ação do `/mira-fast` é criar, de uma vez, a pasta do deck e toda a árvore interna. Antes de mensagem intermediária, validação de fonte, leitura, memória, planejamento, pergunta ou workflow, resolva `deck_id = YYYY-MM-DD <slug>` e crie `decks/<deck_id>/`, `references/`, `assets/`, `assets/vendor/`, `mira/` e `mira/fast/`. Nenhuma pasta fica para depois.

No Claude Code 2.1.154 ou superior, esta skill é a interface. O motor é o workflow de projeto `.claude/workflows/mira-fast-engine.js`; Dynamic workflows deve estar habilitado em `/config`.

1. Ao receber `/mira-fast ...`, execute a **Fase 0** na sessão principal (resolver o slug e criar a estrutura do deck) e em seguida invoque `mira-fast-engine` pela ferramenta `Workflow`, passando os argumentos originais **mais o `slug` e o `deck_dir` já resolvidos**. O plano tem que usar esse slug, senão a Fase 1 abre uma segunda pasta e deixa órfão o material colocado em `references/`.
2. Não emule o workflow dentro da conversa.
3. Se o workflow ou a ferramenta `Workflow` não estiver disponível, encerre com `MIRA_FAST_PARALLELISM_UNAVAILABLE` e indique `npx mira-animator update`.
4. Nunca degrade para geração sequencial.

O workflow faz fan-out com `pipeline(plan.slides, ...)`: uma folha por slide, até o limite de concorrência do Claude Code. Acima do limite, o runtime enfileira o excedente automaticamente.

A skill não faz perguntas sobre conteúdo, formato, tema ou continuidade. A Fase 0 não abre exceção: ela cria pastas e informa um caminho, sem perguntar nada nem esperar resposta. Fonte apontada e ausente **falha**, não vira pergunta. Uma solicitação de permissão exibida pelo Claude Code pertence ao ambiente e não pode ser contornada.

## Invocação

```text
/mira-fast <tema ou caminho>                 -> mira 16:9
/mira-fast /mira-studio <tema ou caminho>    -> Studio 9:16
/mira-fast /mira-studio-full <tema ou caminho> -> Studio Full 16:9
/mira-fast /mira-vertical <tema ou caminho>  -> vertical 9:16
```

Se o primeiro token começar por `/mira-` e não for um desses formatos, falhe sem criar o deck. Nunca infira o formato pelo tema.

| Formato | Saída | Regras adicionais |
|---|---|---|
| `mira` | `index.html` | `mira-default`: título no topo e palco amplo, sem card |
| `mira-studio` | `index.html` | `capa`, `camera`, `split`, `full`; gera `roteiro.md` |
| `mira-studio-full` | `index-16x9.html` | `camera`, `thirds`, `full`; gera `roteiro.md` |
| `mira-vertical` | `index-9x16.html` | palco com eixo vertical dominante |

Consulte a skill do formato apenas na Fase 1, para criar o esqueleto completo. O esqueleto nasce pelo **caminho canônico** `npx mira-animator new <slug> --deck=<template> --theme=<tema>`, nos quatro formatos: é ele que injeta o bloco `@MIRA:THEME` e, via `ensureResponsive`, o `@MIRA:RESPONSIVE`, os dois exigidos pelo validador da Fase 3. No formato `mira` o template é sempre `mira-default`; não pergunte por template. Cada folha lê somente `contrato-base.md`, o contrato do seu modo e o contrato do seu formato; a montagem Node não consulta skills.

Entrada existente no disco é fonte; pasta agrega os textos legíveis; tema descrito em linguagem natural é tema livre e segue direto.

**Fonte apontada e não encontrada é falha, nunca tema livre.** Se a invocação aponta um arquivo ou pasta (extensão, separador de caminho, ou frase do tipo "a partir de", "use o documento", "com base no livro") e esse caminho não existe no disco, encerre com `MIRA_FAST_FONTE_NAO_ENCONTRADA`, informe o caminho absoluto de `decks/<deck_id>/references/` criado na Fase 0 e diga que basta colocar o material lá e chamar de novo. O mesmo vale para `/mira-fast` **sem argumento nenhum**. Caminho digitado errado não pode virar um deck inventado do começo ao fim.

O slug é kebab-case e o nome da pasta é sempre `YYYY-MM-DD <slug>`. Deck **já construído** é o que tem `index*.html` ou `mira/fast/plano.json`; nesse caso use `-2`, `-3` etc. no slug, sem perguntar. Pasta que só tem o esqueleto da Fase 0, com ou sem arquivos em `references/`, **não** é colisão: é o deck desta execução, reaproveite. Bumpar para `-2` ali abandonaria o material que o usuário acabou de colocar.

## Invariantes

- O plano contém N slides e o workflow dispara N folhas.
- Cada folha escreve somente `mira/fast/slide-NN.html` e seu `result-NN.json`.
- Toda folha tem `modo_folha: estatica | animada`.
- Capa, card, CTA, encerramento e layout `camera` são estáticos.
- Slides de metáfora são animados.
- Plano, fragmentos e arquivo final têm escritores exclusivos.
- A estrutura de pastas do deck tem um único escritor, a Fase 0.
- A ordem final é `slides[].n`, nunca a ordem de término.
- Cada folha valida o próprio fragmento e recebe no máximo duas tentativas sequenciais.
- Nenhum fragmento inválido é omitido silenciosamente: a montagem falha e registra o motivo.

## Estado no deck

```text
decks/<deck_id>/
├── index*.html
├── roteiro.md                 # Studio e Studio Full
├── mira/
│   ├── mira-edit.js
│   ├── mira-edit-free.js
│   ├── mira-draw.js
│   └── fast/
│       ├── plano.json
│       ├── esqueleto.html
│       ├── slide-01.html
│       ├── result-01.json
│       ├── ...
│       └── montagem.log
├── assets/
└── references/
    ├── quadro-metaforas.md     # artefato do plano
    └── ...                     # material do usuário, preservado
```

As pastas `references/`, `assets/` e `mira/` existem desde a Fase 0. Nunca apague `mira/fast/`. Nunca apague nem sobrescreva material do usuário em `references/`: o único arquivo que o Mira escreve lá é o `quadro-metaforas.md`. Não coloque JS de apoio na raiz.

## Fase 0: estrutura do deck

Resolvido o slug e antes de invocar o workflow, a sessão principal cria a estrutura no disco:

```text
decks/<deck_id>/
decks/<deck_id>/references/
decks/<deck_id>/assets/
decks/<deck_id>/assets/vendor/
decks/<deck_id>/mira/
decks/<deck_id>/mira/fast/
```

Depois informe em uma linha o **caminho absoluto** de `decks/<deck_id>/references/` e que material colocado lá é lido pelo plano. Caminho relativo não serve: quem vai arrastar um PDF precisa do caminho que abre no explorador.

Isso não é uma parada. A Fase 0 não pergunta nada e o workflow começa em seguida, no mesmo turno. Ela existe porque a pasta precisa estar no disco desde o primeiro segundo: sem ela, quem tem o material na mão não tem onde colocar, e é justamente esse o caso em que o `/mira-fast` mais rende.

Só a Fase 0 cria essa estrutura. A Fase 1 a herda e nunca recria (invariante de escritor exclusivo). Nada dentro de `references/` é apagado ou sobrescrito aqui.

## Fase 1: plano

Um agente central resolve somente decisões globais:

0. Consulta a memória de preferências e embute o resultado no plano, para que os agentes do fan-out recebam a mesma orientação (eles não consultam de novo, um por um):

```bash
npx mira-animator memoria consolidar
npx mira-animator memoria lembrancas --papel capa --formato <formato>
npx mira-animator memoria lembrancas --papel conteudo --formato <formato>
```

   O texto que voltar entra em `plano.json` no campo `lembrancas` e é repassado no prompt de cada agente de slide. Lembrança é orientação, não ordem; a marca manda acima dela; nota candidata não é aplicada. Comando que falha não interrompe nada: siga sem memória.

1. Lê a fonte e escolhe arco, quantidade, tipos e ordem.
2. Define paleta, tom, títulos e layouts.
3. Para cada slide animado, define frase causal, família, metáfora e seis eixos.
4. Elimina colisões pelo ledger descrito em `references/quadro-metaforas.md`.
5. Atribui `slug_stage` único a todos e `js_id` seguro somente aos animados.
6. Cria `mira/fast/esqueleto.html` e os artefatos de referência, dentro da estrutura que a Fase 0 já deixou pronta. **Não recria as pastas do deck e não toca no que houver em `references/`**, além de gravar seus próprios artefatos. O esqueleto vem do caminho canônico `npx mira-animator new <slug> --deck=<template> --theme=<tema>`. **Copiar o arquivo do template direto pula a injeção do `@MIRA:RESPONSIVE` e produz esqueleto que a Fase 3 reprova**; a cópia manual é fallback de `01#R7`, e nela os dois blocos ficam por sua conta. Para `mira` o template é `mira-default`: preserva o marcador `MIRA-DEFAULT`, o runtime e o CSS `.slide-main`/`.slide-centro`. Em todos os formatos, remove os slides de exemplo e abre os seis slots.
7. Grava `mira/fast/plano.json` conforme `references/plano-schema.md` e `references/quadro-metaforas.md`.

O esqueleto preserva o runtime completo do formato, mas não contém nenhuma `<section>`. Ele inclui exatamente uma vez:

```html
<!-- @MIRA:FAST:CSS:START -->
<!-- @MIRA:FAST:CSS:END -->
<!-- @MIRA:FAST:SLIDES:START -->
<!-- @MIRA:FAST:SLIDES:END -->
<!-- @MIRA:FAST:JS:START -->
<!-- @MIRA:FAST:JS:END -->
```

O slot CSS fica em `<head>`. Os slots de slides e JS ficam nessa ordem em `<body>`; o JS vem depois do builder do roteiro nos formatos Studio. O plano é retornado de forma estruturada ao workflow. Não gera slides.

## Fase 2: fan-out

`pipeline()` recebe `plan.slides`. Cada item abre um agente independente com:

- os campos globais do plano;
- exatamente um objeto de slide;
- `references/contrato-base.md`;
- `references/contrato-estatico.md` ou `references/contrato-animado.md`;
- `references/formato-<formato>.md`.
A folha não lê plano completo, deck final, vizinhos ou outras folhas. Na segunda tentativa, pode ler somente seu próprio fragmento anterior. Folha animada aplica o método de metáfora e movimento. Folha estática implementa somente o layout determinado.

Depois de escrever, a folha roda o validador com `--slide N` e grava `result-NN.json` com tentativa e resultado. Resultado inválido ou erro de agente dispara uma segunda e última tentativa para o mesmo slide, nunca em paralelo com a primeira.

## Fase 3: fan-in

Depois que o workflow devolver todas as folhas, a sessão principal executa, sem abrir outro agente:

```text
node .claude/skills/mira-fast/scripts/assemble-run.mjs "<deck_dir>"
```

O script valida plano, fragmentos e esqueleto; extrai HTML/CSS/JS; ordena por `slides[].n`; gera somente os triggers animados; instala os módulos; gera `roteiro.md` nos formatos Studio; grava atomicamente o HTML final e sempre atualiza `mira/fast/montagem.log`.

Se falhar, não publique nem abra um deck parcial. Se passar, abra o HTML final. A sessão principal não reescreve a saída do script.

Os módulos abaixo são obrigatórios, nesta ordem:

```html
<script defer src="mira/mira-edit.js"></script>
<script defer src="mira/mira-edit-free.js"></script>
<script defer src="mira/mira-draw.js"></script>
```

Studio também instala os módulos de câmera/gravação exigidos por sua skill. Studio Full instala `mira-record-16x9.js`.

A capa deve conter:

```css
body > section:first-of-type h1,
body > section:first-of-type h2 { text-wrap: balance; }
```

A raiz do deck contém somente o HTML final, launchers aplicáveis, `roteiro.md` nos formatos de gravação e a pasta obrigatória `references/`. Bibliotecas e imagens ficam em `assets/`; JS de apoio em `mira/`.

## Portões de saída

- estrutura do deck criada na Fase 0, com o caminho absoluto de `references/` informado;
- material do usuário em `references/` intacto;
- workflow usado, não emulado;
- N slides = N folhas válidas, considerando retries sequenciais por slide;
- nenhum escritor compartilhado;
- nenhum agente de montagem depois do `pipeline()`;
- validação determinística aprovada;
- arquivo final na geometria correta;
- modos E e P presentes;
- capa balanceada;
- raiz limpa;
- deck aberto no navegador.
