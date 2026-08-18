<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-18T15:11:00Z a partir de 4 bugs -->

# Índice de bugs · sincronia-temporal-slides

Contexto: o eixo do tempo dos decks. Quando a animação de um slide começa, o que o espectador
vê no primeiro quadro, e como um slide passa para o outro sem vazar frame. Closure policy:
`package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 4 |
| active | 0 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| triaging | 4 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| **21** | [**S5CT**](../bugs/BUG-20260818-S5CT-corte-seco-por-scrollto-nao-reproduzido/bug.md) | P1 | high | **open** · triaging | **glitch de um quadro ao passar o slide num deck sequencial** | não |
| **20** | [**R7MC**](../bugs/BUG-20260818-R7MC-remoto-navega-sempre-suave/bug.md) | P2 | high | **open** · triaging | **o remoto navega sempre suave, sem corte seco** | não |
| **19** | [**T3RG**](../bugs/BUG-20260818-T3RG-timers-orfaos-em-templates-oficiais/bug.md) | P2 | medium | **open** · triaging | **timers órfãos em quatro templates oficiais** | não |
| **22** | [**V4LD**](../bugs/BUG-20260818-V4LD-validador-sem-item-de-tempo/bug.md) | P3 | low | **open** · triaging | **validador sem nenhum item de tempo** | não |

O **#21 é o sintoma que o autor de fato vê**: seta para baixo, um quadro adiantado pisca, a
cena volta para o começo. Os outros três saíram da varredura de código.

## Sessão de 2026-08-18: um sintoma real chegou junto com uma proposta pronta

Os quatro bugs vieram de um documento normativo que o autor colou no `/reversa-debugger`,
copiado verbatim em
[`intake/spec-sincronia-determinista-proposta.md`](../intake/spec-sincronia-determinista-proposta.md).
O documento propõe cinco regras. A varredura de código
([`intake/relato-20260818-1211.md`](../intake/relato-20260818-1211.md)) mostrou que **quatro
das cinco já existem** no projeto, escritas como código de referência no `mira-default` e
como regra na `/mira-sequence`:

| Regra proposta | Situação real |
|---|---|
| 1. Regente de tempo | existe no `mira-default:288-308`; **falta em 4 templates** → #19 |
| 2. Corte seco no par sequencial | existe na `/mira-sequence:134`; **falta no caminho do celular** → #20 |
| 2b. Trocar `scrollIntoView` por `scrollTo` | remédio proposto para o glitch do #21. Pode estar certo pelo motivo errado: ver o suspeito principal, `scroll-snap` |
| 3. Guarda `ms > 0` | já é regra, com o motivo escrito (`/mira-sequence:75-78`) |
| 4. Portão do frame zero | já é regra (`/mira-sequence:103-104`) |
| 5. Plano B da continuação | já é obrigatório, com o nome `poseEntrega(F)` (`/mira-sequence:114`) |
| 5b. Checklist no `/mira-validator` | **não existe nenhum item de tempo** → #22 |

A leitura honesta: o Mira já tem a doutrina de sincronia temporal. O que falta é **alcance**
(templates antigos que nunca foram revisitados, e o caminho do celular que ninguém patcheia)
e **verificação** (nada checa isso automaticamente).

O documento chegou como solução pronta, sem o sintoma. O sintoma (#21) veio depois, na
conversa. A ordem importa: quem lê só o documento acusa o `scrollIntoView`, e o suspeito
principal é o `scroll-snap-type: y proximity` reajustando a posição depois do salto. O remédio
proposto pode funcionar sem que a explicação dele esteja certa, e é isso que o fix precisa
separar.

## O bug que não foi registrado

`templates/decks/mira-default/index.html:559` navega sempre com `scrollIntoView('smooth')` e
não conhece `data-mira-seq`. Não virou bug: todo caminho interno do deck passa por esse `ir()`
único, o template não tem `#mira-next` nem `#mira-progress`, e a `/mira-sequence` patcheia
esse ponto quando o deck vira sequencial. É desenho, não divergência. Se o autor quiser o
corte seco de fábrica no template padrão, isso é pedido de feature.

## Relação com outros contextos

Dois arquivos citados aqui (`mira-studio-demo`, `mira-studio-full-demo`) também aparecem em
bugs do contexto `templates-studio`. A separação é deliberada: lá o assunto é o formato
Studio (builder, teleprompter, gravador); aqui é a regra de tempo, que vale para qualquer
deck. Quem for corrigir o #19 confere o estado de BUG-20260731-JZNJ e BUG-20260731-S3TX antes
de tocar nesses arquivos.
