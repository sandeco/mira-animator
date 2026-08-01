# Cápsula de reprodução

O harness é compartilhado com o BUG-20260731-K4NR, porque um único deck reproduz os dois
defeitos. O script vive em:

`../../BUG-20260731-K4NR-validador-section-em-comentario/evidence/reproduce.mjs`

A cápsula completa, com ambiente, comando, saída e classificação, está em
[`reproduction.md`](reproduction.md) ao lado deste arquivo.

## O que este bug reproduz especificamente

O segundo caso do harness: a folha 2 recebe no bloco `js` o comentário
`// o palco vive dentro da <section> deste slide`.

```
[BUG-20260731-BNO4] comentário no JS da folha citando <section>, com a folha aprovada pelo validador
  taxa: 3/3
  validate-run --slide 2 aprovou a folha? true []
  montagem: FAIL :: saída possui 3 section(s), esperado 2
```

As duas metades do defeito aparecem na mesma linha de saída: o validador que a folha é
obrigada a rodar aprova com zero erros, e a montagem morre depois contando 3 onde o plano
declara 2.
