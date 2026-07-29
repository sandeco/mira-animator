# Agentes core

O coração da criação de decks. Veja como eles se conectam no [Pipeline de agentes](../pipeline.md).

## `/mira-new`
A porta de entrada de um novo deck. Pergunta só o nome do tema e **cria a estrutura de `decks/<tema>/` na hora, com a `references/` pronta**, para você já poder soltar o PDF, o documento ou os prints antes de decidir mais nada. Aí ele para e pergunta se você prefere descrever a apresentação por texto ou colocar os arquivos na pasta. Só depois coleta o resto de forma conversacional (template do deck, tema base, cor principal) e monta o deck para o pipeline preencher. **Não** gera slides: prepara o terreno e, ao final, oferece acionar o pipeline.

## `/mira-fast`
O deck inteiro numa única chamada. Onde o `/mira-new` abre a cadeia normal com pausas, o `/mira-fast` planeja o deck e dispara **uma folha por slide em paralelo**, montando o arquivo final de forma determinística. Ele não faz perguntas: nem conteúdo, nem formato, nem tema, nem continuidade. A qualidade é equivalente à da cadeia normal, sem os gates humanos no meio.

```text
/mira-fast <tema ou caminho>                    -> 16:9 padrão
/mira-fast /mira-studio <tema ou caminho>       -> Studio 9:16
/mira-fast /mira-studio-full <tema ou caminho>  -> Studio Full 16:9
/mira-fast /mira-vertical <tema ou caminho>     -> vertical 9:16
```

Antes de planejar qualquer coisa, ele cria a estrutura de `decks/<tema>/` com a `references/` e mostra o caminho completo dela, então material colocado ali já entra no plano. Ele **nunca infere o formato** pelo tema, e uma fonte apontada que não existe no disco **falha na hora**, informando a pasta de referências, em vez de inventar um deck a partir do nada. Um caminho digitado errado não vira uma apresentação inteira imaginada.

Requer o Claude Code 2.1.154 ou superior com **Dynamic workflows** habilitado em `/config`. Para um slide avulso, use o `/mira-animator`.

## `/mira-references`
Cria e organiza a pasta de referências por tema, `references/`, dentro do tema do deck, e inclui automaticamente o material que já estiver lá. É a forma de informar a fonte de conteúdo de uma apresentação específica — sempre por tema, local ao tema. Use antes de criar um slide quando o tema ainda não tiver pasta de referências.

## `/mira-animator`
O coração do Mira, o **M** de Metáforas Inteligentes Responsivas Animadas. A partir do conceito do slide, destila a dinâmica, inventa uma **analogia concreta do cotidiano** e a anima com **loop interno obrigatório**. Duas regras-mãe vivem aqui: *nenhuma animação é literal, toda animação é metáfora*, e *nenhuma animação é estática, toda animação entra com coreografia e depois continua em loop interno.* Trabalha em dois modos, **criar** um slide animado novo e **substituir** a animação de um slide existente no lugar, mantendo título, subtítulo e pílulas (*"transforma esses slides em metáforas"*). Estampa cada animação com um marcador `<!-- @MIRA:SIZE 3/10 -->` para o `mira-size-animator` escalar depois. Também trata *"transforme essa imagem num slide animado."*

## `/mira-animated-metaphor`
Atalho compatível do `/mira-animator` (modo substituir), mantido porque está citado em material publicado. Chamar um ou outro dá no mesmo: a regra vive só no `mira-animator`.

## `/mira-img-animator`
Anima uma imagem existente — dá vida a uma figura estática no estilo do deck.

## `/mira-size-animator`
Ajusta a percepção de tamanho das animações de um deck numa escala de 1 a 10, onde **3/10** é o que o `mira-animator` gera por padrão. Lê o marcador `@MIRA:SIZE` de cada animação, reporta o nível atual, e escala a composição (raios, comprimentos, espaçamentos, fontes internas e glow dentro do SVG) para preencher mais ou menos o palco — sem mudar a altura do palco nem quebrar o loop interno. *"Coloca as animações em 6/10," "esse slide em 2/10."*

!!! note "Tamanho e distância"
    No formato vertical (9:16), aumentar os elementos também encolhe as distâncias entre eles. No formato horizontal (16:9), só os elementos aumentam — as distâncias ficam como estão.

## `/mira-image`
Coloca uma imagem que você já tem (um arquivo local ou uma URL) dentro de um slide, num card limpo onde ela fica grande e bem enquadrada. Copia a imagem para a pasta `assets/` do deck e a referencia por caminho relativo, então o deck continua autossuficiente e abre direto de `file://` sem servidor (uma `<img>` comum não sofre o bloqueio de CORS que afeta o `.glb`). Mesmo card limpo do `mira-3d` e do `mira-qrcode`: só o título e a imagem maximizada, sem legenda embaixo. A imagem fica estática (`object-fit: contain` por padrão, então nada é cortado); o loop interno vive na moldura (um brilho respirando), nunca distorcendo a imagem. Para **gerar** uma imagem nova use `mira-visuals`; para **animar** uma imagem existente use `mira-img-animator`; esta aqui só **posiciona** uma imagem pronta.

## `/mira-get-videos`
Baixa os vídeos de fundo do Mira para `mira-templates/videos_header/`. Use quando um cabeçalho parecer vazio, ou logo após instalar se você quiser os fundos em vídeo.
