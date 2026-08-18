---
schema_version: 1
id: BUG-20260818-R7MC
display_number: 20
title: O controle remoto tem navegação própria com rolagem suave fixa, então avançar pelo celular vaza os frames do slide de baixo mesmo num deck com corte seco aplicado
status: open
phase: triaging
severity: high
priority: P2
created: 2026-08-18
updated: 2026-08-18

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-gap
  - sincronia-temporal
  - remote-control

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "não medido em dois aparelhos; divergência confirmada por leitura de código"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260818-S5CT
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "agents/mira-sequence/SKILL.md#L120"
    - "agents/mira-sequence/SKILL.md#L134"
    - "agents/mira-sequence/SKILL.md#L179"
  affected_code:
    - "templates/remote/mira-remote.html:185-197"
    - "templates/remote/mira-remote.html:189"
    - "templates/remote/mira-remote.html:195"
    - "examples/34-mira-remote-control/deck/mira/mira-remote.html"
  root_cause: null
  reproduction_tests: []
  regression_tests: []

spec_verdict: null

change_set: []

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# O controle remoto tem navegação própria com rolagem suave fixa, então avançar pelo celular vaza os frames do slide de baixo mesmo num deck com corte seco aplicado

## Summary

A skill `/mira-sequence` avisa, com todas as letras, que um deck tem mais de um caminho de
navegação e que patchear só o teclado deixa o defeito para a hora da palestra
(`agents/mira-sequence/SKILL.md:120`, que cita nominalmente o `/mira-remote-control`).

O aviso está certo e o próprio Mira cai nele: o `goTo()` do remoto vive em
`templates/remote/mira-remote.html`, é um arquivo de template que a skill nunca abre, e tem
`behavior: 'smooth'` escrito na mão, sem olhar `data-mira-seq`.

Resultado: o autor aplica `/mira-sequence`, testa no notebook com a seta, vê o corte seco
funcionando, apresenta com o celular na mão e a continuidade quebra na frente da plateia.

## Expected Behavior

**Não há spec formal.** `spec-gap`. O contrato de fato é a própria skill:

- `agents/mira-sequence/SKILL.md:120`: "Procure por `scrollIntoView`, não por `function ir`.
  Cada template chama a passagem de slide de um jeito, e um deck real costuma ter mais de um
  caminho: o teclado, o botão flutuante `#mira-next`, a barra `#mira-progress`, o
  `/mira-remote-control` mandando do celular. Patch aplicado só no teclado deixa o botão
  rolando suave, e o defeito só aparece na hora da palestra."
- `agents/mira-sequence/SKILL.md:134`, a forma correta:
  `secs[i].scrollIntoView({ behavior: seco ? 'instant' : 'smooth', block: 'start' });`
- `agents/mira-sequence/SKILL.md:179`, passo 8: aplicar o corte seco em todo caminho de
  navegação.

Esperado: ao avançar de um slide `data-mira-seq` para o seu par `data-mira-seq-de`, **todo**
caminho de navegação corta seco, inclusive o comando vindo do celular.

## Actual Behavior

`templates/remote/mira-remote.html:185-197`:

```javascript
function goTo(i) {
    var secs = sections();
    if (!secs.length) return;
    var idx = Math.max(0, Math.min(secs.length - 1, i));
    secs[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Em celular a primeira rolagem suave às vezes não anda (o deck
    // fica no slide antigo e o eco do servidor não corrige, porque
    // lastSlide já aponta para o alvo). Confere e força se preciso.
    setTimeout(function () {
        if (getIdx() !== idx) {
            try { win().scrollTo(0, secs[idx].offsetTop); } catch (e) { }
        }
    }, 700);
}
```

Três fatos:

1. `'smooth'` é literal. Não existe caminho para corte seco aqui, nem quando o deck é
   sequencial.
2. Este código está num arquivo de template do remoto, **não** no `index.html` do deck. A
   `/mira-sequence` patcheia o deck; este arquivo passa intocado.
3. Existe um `scrollTo(0, offsetTop)` de resgate na linha 195, para o caso da rolagem suave
   não andar no celular. Ou seja, o padrão que o autor propõe na regra 2 já está no arquivo,
   como remendo de outro problema.

