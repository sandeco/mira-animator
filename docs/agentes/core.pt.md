# Agentes core

O coração da criação de decks. Veja como eles se conectam no [Pipeline de agentes](../pipeline.md).

## `/mira-new`
A porta de entrada de um novo deck. Coleta os requisitos de uma apresentação de forma conversacional (nome do tema, template do deck, tema base, cor principal e referências) e monta a pasta `decks/<tema>/` pronta para o pipeline preencher. **Não** gera slides — prepara o terreno e, ao final, oferece acionar o pipeline.

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
