# Handoff original (relato bruto, verbatim)

> Recebido em 2026-07-31 pelo `/reversa-debugger`. Texto preservado exatamente como
> o usuário entregou, sem edição. As correções e observações desta sessão estão no
> `relato-20260731-2105.md` ao lado, nunca aqui.

---

# Handoff: bugs no template canônico `mira-studio` (e correlatos em `mira-default`)

Contexto para quem for aplicar o fix: isto foi encontrado depurando um deck real gerado por `/mira-fast /mira-studio` na instalação do Mira em `SLIDES/` (consumidor do pacote, não o repo fonte). Os bugs estão no **template/skill fonte**, então provavelmente já nasceram junto com o pacote e afetam todo deck `mira-studio` gerado a partir dele. Esta sessão não tem acesso ao repositório fonte do `mira-animator` — só à cópia instalada em `SLIDES/mira-templates/` e `SLIDES/.claude/skills/mira-fast/`. Os fixes abaixo foram aplicados **localmente** nessa cópia instalada (então já resolvem o deck do usuário), mas precisam ser portados para o repositório fonte, senão o próximo `npx mira-animator update` traz o bug de volta.

Arquivo de referência local (pode não bater 1:1 com a estrutura do repo fonte, mas o conteúdo/padrão é o mesmo):
`mira-templates/decks/mira-studio-demo/index.html` — template canônico do formato `mira-studio` usado pela Fase 1 do `/mira-fast` (skill `.claude/skills/mira-fast/SKILL.md`) e citado como fonte de verdade pela skill `mira-studio` (`.claude/skills/mira-studio/SKILL.md` — conferir se existe/está sincronizado no repo fonte).

---

## Bug principal (severo, praticamente 100% reprodutível): animação perde o palco após reconstrução via `roteiro.md`

### Sintoma

Num deck `mira-studio` gerado pelo `/mira-fast`, ao servir o deck via localhost (o fluxo recomendado para gravar com câmera — `mira-studio-server.cjs` / launcher `.bat`), **todo slide de conteúdo perde a animação a partir do primeiro slide reconstruído**. O primeiro slide (geralmente a capa, se usa o layout `capa`) funciona; a partir do segundo slide de conteúdo em diante, nada anima. Aberto via `file://` (sem servidor), o mesmo deck funciona normalmente — essa é a pista que expõe o bug: ele só aparece no caminho HTTP.

Câmera, teleprompter e o resto continuam funcionando; é especificamente o **palco da animação (SVG)** que fica órfão.

### Causa raiz

O template tem **dois mecanismos de binding de animação que não se falam**:

1. **O mecanismo nativo do template** (documentado no próprio arquivo, seção "ROTEIRO EXTERNO"): quando o deck é servido via HTTP, um IIFE lê `roteiro.md` (a "fonte da verdade" para texto/layout/título) e **reconstrói inteiramente** os `<section>` de conteúdo a partir dele, via `montarSecao(s, n)`. Essa função monta o palco chamando `palco(n)`:

   ```js
   function palco(n) {
       return '<div class="anim-stage"><svg id="sv-slide-' + n +
           '" preserveAspectRatio="xMidYMid meet"></svg></div>';
   }
   ```

   Ou seja: o SVG reconstruído sempre recebe um **id genérico `sv-slide-N`** (N = posição no roteiro.md), e a `<div class="anim-stage">` que o envolve **não recebe id nenhum**. Isso bate com a documentação interna do template ("cada animação escrita à mão se prende ao seu palco `sv-slide-N`") — funciona bem quando as animações são autorais, escritas à mão, direto contra esse id genérico (uso manual do template, fora do `/mira-fast`).

2. **O contrato de Fase 2 do `/mira-fast`** (`.claude/skills/mira-fast/references/contrato-animado.md` e `SKILL.md`): cada slide animado gerado pela Fase 2 recebe um **id específico do slug** (ex.: `hook-corte-80-stage` / `hook-corte-80-svg`, não `sv-slide-1`), e o binding é feito por uma função central `miraFastBindAnimations()` gerada na montagem (Fase 3), que usa `IntersectionObserver` + `document.getElementById(entry.stageId)` para cada entrada:

   ```js
   const entries = [
     { stageId: "hook-corte-80-stage", replayId: "replay-hook-corte-80", run: animateEtiqueta },
     // ...um por slide, com o id ESPECÍFICO gerado pela Fase 2
   ];
   ```

Quando a Fase 1 monta o esqueleto do `mira-studio` a partir deste template, ela herda o mecanismo de reconstrução via `roteiro.md` (item 1) **sem adaptá-lo** ao contrato de ids específicos que a própria Fase 2/3 do `/mira-fast` vai usar (item 2). Resultado:

