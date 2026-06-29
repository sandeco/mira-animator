# Erros do Codex ao carregar skills do Mira

## Resumo

O Codex ignorou 8 skills porque o frontmatter YAML dos respectivos arquivos `SKILL.md` é inválido.

O aviso fornecido lista somente 7 caminhos, embora informe 8 skills ignoradas. A validação de todos os arquivos com PyYAML confirmou que o oitavo arquivo é:

```text
C:\slides\.agents\skills\mira-3d\SKILL.md
```

## Causa do erro

Todos os 8 arquivos têm uma descrição longa escrita como um valor YAML simples, sem aspas e na mesma linha:

```yaml
description: texto longo com uma expressão: continuação do texto
```

Em YAML, a sequência `: `, dois-pontos seguidos por espaço, não pode aparecer livremente dentro desse tipo de valor. O parser entende que os dois-pontos iniciam um novo par `chave: valor`. Como isso ocorre dentro do valor de `description`, a estrutura se torna ambígua e o carregamento falha com:

```text
mapping values are not allowed in this context
```

O número da linha aparece como linha 2 porque o carregador analisa apenas o conteúdo entre os delimitadores `---`. No arquivo físico, a descrição está na linha 3.

## Arquivos afetados e primeiro ponto inválido

| Skill | Coluna indicada | Trecho que provoca a falha |
|---|---:|---|
| `mira-3d` | 549 | `obrigatório: o 3D sempre gira` |
| `mira-image` | 457 | `mira-qrcode: só o título` |
| `mira-qrcode` | 319 | `apresentação: o slide funciona` |
| `mira-squared` | 301 | `arquivo original: cria um novo arquivo` |
| `mira-svg-animator` | 212 | `movimento em palavras: bater asas` |
| `mira-svg-morph` | 276 | `ordem do morph: 2 SVGs fazem` |
| `mira-thirds` | 397 | `arquivo original: cria um novo arquivo` |
| `mira-vertical` | 75 | `tela atual: largura da tela` |

As colunas correspondem ao caractere `:` que inicia a sequência inválida.

## Avisos recebidos

```text
⚠ Skipped loading 8 skill(s) due to invalid SKILL.md files.

⚠ C:\slides\.agents\skills\mira-image\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 457

⚠ C:\slides\.agents\skills\mira-qrcode\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 319

⚠ C:\slides\.agents\skills\mira-squared\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 301

⚠ C:\slides\.agents\skills\mira-svg-animator\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 212

⚠ C:\slides\.agents\skills\mira-svg-morph\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 276

⚠ C:\slides\.agents\skills\mira-thirds\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 397

⚠ C:\slides\.agents\skills\mira-vertical\SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 75
```

## Correção recomendada

Converta o campo `description` de cada arquivo para um bloco YAML dobrado. Essa forma aceita dois-pontos, aspas e textos longos sem exigir escapes:

```yaml
---
name: mira-exemplo
description: >-
  Primeira parte da descrição. Um trecho com dois-pontos: esta continuação
  permanece válida. As linhas podem ser quebradas para facilitar a manutenção.
---
```

O indicador `>-` combina as linhas em um único texto e remove a quebra de linha final. Ele é apropriado para a descrição de uma skill.

Também seria possível colocar toda a descrição entre aspas, mas isso exige escapar as várias aspas internas já presentes nos textos. O bloco `>-` é mais seguro e mais legível.

## Procedimento de correção

Para cada um dos 8 arquivos:

1. Preserve o delimitador inicial `---`.
2. Preserve o campo `name`.
3. Troque `description: texto...` por `description: >-`.
4. Mova a descrição para as linhas seguintes.
5. Indente todas as linhas da descrição com dois espaços.
6. Preserve o delimitador final `---`.
7. Reinicie ou recarregue o Codex depois de validar todos os arquivos.

## Validação

Após a correção, execute um parser YAML sobre o frontmatter de todos os arquivos. A validação deve terminar sem exceções e sem listar arquivos inválidos.

Também verifique se cada frontmatter contém:

```yaml
name: nome-da-skill
description: >-
  Descrição da skill.
```

## Observação

Este diagnóstico não indica defeito no conteúdo funcional das skills. O problema ocorre antes da execução, durante a leitura dos metadados YAML. Enquanto o frontmatter continuar inválido, o Codex ignora completamente essas skills.
