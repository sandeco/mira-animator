# Transições

Efeitos de transição entre slides.

## `/mira-transition-dissolve`
Aplica uma transição **dissolve** (crossfade real, estilo Canva/Keynote) à navegação entre slides usando a View Transitions API (same-document), que funciona em `file://` sem servidor. Escreve `index-dissolve.html` ao lado do original. Navegadores sem a API navegam normalmente.

## `/mira-sequence`
O caso oposto: **transição nenhuma**. Cria o slide seguinte já na pose exata em que o anterior estava, e a passagem entre os dois é um corte seco, então o par lê como um slide só cuja animação muda de comportamento no meio. Loop perpétuo não tem último quadro, então o slide de origem publica a pose viva dos atores e a continuação trava essa pose no instante em que entra: entregando com a bola no ar, ela continua do ar. Uma pose de repouso declarada é o plano B obrigatório, o que faz o slide funcionar sozinho no `mira-slide-to-video` e para quem abrir o deck direto nele. A transição global do deck não é tocada, o corte seco é daquele par e de mais nada.