- No load, o HTML estático (as `<section>` que a Fase 2 escreveu, com id específico) é exibido primeiro.
- Se servido via HTTP, o IIFE do roteiro dispara, busca `roteiro.md`, e **substitui todas as `<section>` não-fixas** pelas versões reconstruídas de `montarSecao`/`palco` — que usam `sv-slide-N`, não o id específico.
- A partir daí, `document.getElementById('hook-corte-80-stage')` (ou qualquer outro slug) **retorna `null`**: o elemento com aquele id não existe mais no DOM.
- Em `miraFastBindAnimations()`, a checagem `if (stage && !observed.has(stage)) { observer.observe(stage); }` simplesmente **não registra o observer** para aquele slide (falha silenciosa, sem exceção) — a função de animação correspondente nunca é chamada.
- Como a reconstrução troca **todos** os slides de conteúdo de uma vez só (não incrementalmente), o efeito prático é "a partir do primeiro slide de conteúdo, nenhuma animação toca".

### Fix aplicado localmente (recomendado para portar ao repo fonte)

Em vez de `montarSecao`/`palco` gerarem um palco novo e genérico, reaproveitar o palco **original** (com o id específico já correto) do `<section>` estático que está sendo substituído, e preservar também a classe do `<section>` original (relevante se o deck usa classes de estilo por slide, ex. cor de fundo alternada):

```js
function montarSecao(s, n) {
    var original = estaticas[n - 1];
    var sec;
    if (s.layout === 'capa' && capaBase) {
        sec = capaBase.cloneNode(true);
        if (s.titulo) tituloEm(sec.querySelector('h1'), s.titulo);
        return sec;
    }
    sec = document.createElement('section');
    if (original && original.className) sec.className = original.className;
    var stageOriginal = original && original.querySelector('.anim-stage');
    var stageHTML = stageOriginal ? stageOriginal.outerHTML : palco(n);
    if (s.layout === 'split') {
        sec.setAttribute('data-layout', 'split');
        sec.innerHTML = '<div class="split-top"><h2></h2>' + stageHTML + '</div><div class="cam-area"></div>';
    } else if (s.layout === 'full') {
        sec.setAttribute('data-layout', 'full');
        sec.innerHTML = '<div class="full-wrap"><h2></h2>' + stageHTML + '</div>';
    } else {
        sec.setAttribute('data-layout', 'camera');
        sec.innerHTML = '<div class="cam-area"></div>';
        return sec;
    }
    tituloEm(sec.querySelector('h2'), s.titulo);
    return sec;
}
```

`palco(n)` continua existindo como **fallback** (usado só se, por algum motivo, o `<section>` original daquela posição não tiver `.anim-stage` — ex. deck editado manualmente com slide a mais no `roteiro.md` do que no HTML estático).

`estaticas` já é capturado antes da reconstrução (`document.querySelectorAll('body > section:not([data-mira-fixed])')` na cópia local — conferir se o template fonte já tem esse filtro de slides fixos ou se é só `'body > section'`; qualquer um dos dois funciona para o propósito deste fix, o importante é que `estaticas[n-1]` continua correspondendo à posição N do `roteiro.md`, o que é verdade nos dois casos desde que a ordem não mude entre a captura e o uso).

### Como confirmar que o fix funciona

1. Gerar (ou usar) um deck `mira-studio` com pelo menos 2 slides de conteúdo animados via `/mira-fast`.
2. Servir via `mira-studio-server.cjs` (localhost), abrir no navegador.
3. Confirmar que a animação do **segundo** slide de conteúdo em diante também toca (não só a capa/primeiro).
4. Inspecionar o DOM após o load: os `<section>` reconstruídos devem manter os ids específicos (`{slug}-stage` / `{slug}-svg`), não `sv-slide-N`.

### Escopo / quem mais pode estar afetado

- Afeta qualquer deck `/mira-fast /mira-studio` com mais de um slide de conteúdo, **sempre que servido via HTTP/localhost** (o fluxo padrão recomendado pela própria skill para gravar com câmera). Por `file://` o bug não aparece, porque a reconstrução via `roteiro.md` só roda em HTTP (`if (!isHttp) return;` no IIFE do roteiro).
- **`mira-studio-full`**: não verificado a fundo nesta sessão. Uma checagem rápida (`grep -n "roteiro.md\|montarSecao" mira-templates/decks/mira-studio-full-demo/index.html`) não encontrou o mesmo padrão — sugere que esse formato pode não ter esse mecanismo de reconstrução (e portanto não teria o bug), mas vale confirmar diretamente antes de assumir que está seguro.
- Formatos `mira` (16:9) e `mira-vertical` não usam `roteiro.md`/reconstrução via HTTP — não afetados por este bug específico.

---

## Bugs secundários encontrados no mesmo template (`mira-studio-demo`), também corrigidos localmente

O validador da montagem (`assemble-run.mjs`, função `validateSkeleton`) exige alguns marcadores no esqueleto que o template `mira-studio-demo` **não tinha**, fazendo a Fase 1 falhar na montagem (Fase 3) de qualquer deck `mira-studio` gerado do zero, antes mesmo de chegar no bug principal acima. Reproduzido/consertado nesta sessão:

