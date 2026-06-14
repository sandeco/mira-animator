# Contribuindo

Contribuições são bem-vindas. Abra uma issue para discutir a ideia antes de enviar um pull request.

## Setup

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
npm install
```

## Estrutura do projeto

```
mira-animator/
├── bin/mira.js          # ponto de entrada do CLI
├── lib/                 # comandos (install, link, sources, new, status, update, uninstall) e utils
├── agents/              # os agentes do Mira (skills), uma pasta cada
│   └── _shared/         # regras compartilhadas por todo agente (ex. idioma.md)
├── templates/           # temas, blueprints de slide, esqueletos de deck
└── docs/                # esta documentação (MkDocs Material, 3 idiomas)
```

## Trabalhando num agente

Cada agente vive em `agents/<nome>/` com um `SKILL.md` que define nome, descrição e instruções. As frases de gatilho da descrição são o que fazem o Claude invocar a skill, então mantenha-as precisas. Regras compartilhadas — como a regra de idioma em `agents/_shared/idioma.md` — são herdadas por todo agente; prefira colocar regras transversais ali.

## Trabalhando na documentação

A documentação é feita com **MkDocs Material** e o plugin **i18n**, com três idiomas usando a estrutura `suffix`: `pagina.md` (inglês, padrão), `pagina.pt.md` (Português), `pagina.es.md` (Español).

```bash
pip install mkdocs-material mkdocs-static-i18n
mkdocs serve      # preview em http://127.0.0.1:8000
```

Ao adicionar uma página, inclua-a no `nav` do `mkdocs.yml`, adicione o rótulo em inglês nas `nav_translations` de `pt` e `es`, e crie os três arquivos de idioma.

## Convenções

- Acompanhe o estilo e os idiomas do código ao redor.
- O texto do CLI voltado ao usuário está em português; a documentação é trilíngue com o inglês como base.
- Não quebre os marcadores `@MIRA:` — os agentes dependem deles.

## Licença

MIT — veja [LICENSE](https://github.com/sandeco/mira-animator/blob/main/LICENSE).
