# Contrato do `plano.json`

Caminho: `decks/<slug>/mira/fast/plano.json`. Escritor único: Fase 1.

## Raiz

```jsonc
{
  "versao": 2,
  "slug": "programacao-concorrente",
  "formato": "mira",
  "arquivo_saida": "index.html",
  "deck_dir": "decks/programacao-concorrente",
  "titulo_deck": "Programação Concorrente",
  "subtitulo_deck": "Como fluxos dividem recursos",
  "paleta": { "primaria": "#FF904D", "fundo": "#000000", "modo": "cor-unica" },
  "tom": "didático e direto",
  "lembrancas": { "capa": "...", "conteudo": "..." },
  "total_slides": 3,
  "slides": [],
  "ledger": []
}
```

`formato` aceita `mira`, `mira-studio`, `mira-studio-full`, `mira-vertical`. A saída correspondente é `index.html`, `index.html`, `index-16x9.html`, `index-9x16.html`.

`lembrancas` reúne as consultas centrais de memória para capa e conteúdo. É opcional; use `{}` quando os comandos falharem. Orientação, nunca ordem; a marca manda acima dela.

## Campo comum de slide

```jsonc
{
  "n": 1,
  "slug_stage": "capa",
  "tipo": "capa",
  "modo_folha": "estatica",
  "titulo": "Programação Concorrente",
  "subtitulo": "Como fluxos dividem recursos"
}
```

Obrigatórios em todo slide: `n`, `slug_stage`, `tipo`, `modo_folha`. `n` começa em 1, é contínuo e determina a montagem. `slug_stage` é kebab-case e único.

`tipo` aceita `capa`, `animado`, `card`, `cta`, `encerramento`. Layout `camera` pode usar um desses tipos não animados. `modo_folha` aceita apenas `estatica` ou `animada`.

- `animado` exige `modo_folha: animada`.
- `capa`, `card`, `cta`, `encerramento` e layout `camera` exigem `modo_folha: estatica`.
- `titulo` é obrigatório, exceto em layout `camera`.

## Slide animado

```jsonc
{
  "n": 2,
  "slug_stage": "corrida",
  "js_id": "corrida",
  "tipo": "animado",
  "modo_folha": "animada",
  "titulo": "Dois fluxos, uma panela",
  "subtitulo": "Quem chega primeiro serve.",
  "conceito": "condição de corrida",
  "frase_causal": "Quando dois fluxos escrevem sem trava, o resultado muda com a ordem porque uma escrita pode sobrepor a outra. Se ninguém arbitra, um valor se perde.",
  "metafora": "duas mãos servindo da mesma panela",
  "familia": "cozinha",
  "verbo_causal": "sobrepor",
  "silhueta": "panela e conchas",
  "espaco": "duas colunas convergindo",
  "movimento": "alternância que colide",
  "tempo": "rajada com pausa",
  "pilulas": ["Leitura", "Escrita", "Trava"],
  "icone_moldura": "layers"
}
```

Obrigatórios em folha animada: `js_id`, `titulo`, `conceito`, `frase_causal`, `metafora`, `familia`, `verbo_causal`, `silhueta`, `espaco`, `movimento`, `tempo`.

`js_id` é camelCase seguro (`^[a-z][A-Za-z0-9]*$`) e único. Ele gera `animate<PascalJsId>` e `window.__<js_id>Gen`. `slug_stage` continua sendo o id DOM.

No formato `mira`, também são obrigatórios `subtitulo`, `pilulas` e `icone_moldura`.

## Formatos com câmera

`mira-studio` exige `layout: capa | camera | split | full` e `fala`. `capa` vale apenas para capa/encerramento e não gera `data-layout` no HTML. Gera `roteiro.md`.

`mira-studio-full` exige `layout: camera | thirds | full`, `fala` e pode incluir `animacao_declarativa`. Gera `roteiro.md`.

Layout `camera` é sempre estático e dispensa título e metáfora. Slides animados usam `split | full` no Studio e `thirds | full` no Studio Full. Outros layouts podem ser estáticos conforme `tipo`.

`mira-vertical` não usa `layout`; slides animados devem ter eixo espacial dominante na altura.

## Ledger

Uma entrada por folha animada:

```jsonc
{
  "n": 2,
  "assinatura": "cozinha | sobrepor | panela e conchas | duas colunas | alternância | rajada com pausa"
}
```

A assinatura segue `família | verbo | silhueta | espaço | movimento | tempo`. Não existe `metafora_reserva`.

## Invariantes

1. `total_slides === slides.length`.
2. `n` é contínuo e único.
3. `slug_stage` é único em todas as folhas.
4. `js_id` é único entre folhas animadas.
5. Todo slide produz exatamente um `slide-NN.html`.
6. Somente folhas animadas entram no ledger e nos triggers.
7. Capa e encerramento também vêm de fragmentos; a montagem não os fabrica.
8. `lembrancas` é opcional e vem da consulta central à memória; folhas nunca consultam memória individualmente.