1. **Faltava o bloco `/* @MIRA:THEME:START */ ... /* @MIRA:THEME:END */`** no `<style>` do template. O template tinha um `:root` com variáveis soltas (`--accent`, `--bg`, `--ink`, `--muted`, `--line`) sem usar a convenção `--mira-*` do tema (`--mira-primary`, `--mira-bg`, etc., ver bloco equivalente em `mira-templates/decks/mira-default/index.html`, que já tem esse bloco correto). Fix: adicionar o bloco `@MIRA:THEME` com as variáveis `--mira-*` padrão do tema `mira-dark`, e apontar `--accent`/`--bg`/`--ink`/`--muted`/`--line` para elas via `var(--mira-*)` em vez de hardcode.

2. **Faltava o bloco `/* @MIRA:RESPONSIVE:START */ ... /* @MIRA:RESPONSIVE:END */`**. Fix: adicionar guarda básica de overflow horizontal + ajustes de fonte/padding em telas estreitas (o `mira-default` tem um bloco de referência mais completo, adaptável).

3. **Faltavam os marcadores HTML `<!-- @MIRA:FAST:CSS:START --> <!-- @MIRA:FAST:CSS:END -->`** logo antes de `</head>` — esse é o slot onde a Fase 3 injeta um `<style id="mira-fast-generated">` com o CSS específico de cada slide (um por slide animado). Sem esse slot vazio já aberto no template, a montagem falha com "marcador de esqueleto ausente". Fix: adicionar o par de comentários HTML vazios, no padrão que `mira-default` já usa.

4. **Validador `assemble-run.mjs` frágil a falso positivo**: a checagem que impede `<section>` fora do slot de slides (`if (/<section\b/i.test(outside)) errors.push(...)`) não diferencia tag real de **menção em comentário**. O próprio template tem várias explicações em comentário HTML/JS que citam `<section>` como texto (ex.: "é IRMÃO das `<section>`, nunca filho"), e essas menções ficam FORA do slot de slides (`@MIRA:FAST:SLIDES:START/END`), disparando o erro sempre que a Fase 1 monta o esqueleto herdando esses comentários. Duas correções possíveis, não excludentes:
   - **Mais simples (aplicada localmente)**: reescrever os comentários do template trocando `<section>` por `` `section` `` (sem os `<>`) — mantém a explicação, remove o gatilho falso.
   - **Mais robusta (não aplicada, recomendada para o repo fonte)**: em `assemble-run.mjs`, antes de rodar essa checagem, remover comentários HTML (`<!--...-->`) do trecho `outside` analisado, para o validador não reagir a texto documental.

Sem os itens 1-3, a Fase 3 (`node .claude/skills/mira-fast/scripts/assemble-run.mjs`) falha com mensagens do tipo:

```
{ "ok": false, "error": "esqueleto sem bloco @MIRA:RESPONSIVE" }
{ "ok": false, "error": "marcador de esqueleto ausente ou duplicado: <!-- @MIRA:FAST:CSS:START -->" }
{ "ok": false, "error": "esqueleto contém <section> fora do slot de slides" }
```

Isso bloqueia a geração de **qualquer** deck `mira-studio` do zero via `/mira-fast`, antes mesmo de chegar no bug de animação. Ambos os problemas (este e o principal) precisam ser corrigidos para o formato funcionar de ponta a ponta.

---

## Resumo executivo

| # | Bug | Onde | Efeito | Só aparece em |
|---|---|---|---|---|
| 1 | `montarSecao`/`palco` geram id genérico `sv-slide-N` incompatível com o id específico do slug usado pela Fase 2/3 do `/mira-fast` | `mira-studio-demo/index.html`, IIFE "ROTEIRO EXTERNO" | Toda animação de conteúdo para de tocar a partir do 1º slide reconstruído | Servido via HTTP (localhost) |
| 2 | Falta bloco `@MIRA:THEME` | idem | Montagem falha (Fase 3) | Sempre que a Fase 1 monta um esqueleto do zero |
| 3 | Falta bloco `@MIRA:RESPONSIVE` | idem | Montagem falha (Fase 3) | idem |
| 4 | Falta slot `<!-- @MIRA:FAST:CSS:START/END -->` | idem | Montagem falha (Fase 3) | idem |
| 5 | Validador não distingue `<section>` real de menção em comentário | `assemble-run.mjs` (`validateSkeleton`) + comentários do template | Falso positivo de erro na montagem | Sempre que o template tem doc citando `<section>` fora do slot |

Prioridade sugerida: 2, 3, 4 e 5 bloqueiam a geração de QUALQUER deck `mira-studio` novo (erro imediato na montagem) — são pré-requisito. O bug 1 é mais sério a longo prazo porque não dá erro nenhum: o deck monta, parece pronto, e só falha silenciosamente na hora de gravar.
