<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T22:40:00Z a partir de 4 bugs -->

# Matriz BUG ↔ SPEC · templates-studio

Spec efetiva = original + adendos vigentes. Não há adendos: `_reversa_sdd/addenda/` não
existe.

| seção de spec | open | active | resolved |
|---|---|---|---|
| `mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` | OI56 | — | — |
| `mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato` | S3TX, RNYU | — | — |
| `mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` | JZNJ, S3TX | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10` | JZNJ, S3TX | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r5-titulo-da-capa-rf12-diretiva-do-claudemd` | OI56 | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17` | S3TX, RNYU | — | — |
| `MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md#4-texto-por-slide--navegação` | RNYU | — | — |
| **spec-gap** | OI56 | — | — |

## Leitura

**As duas metades do mesmo contrato andam juntas.**
`04-fase-2-enxame.md#r6` (o palco tem id `<slug_stage>-stage`) e
`05-fase-3-montagem.md#r3` (a animação é registrada contra esse id) levam os mesmos dois
bugs, JZNJ e S3TX. É o esperado: quem viola uma viola a outra, porque são as duas pontas de
um único contrato.

**O conflito de spec continua sendo o mais importante desta matriz.**
`05-fase-3-montagem.md#r7` declara o `roteiro.md` "a fonte da verdade daquele formato". Os
templates levam a frase ao pé da letra: o 9:16 reconstrói os slides a partir dele, o 16:9
apaga tudo e recria. A spec não diz até onde vai essa autoridade, se governa texto, layout e
título, ou também a existência dos slides e das animações. Sem esse veredito, S3TX e JZNJ
não têm correção defensável.

**O RNYU mostra a mesma seção pelo lado que faltava.** R7 e `03#R9` garantem que a fala de
cada slide existe no plano e vai para o `roteiro.md`. Nenhuma seção diz o que acontece com
essa fala quando o deck é aberto sem servidor, que é justamente quando o `roteiro.md` não é
lido. A `MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md` seção 4 define o texto por slide como
conteúdo do deck, mas foi escrita para o template, antes do `/mira-fast` existir.

**Lacuna declarada.** O OI56 carrega `spec-gap`: nenhuma seção define quem cria os blocos
`@MIRA:THEME` e `@MIRA:RESPONSIVE`, o template ou a Fase 1. O `mira-default` também não os
cumpre por inteiro, o que mostra que a lacuna é da especificação, não de um arquivo
esquecido.

## Adendos

Nenhum adendo de bug vigente. `_reversa_sdd/addenda/` será criada pelo
`/reversa-debugger-fix` se algum veredito de spec exigir mudança. Pelo menos três vereditos
já estão pendentes: autoridade do `roteiro.md` (S3TX, JZNJ), dono dos marcadores de esqueleto
(OI56) e caminho das falas em `file://` (RNYU).