O `sections()` acima usa `.fullscreen-wrapper` quando há dois ou mais, e cai em
`body > section` senão. O `getIdx()` compara com `offsetTop`. Isso importa para a correção,
ver Agent Notes.

## Steps to Reproduce

Precisa de dois aparelhos na mesma rede.

1. Pegar um deck com um par `@MIRA:SEQ` aplicado pela `/mira-sequence`, com o corte seco já
   funcionando no teclado.
2. Subir o `/mira-remote-control` e parear o celular.
3. No notebook, avançar do slide de origem para o de continuação com a seta: corte seco, o
   objeto continua de onde estava.
4. Voltar e repetir o mesmo avanço **pelo botão do celular**.

Esperado: idêntico ao passo 3.
Observado (a confirmar em bancada): rolagem suave, os frames em movimento do slide de baixo
aparecem durante a transição, e o objeto da continuação nasce fora do lugar porque a pose
gravada envelheceu durante a rolagem.

## Evidence

- [`../../intake/relato-20260818-1211.md`](../../intake/relato-20260818-1211.md), linha da
  tabela "Corte seco (caminho do celular)".
- `agents/mira-sequence/SKILL.md:120`, o aviso que este bug confirma.

Sem captura de tela: o bug foi estabelecido por leitura de código. A reprodução em dois
aparelhos é o primeiro passo do fix, e é o mesmo bloqueio que já aparece no
`forward_progress` do projeto (item 7 do checklist de regressão, sincronia palco-controle).

## Suspected Area

`templates/remote/mira-remote.html`, função `goTo()`. É o único ponto do remoto que rola o
palco. O `mira-remote-server.cjs` só carrega estado (`{slide, reveal}`) e não toca em scroll.

Atenção: `examples/34-mira-remote-control/deck/mira/mira-remote.html` e
`tests/MIRA-STUDIO-FULL/mira/` carregam cópias do mesmo arquivo. Corrigir só o template
deixa as cópias para trás.

## Acceptance Criteria

1. `goTo()` corta seco quando o alvo é o par `data-mira-seq-de` da origem, e continua suave
   no resto. A decisão é do mesmo tipo que a do deck, então a lógica tem que dar a mesma
   resposta que a do `ir()` patcheado.
2. Verificado em dois aparelhos: avançar pelo celular num par `@MIRA:SEQ` dá o mesmo
   resultado visual que avançar pela seta.
3. O remendo do `setTimeout` de 700 ms continua funcionando para o caso suave (celular que
   não anda na primeira rolagem), sem disparar depois de um corte seco.
4. `/mira-sequence` passa a listar `templates/remote/mira-remote.html` entre os caminhos a
   conferir, ou o corte seco deixa de depender de patch e passa a ser do módulo.
5. As cópias em `examples/` e `tests/` ficam coerentes com o template.

## Traceability

- **Spec:** `agents/mira-sequence/SKILL.md#L120`, `#L134`, `#L179`. Não é spec em
  `_reversa_sdd/`, por isso `spec-gap`.
- **Código afetado:** front matter.
- **Causa raiz:** não investigada. A hipótese é de fronteira: a `/mira-sequence` opera sobre
  o `index.html` do deck e o remoto é um módulo instalado, então ninguém é dono da regra nos
  dois lados.
- **Testes:** nenhum. O caminho do remoto não tem teste automatizado neste projeto.

## Agent Notes

- **Não troque `scrollIntoView` por `scrollTo({top: offsetTop})` aqui sem pensar.**
  `offsetTop` é relativo ao `offsetParent`, e este arquivo trabalha com
  `.fullscreen-wrapper`, que nos formatos Studio pode ser posicionado. O `getIdx()` da linha
  177 já vive com essa limitação; ampliar o uso do `offsetTop` amplia o risco. O ponto deste
  bug é o `'smooth'` fixo, não o `scrollIntoView`. A troca de API está em BUG-20260818-S5CT e
  ainda não foi reproduzida.
- Este bug é do contexto `sincronia-temporal-slides` e não de `templates-studio`, mesmo
  tocando num arquivo de template, porque o defeito é da regra de passagem de slide, não do
  formato Studio.
- **Proposta de taxonomia:** `area: apresentacao`, `module: remote-control`,
  `feature: passagem-de-slide`.
