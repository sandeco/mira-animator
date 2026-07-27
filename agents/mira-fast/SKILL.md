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

No Claude Code 2.1.154 ou superior, esta skill é a interface. O motor é o workflow de projeto `.claude/workflows/mira-fast-engine.js`; Dynamic workflows deve estar habilitado em `/config`.

1. Ao receber `/mira-fast ...`, invoque `mira-fast-engine` com os argumentos originais pela ferramenta `Workflow`.
2. Não emule o workflow dentro da conversa.
3. Se o workflow ou a ferramenta `Workflow` não estiver disponível, encerre com `MIRA_FAST_PARALLELISM_UNAVAILABLE` e indique `npx mira-animator update`.
4. Nunca degrade para geração sequencial.

O workflow faz fan-out com `pipeline(plan.slides, ...)`: uma folha por slide, até o limite de concorrência do Claude Code. Acima do limite, o runtime enfileira o excedente automaticamente.

A skill não faz perguntas sobre conteúdo, formato, tema ou continuidade. Uma solicitação de permissão exibida pelo Claude Code pertence ao ambiente e não pode ser contornada.

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

Consulte a skill do formato apenas na Fase 1, para criar o esqueleto completo. No formato `mira`, use sempre `mira-templates/decks/mira-default/index.html` como fonte canônica; não pergunte por template. Cada folha lê somente `contrato-base.md`, o contrato do seu modo e o contrato do seu formato; a montagem Node não consulta skills.

Entrada existente no disco é fonte; pasta agrega os textos legíveis; caso contrário, é tema livre. O slug é kebab-case. Se `decks/<slug>` existir, use `-2`, `-3` etc., sem perguntar.

## Invariantes

- O plano contém N slides e o workflow dispara N folhas.
- Cada folha escreve somente `mira/fast/slide-NN.html` e seu `result-NN.json`.
- Toda folha tem `modo_folha: estatica | animada`.
- Capa, card, CTA, encerramento e layout `camera` são estáticos.
- Slides de metáfora são animados.
- Plano, fragmentos e arquivo final têm escritores exclusivos.
- A ordem final é `slides[].n`, nunca a ordem de término.
- Cada folha valida o próprio fragmento e recebe no máximo duas tentativas sequenciais.
- Nenhum fragmento inválido é omitido silenciosamente: a montagem falha e registra o motivo.

## Estado no deck

```text
decks/<slug>/
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
    └── quadro-metaforas.md
```

Nunca apague `mira/fast/`. Não coloque JS de apoio na raiz.

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
6. Cria `mira/fast/esqueleto.html`, as pastas do deck e os artefatos de referência. Para `mira`, parte obrigatoriamente de `mira-templates/decks/mira-default/index.html`, preserva o marcador `MIRA-DEFAULT`, o runtime e o CSS `.slide-main`/`.slide-centro`, remove os slides de exemplo e abre os seis slots.
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
