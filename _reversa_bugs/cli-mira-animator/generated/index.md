<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T01:30:00Z a partir de 1 bug -->

# Índice de bugs · cli-mira-animator

Contexto: o CLI `npx mira-animator`, arquivo dono `lib/commands/`. Nasceu em 2026-08-01,
durante o diagnóstico do BUG-20260731-OI56, quando ficou claro que o defeito do `--theme`
atinge qualquer usuário do CLI, com ou sem `/mira-fast` no meio.

Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 0 |
| active | 1 |
| resolved | 0 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título |
|---|---|---|---|---|---|
| 12 | [VPUH](../bugs/BUG-20260801-VPUH-theme-ignorado-em-silencio/bug.md) | P2 | medium | **active** · delivering | `npx mira-animator new` ignora `--theme` em silêncio quando o template não traz o marcador |

## Corrigido, aguardando entrega

Código corrigido em 2026-08-01, testes verdes, veredito de spec aprovado. **Falta merge e
versão publicada**; a closure policy `package` não permite fechar antes disso, e o bug não
recebe `DONE.md` até lá.

| # | ID | resolution_kind | causa raiz | veredito | adendo |
|---|---|---|---|---|---|
| 12 | VPUH | `fixed` | confirmed | `spec-gap` | [bug-BUG-20260801-VPUH-v001.md](../../../_reversa_sdd/addenda/bug-BUG-20260801-VPUH-v001.md) |

Arquivos tocados: `lib/commands/new.js` e três templates de deck
(`mira-studio-demo`, `mira-studio-full-demo`, `mesa-tatica`), estes últimos só com
comentários delimitadores. Nenhuma linha de CSS efetivo mudou.

## Resolvidos

Nenhum. Nenhuma pasta tem `DONE.md`.

## Restritos

Nenhum bug com `visibility: restricted`.

## Inconsistências

Nenhuma. Validação global sobre os 12 bugs dos três contextos passou.

## Relação com os outros contextos

O VPUH é a metade que faltava do BUG-20260731-OI56 (`templates-studio`): mesmo pelo caminho
canônico, o esqueleto Studio continuava reprovando por falta do bloco `@MIRA:THEME`. Os dois
foram corrigidos na mesma sessão, e a aresta canônica `caused-by` está gravada no OI56.

## Observação de classificação

`taxonomy.yaml` está vazio. Proposta nas Agent Notes: `area: cli`,
`module: mira-animator`, `feature: criacao-de-deck`.
