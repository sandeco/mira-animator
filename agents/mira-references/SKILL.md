---
name: mira-references
description: >-
  Cria e organiza a pasta references/ de um tema de slides, incluindo
  automaticamente o material que já estiver lá. A fonte é sempre local ao tema,
  nunca perguntada na instalação. Use SEMPRE que o usuário disser
  /mira-references, adicionar referência, adicionar referencias, onde coloco o
  material, onde ponho a fonte, preparar as fontes do slide, referências para o
  tema, vincular conteúdo para os slides, criar pasta de referências, quais
  referências esse slide vai usar, ou pedir para apontar PDF, imagem, diagrama,
  livro, artigo ou print como base de um slide. Use também antes de criar um
  slide quando o tema ainda não tiver uma pasta de referências.
---

# Skill: Referências por Tema

## O que esta skill faz

Cada tema de slides tem a sua própria pasta de referências, dentro da pasta do tema:

```
slides/
└── <tema>/
    ├── index.html        (o deck do tema, criado pelas outras skills)
    └── references/        (o material-fonte SÓ deste tema)
        ├── livro-cap.pdf
        ├── diagrama.png
        └── notas.md
```

A referência de um slide vive ao lado do slide, dentro de `references/`. Você adiciona o material aqui, por tema, e as skills de criação (mira-extract, mira-builder, mira-animator) leem daqui.

## Regra de Inclusão Automática

Se a pasta `decks/<tema>/references/` já tiver arquivos, eles JÁ SÃO as referências do tema. Inclua-os sem perguntar de novo. Só pergunte material novo se a pasta estiver vazia ou se o usuário quiser acrescentar algo.

## Passos quando a skill é acionada

1. **Descobrir o tema.** Se o usuário não disser, pergunte um nome curto de tema. Gere um slug em kebab-case, minúsculo, sem acento (ex.: "Spec Driven Development" vira `spec-driven`).
2. **Garantir a estrutura.** Crie, se não existir, `decks/<tema>/` e dentro dela `decks/<tema>/references/`.
3. **Listar o que já existe.** Liste os arquivos de `decks/<tema>/references/`. Se houver, informe que serão usados como fonte deste tema.
4. **Receber o material novo (se houver).**
   - Caminho de arquivo ou pasta que o usuário passar: COPIE para `decks/<tema>/references/` (copiar, nunca mover nem editar o original).
   - Texto colado: salve como `.md` dentro de `references/`.
   - Link: salve como `.url` ou registre em um `fontes.md` dentro de `references/`.
5. **Confirmar o destino.** Mostre o caminho `decks/<tema>/references/` e diga ao usuário que basta soltar mais arquivos ali a qualquer momento.
6. **Encerrar apontando o próximo passo:** para gerar os slides do tema, as skills de criação devem ler TUDO que estiver em `decks/<tema>/references/`.

## Tipos de Referência Aceitos

- PDF (livro, capítulo, artigo, slides antigos)
- Imagens e diagramas (`.png`, `.jpg`, `.svg`, prints)
- Texto e markdown (`.md`, `.txt`)
- LaTeX (`.tex`)
- Código ou dados que embasem um slide
- Links salvos em `fontes.md`

## Regras Inegociáveis

- Uma pasta por tema. A referência mora dentro da pasta do tema, em `references/`.
- Nunca leia, edite ou apague nada fora de `decks/<tema>/references/`. Ao copiar de um caminho externo, o original fica intacto.
- A fonte de conteúdo nunca é perguntada na instalação. É sempre adicionada aqui, por tema.
- Se as referências já existem, inclua-as automaticamente.
- Texto visível em português brasileiro com acentuação correta. Proibido travessão (—); use vírgula ou dois-pontos.

## Integração com o Pipeline

Quando o usuário pedir um slide ou deck sobre um tema, antes de criar verifique se `decks/<tema>/references/` existe e tem conteúdo. Se não existir, acione esta skill primeiro. As referências encontradas aqui são a fonte de verdade para mira-extract (briefing), mira-builder (montagem) e mira-animator (animações).
