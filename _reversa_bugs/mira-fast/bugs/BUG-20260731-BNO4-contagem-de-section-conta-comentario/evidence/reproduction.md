# Cápsula de reprodução

Vale para BUG-20260731-K4NR e BUG-20260731-BNO4, reproduzidos pelo mesmo harness.

## Ambiente

| item | valor |
|---|---|
| commit base | `558a406f3588453108b71147d1775587521b05cf` |
| branch | `agent/documentacao-completa-mira` |
| runtime | Node v24.15.0 |
| OS | Linux 5.15.167.4-microsoft-standard-WSL2 |
| data | 2026-07-31 |

Árvore de trabalho com modificações não commitadas em `agents/`, `lib/` e `package.json`,
nenhuma delas nos arquivos deste bug. `agents/mira-fast/scripts/` está limpo em relação ao
commit base.

## Comando

```bash
node _reversa_bugs/mira-fast/bugs/BUG-20260731-K4NR-validador-section-em-comentario/evidence/reproduce.mjs
```

Exit code **0** = os dois defeitos reproduziram. Depois da correção o mesmo comando deve sair
com **1**, porque o defeito deixa de aparecer. O script é hermético: monta um deck mínimo num
diretório temporário e não depende de nenhum template do repositório.

## Saída

```
[BUG-20260731-K4NR] comentário do esqueleto citando <section>, fora do slot de slides
  taxa: 3/3
  validate-run --slide 2 aprovou a folha? true []
  montagem: FAIL :: esqueleto contém <section> fora do slot de slides

[BUG-20260731-BNO4] comentário no JS da folha citando <section>, com a folha aprovada pelo validador
  taxa: 3/3
  validate-run --slide 2 aprovou a folha? true []
  montagem: FAIL :: saída possui 3 section(s), esperado 2

[controle] sem nenhuma menção a <section> em comentário: tem que montar
  taxa: 3/3
  validate-run --slide 2 aprovou a folha? true []
  montagem: PASS

resultado: os dois defeitos REPRODUZIRAM
```

## Classificação

`deterministic`, taxa 3/3 nos dois casos. Sem gatilho de ambiente, sem concorrência, sem
dependência de relógio ou de rede.

## O caso de controle é parte da cápsula

O terceiro caso usa exatamente o mesmo deck com os mesmos comentários, trocando só
`<section>` por `secoes` e `secao`. Ele monta com sucesso. Isso isola a variável: o que
derruba a montagem é a sequência de caracteres `<section` no texto, não a estrutura do deck,
não o plano e não os fragmentos.

## Observação sobre o formato usado

A cápsula usa `mira-vertical`, não `mira-studio`. De propósito: o defeito não é dos formatos
Studio, é do validador e da contagem, que valem para os quatro formatos. Reproduzir no
formato mais simples prova que o escopo é maior do que o relato original sugeria.
