# Formato Mira Studio Full 16:9

Todo slide exige `layout: camera | thirds | full` e `fala`. `camera` é estático com `.cam-area`; animados usam `thirds` ou `full`. Preserve câmera, teleprompter, gravação e builder do roteiro. A saída é `index-16x9.html` e gera `roteiro.md`.

Estrutura cobrada pelo validador:

- `thirds`: `.thirds-main` + `.cam-area`.
- `full`: `.full-main`, sem `.cam-area`.
- Palco animado: `<div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" ...></svg></div>`. A classe e os dois ids são obrigatórios.
