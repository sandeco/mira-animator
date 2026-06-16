# Plugin do Codex

O Mira inclui um wrapper de plugin local para o Codex em `plugins/mira-animator/`. O plugin ajuda o Codex a preparar o Mira em uma pasta dedicada de slides, vincular fontes somente leitura, criar decks e seguir o fluxo de validação do Mira.

O plugin não altera o runtime do pacote npm. Ele é distribuído a partir deste repositório como uma entrada de marketplace local do Codex.

## Instalar a partir deste repositório

Clone o repositório e registre o marketplace local:

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
codex plugin marketplace add .
codex plugin add mira-animator@mira-animator
```

Depois da instalação, abra uma nova conversa no Codex para que ele carregue os metadados da skill do plugin.

## Usar o plugin

Peça ao Codex para usar o Mira, por exemplo:

```text
Use o plugin mira-animator para preparar uma pasta de slides para este projeto.
```

O plugin deve orientar o Codex a:

1. Escolher ou criar uma pasta dedicada de slides.
2. Verificar se o Node.js está na versão 18.20.2 ou superior.
3. Rodar `npx mira-animator install` dentro da pasta de slides.
4. Incluir a engine `Codex` quando o instalador do Mira perguntar quais engines devem ser suportadas.
5. Vincular projetos ou documentos fonte com `npx mira-animator link`.
6. Criar e validar decks dentro de `decks/`.

## Regra importante de isolamento

Não instale o Mira dentro do projeto fonte que será apresentado, a menos que essa pasta seja intencionalmente a pasta de slides. O Mira deve ler fontes vinculadas e escrever a saída gerada apenas dentro da pasta de slides, principalmente em `decks/`.

## Arquivos para mantenedores

- `.agents/plugins/marketplace.json` expõe o marketplace local do repositório.
- `plugins/mira-animator/.codex-plugin/plugin.json` define os metadados do plugin.
- `plugins/mira-animator/skills/mira-animator/SKILL.md` define o fluxo do Mira voltado ao Codex.

O plugin credita sandeco como criador do Mira e Mario Mayerle (`https://mariomayerle.com`) como desenvolvedor do plugin.
