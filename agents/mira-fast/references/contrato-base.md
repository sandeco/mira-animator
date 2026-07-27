# Contrato base da folha

Receba campos globais e um único objeto `slide`. Escreva exatamente `<deck_dir>/mira/fast/slide-NN.html` e o status exclusivo `<deck_dir>/mira/fast/result-NN.json`.

Não leia plano completo, HTML final, outras folhas ou outras skills. Não crie assets, módulos, roteiro ou arquivos compartilhados. Na segunda tentativa, leia somente seu próprio fragmento anterior.

## Envelope obrigatório

Use estes marcadores uma vez e nesta ordem:

```html
<!-- @MIRA:FAST slide=NN stage=SLUG kind=static|animated -->
<section>...</section>
<!-- @MIRA:FAST css -->
<style>...</style>
<!-- @MIRA:FAST js -->
<script>...</script>
```

Regras comuns:

- Produza uma única `<section>` balanceada.
- Faça `slide`, `stage` e `kind` coincidirem com o plano.
- Use UTF-8 direto e não use travessão em texto visível.
- Não adicione `<script src>`, módulos de autoria, bibliotecas ou navegação.
- Não altere paleta, tom, título, ids ou layout recebidos.
- CSS e JS devem ser escopados pelo `slug_stage`.
- Os marcadores CSS e JS permanecem mesmo quando os blocos estão vazios.

Depois de gravar, rode:

```text
node .claude/skills/mira-fast/scripts/validate-run.mjs "<deck_dir>" --slide N
```

Após validar, grave `result-NN.json` com `n`, `ok`, `validation` e `attempts`. Só retorne `ok: true` após exit code 0.
