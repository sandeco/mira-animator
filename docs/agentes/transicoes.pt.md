# Transições

Efeitos de transição entre slides.

## `/mira-transition-dissolve`
Aplica uma transição **dissolve** (crossfade real, estilo Canva/Keynote) à navegação entre slides usando a View Transitions API (same-document), que funciona em `file://` sem servidor. Escreve `index-dissolve.html` ao lado do original. Navegadores sem a API navegam normalmente.

## `/mira-sequence`
O caso oposto: **transição nenhuma**. Cria o slide seguinte já na pose exata em que o anterior estava, e a passagem entre os dois é um corte seco, então o par lê como um slide só cuja animação muda de comportamento no meio. Loop perpétuo não tem último quadro, então o slide de origem publica a pose viva dos atores e a continuação trava essa pose no instante em que entra: entregando com a bola no ar, ela continua do ar. Na volta, a continuação retrocede brevemente e devolve a origem ao repouso gravado, sem reiniciar a história. Uma pose de repouso declarada é o plano B obrigatório, o que faz o slide funcionar sozinho no `mira-slide-to-video` e para quem abrir o deck direto nele. A transição global do deck não é tocada, o corte seco é daquele par e de mais nada.

## `/mira-sequence-director`
O orquestrador acima do `/mira-sequence`. Você descreve o que quer explicar e ele transforma isso num **plano-sequência**: uma cena que se transforma do começo ao fim, cortada em slides que a plateia lê como uma animação única. Antes de tudo aplica um teste de forma com poder de recusa, porque explicação que troca de mundo, de escala ou de sujeito no meio não é plano-sequência, e forçar uma fica pior que slides comuns. Aprovado, escreve um **roteiro de continuidade** em `references/sequence-director-<id>.md` na pasta do deck, declarando por cena o id do par, quem atravessa o corte (e portanto entra sem coreografia nenhuma), quem entra, quem sai, a ação, a pose de repouso em forma de expressão, e o que muda na cena seguinte, que é literalmente a única entrada que o `/mira-sequence` não consegue deduzir sozinho. Depois constrói a corrente **em série**: a cena 1 pelo `/mira-animator` e cada elo seguinte pelo `/mira-sequence`, cada um escrito depois de ler o código do anterior. Serial não é preferência: o plano B do elo N+1 precisa carregar a mesma expressão do repouso do elo N, que é dependência de código-fonte, então fan-out paralelo não se aplica.
