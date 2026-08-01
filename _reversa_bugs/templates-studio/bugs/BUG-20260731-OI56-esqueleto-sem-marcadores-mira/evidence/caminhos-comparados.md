# Os quatro caminhos, medidos

Repositório `/workspaces/.mira`, commit base `558a406`, 2026-08-01, Node v24.15.0.

Script: [`comparar-caminhos.mjs`](comparar-caminhos.mjs). Ele remove as `<section>` de exemplo
e abre os seis slots em cada candidato, que é exatamente o que
`agents/mira-fast/SKILL.md:132` manda a Fase 1 fazer, e depois aplica as mesmas checagens
de bloco que `validateSkeleton` aplica.

## Saída

```

[template CRU (o que a Fase 1 usa hoje)]
  REPROVA: bloco @MIRA:THEME, bloco @MIRA:RESPONSIVE

[deck do CLI canonico (npx mira-animator new)]
  REPROVA: bloco @MIRA:THEME

[mira-default CRU (formato mira, SKILL.md:132)]
  REPROVA: bloco @MIRA:RESPONSIVE
```

## O quarto caminho, o que passa

```bash
node bin/mira.js new teste-mira --deck=mira-default --theme=mira-dark
```

```
@MIRA:THEME:START          1
@MIRA:RESPONSIVE:START     1
```

Os dois blocos presentes. Este é o único dos quatro caminhos que produz esqueleto válido.

## Tabela

| caminho | @MIRA:THEME | @MIRA:RESPONSIVE | validateSkeleton |
|---|---|---|---|
| `mira-studio-demo` cru | ausente | ausente | reprova |
| `mira-studio-demo` via CLI | ausente | presente | reprova, só pelo BUG-20260801-VPUH |
| `mira-default` cru | presente | ausente | **reprova** |
| `mira-default` via CLI | presente | presente | **passa** |

A terceira linha é a que amplia o bug: `mira-default` cru é literalmente o que
`agents/mira-fast/SKILL.md:132` manda usar no formato `mira`. O formato mais usado do
Mira também nasce com esqueleto reprovado.

## Por que ninguém tinha visto

`test/mira-fast-assemble.test.mjs:100-128` constrói o esqueleto à mão, já com
`@MIRA:THEME`, `@MIRA:RESPONSIVE`, os seis slots e o balanceamento da capa. Nenhum teste
alimenta o pipeline com template real, nos quatro formatos. É o achado F-test-01 do
pente-fino de 2026-07-31, e é o que o critério de aceite 4 deste bug exige fechar.

---

## Depois da correção (2026-08-01)

O mesmo script, agora autocontido (cria a própria instalação temporária e roda o CLI real):

```
template Studio CRU (cópia manual)     REPROVA: esqueleto sem bloco @MIRA:RESPONSIVE
Studio via CLI canônico                PASSA
mira-default CRU (cópia manual)        REPROVA: esqueleto sem bloco @MIRA:RESPONSIVE
mira-default via CLI canônico          PASSA
```

Os dois caminhos canônicos passam. A cópia manual continuar reprovando **é o desenho**: é
exatamente a razão de a `agents/mira-fast/SKILL.md` ter passado a mandar usar o CLI, e a
skill agora diz explicitamente que quem copiar à mão precisa injetar os dois blocos.

O que mudou em cada linha:

| caminho | antes | depois |
|---|---|---|
| Studio CRU | THEME + RESPONSIVE | só RESPONSIVE (o THEME foi corrigido pelo VPUH) |
| Studio via CLI | THEME | **passa** |
| `mira-default` CRU | RESPONSIVE | RESPONSIVE (inalterado, e correto) |
| `mira-default` via CLI | passa | passa |
