# Folha estática

Aplique quando `modo_folha` for `estatica`: capa, card, CTA, encerramento ou layout `camera`.

- Use `kind=static`.
- Implemente somente conteúdo e layout do plano.
- Não invente metáfora, palco D3, `@MIRA:SIZE`, generation counter ou função `animate*`.
- Deixe `<script></script>` vazio.
- Use CSS local apenas quando o formato exigir.
- Layout `camera` não exige título e contém somente a estrutura de câmera definida no contrato do formato.
- Capa preserva título e subtítulo; a montagem aplica `text-wrap: balance`.

Tipos:

- `capa`: título e subtítulo do plano.
- `card`: informação estática curta, sem animação disfarçada.
- `cta`: uma ação clara.
- `encerramento`: síntese ou frase final.
- `camera`: nenhuma informação sobreposta à câmera.
