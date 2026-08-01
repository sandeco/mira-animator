# Execução observada

Repositório `/workspaces/.mira`, commit base `558a406`, 2026-08-01. Node v24.15.0.

## Comando

```bash
cd <pasta com mira.config.json>
node /workspaces/.mira/bin/mira.js new teste-studio --deck=mira-studio-demo --theme=mira-dark
```

## Saída do CLI

```
  Deck "teste-studio" criado em decks/teste-studio/index.html
  Template: mira-studio-demo | Tema: mira-dark
  Offline: libs locais em assets/vendor/ (8 arquivos) — abre por file:// sem internet.
  Abra no navegador ou peça ao agente para preencher com uma fonte vinculada.
```

Exit 0. A segunda linha declara o tema `mira-dark`.

## Marcadores no deck que ele gerou

```
@MIRA:THEME:START          0
0
@MIRA:RESPONSIVE:START     1
@MIRA:FAST:SLIDES:START    0
0
```

Leitura das três linhas:

- `@MIRA:THEME` = 0: o `.replace()` de `new.js:110` não casou. **Nenhum tema aplicado.**
- `@MIRA:RESPONSIVE` = 1: `ensureResponsive()` inseriu sozinho. Prova que o template não
  precisa trazer esse bloco, e que o padrão de inserção já existe no mesmo fluxo.
- slots `@MIRA:FAST` = 0: são da Fase 1, conforme `agents/mira-fast/SKILL.md:132`.

## O tema realmente não entrou

```
$ grep -c 'mira-dark' /tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/oi56/decks/teste-studio/index.html
0
0
```

## Levantamento dos oito templates

Com marcador `@MIRA:THEME` (o `--theme` funciona):

```
  templates/decks/aula-capitulo/index.html
  templates/decks/demo-tecnica/index.html
  templates/decks/mira-default/index.html
  templates/decks/pitch-projeto/index.html
  templates/decks/sandeco-just-animation-template/index.html
```

Sem marcador (o `--theme` é ignorado em silêncio):

```
  templates/decks/mesa-tatica/index.html
  templates/decks/mira-studio-demo/index.html
  templates/decks/mira-studio-full-demo/index-16x9.html
```

## O padrão correto, no mesmo arquivo

`lib/utils/responsive.js:33-55`, `ensureResponsive`: se o bloco existe, atualiza; se não
existe, **insere**; e devolve `{ changed, action }` com `inserted | updated | noop`.
O `new.js` chama essa função dez linhas depois do `replace` que falha calado.
