# Evidência · comparação lado a lado dos dois templates Studio

Leitura estática do repositório no commit `c7adeb2`, branch `agent/documentacao-completa-mira`.

## 1. O contrato existe e é opt-in por deck

`templates/authoring/mira-edit.js:147-156` (comum aos dois formatos):

```js
/* decks com fonte externa de ordem (ex.: roteiro.md no mira-studio-full)
   registram window.miraOrderSource = { available(), commit(perm) }.
   Quando existe, o Salvar delega a ORDEM a ele e não reordena o HTML. */
function orderSource() { return window.miraOrderSource || null; }
```

O próprio comentário nomeia só o `mira-studio-full`. O contrato nasceu com um consumidor
único.

`templates/authoring/mira-edit.js:573-601` (o `saveAll`):

```js
var api = orderSource();
var delegated = orderChanged && api && api.commit;
...
var reordena = delegated ? false : orderChanged;
var out = composeSource(src, perm, reordena, freeChanged);
...
if (delegated) await api.commit(perm);
```

Sem `miraOrderSource`, `delegated` é `false`, `reordena` é `true` e o `composeSource`
reordena as `<section>` dentro do `index.html`. Nenhum caminho toca no `roteiro.md`.

## 2. Quem registra o hook

```
$ grep -c "miraOrderSource\|remapPorPosicao\|mira-slide-id" \
    templates/decks/mira-studio-demo/index.html
0
$ grep -c "miraOrderSource\|remapPorPosicao\|mira-slide-id" \
    templates/decks/mira-studio-full-demo/index-16x9.html
10
```

## 3. História: a correção nunca saiu do 16:9

```
$ git log -S"miraOrderSource" --oneline --name-only --all
5433675 feat: /mira-fast, memoria de preferencias e padronizacao das skills
templates/authoring/mira-edit.js
templates/decks/mira-studio-full-demo/index-16x9.html
```

Um commit, dois arquivos. `templates/decks/mira-studio-demo/index.html` não aparece em
nenhum momento da história do símbolo.

## 4. O que o 16:9 faz e o 9:16 não faz

`templates/decks/mira-studio-full-demo/index-16x9.html:1255-1309`, o `commit(perm)`:

1. `available()` recusa reordenar durante gravação (`data-mira-recording`);
2. relê o `roteiro.md` do servidor, corta em blocos pelos `^## Slide`;
3. **recusa** se a contagem de blocos divergir da contagem de slides na tela;
4. carimba `<!-- mira-slide-id: ... -->` em bloco que ainda não tenha (id estável por
   slide, sobrevive a título e número editados — ver `:780-786`);
5. remonta o arquivo na permutação nova e grava com `baseSha` (compare-and-set),
   tratando `409` como "o arquivo mudou por fora, nada foi gravado";
6. `remapPorPosicao(TXTKEY, perm)` e `remapPorPosicao(POSKEY, perm)` movem o estado do
   `localStorage` junto com o slide (`:1244-1254`);
7. guarda o slide atual em `sessionStorage` e recarrega, voltando para onde o usuário
   estava (`:1297-1305`, restauração em `:1311-1319`).

Nada disso existe em `templates/decks/mira-studio-demo/index.html`.

## 5. Por que o texto "fica para trás" e não simplesmente some

`templates/decks/mira-studio-demo/index.html:559`:

```js
var novas = R.slides.map(function (s, i) { return montarSecao(s, i + 1, estaticas[i]); });
```

O reaproveitamento introduzido pelo BUG-20260731-JZNJ casa `roteiro.md[i]` com
`estaticas[i]`: **por posição**. E `montarSecao` (`:478-513`) repinta o título a partir do
roteiro na seção reaproveitada.

`templates/decks/mira-studio-demo/index.html:936-940`:

```js
function doRoteiro(r) {   /* textos por ORDEM, nunca pelo número do cabeçalho */
    r.slides.forEach(function (s, i) { if (txt[i] !== s.texto) { txt[i] = s.texto; ... } });
}
```

O texto do teleprompter também é indexado por posição.

Logo, depois de mover uma seção no HTML e recarregar sob HTTP: a seção movida mantém o
palco e a animação dela (a identidade que o JZNJ preservou), mas recebe o **título e a
fala da posição nova**. O desalinhamento é visível e silencioso.

## 6. O servidor já suporta o que falta

`templates/studio/mira-studio-server.cjs:231-239` implementa o compare-and-set:

```js
/* compare-and-set opcional: baseSha = sha256 do conteúdo que o cliente ... */
if (typeof body.baseSha === 'string' && body.baseSha) {
    ...
    if (shaAtual !== body.baseSha) { /* 409 */ }
}
```

E os dois launchers sobem o mesmo binário:

```
templates/studio/mira-studio-windows.bat:19       node "%~dp0mira\mira-studio-server.cjs"
templates/studio/mira-studio-16x9-windows.bat:22  node "%~dp0mira\mira-studio-server.cjs"
```

Não há trabalho de servidor pendente. A lacuna é inteiramente do lado do deck 9:16.

## 7. Documentação: a assimetria também está nas skills

`agents/mira-studio-full/SKILL.md` e `agents/mira-studio/SKILL.md` descrevem os dois o
mapeamento "por ordem de aparição" do roteiro, e **nenhum dos dois** documenta o contrato
`miraOrderSource` nem manda o validador conferir sua presença. Por isso a lacuna passou
despercebida: nenhum checklist cobrava.

```
$ grep -n "slide-id\|baseSha\|Order" agents/mira-studio/SKILL.md
(nada)
```
