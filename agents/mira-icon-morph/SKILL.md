---
name: mira-icon-morph
description: Gera num slide do Mira uma forma que morfa em outra(s) em loop a partir de CONCEITOS em palavras (o usuário só tem a ideia, não o arquivo). Busca cada conceito na API do Iconify, valida licença, baixa o SVG e monta a timeline de morph (GSAP + MorphSVGPlugin vendorados; deck offline file://). Só licença aberta (MIT, Apache-2.0, CC0 ou CC-BY), com atribuição em CREDITS.md; recusa personagens/marcas de IP protegida e sugere arte original. Reaproveita o render do mira-svg-morph. Use SEMPRE que o usuário disser "/mira-icon-morph", "nuvem virando lâmpada", "uma semente que vira árvore", "cadeado abrindo", "morfa o conceito X no Y", "acha um ícone que vira outro", "busca uns ícones e faz morph", ou descrever em palavras dois ou mais conceitos para um virar o outro SEM fornecer arquivos. Se o usuário JÁ tem os arquivos .svg, use mira-svg-morph. Para metáfora densa/emergente (partículas, explosão), use mira-animator (D3).
---

# Skill: conceito que vira ícone que morfa, em loop

Gera um slide de morph quando o usuário tem só a ideia em palavras ("nuvem virando lâmpada"), sem os arquivos. Acha os ícones, valida a licença e monta o morph. Irmão do `mira-svg-morph`: mesma renderização, fonte diferente.

> **Fonte da verdade:** o render é o do `mira-svg-morph` (`agents/mira-svg-morph/SKILL.md`), validado em `decks/apresentacao-mira-gsap/` (ícones da Iconify, conjunto MDI). Spec completa em `_reversa_sdd/GSAP/mira-icon-morph-spec.md`; sourcing/licença em `_reversa_sdd/GSAP/mira-gsap-contexto.md` (seção 4).

## Por que Iconify (e não raspar SVG da web)

A API do Iconify entrega ícones limpos, de +200 conjuntos open source, **com licença por conjunto** e a maioria em **viewBox 0 0 24 24** de path único — resolve de origem a compatibilidade para morph (mesmo sistema de coordenadas). Raspar SVG solto traz arquivo sujo, viewBox incompatível e licença incerta.

## Buscar e baixar (só na geração, internet aqui)

1. **Buscar cada conceito** na ordem do morph:
   ```
   curl -s "https://api.iconify.design/search?query=CONCEITO&limit=20"
   ```
   Prefira **path único** e viewBox 0 0 24 24. Conjuntos sólidos single-path (ex.: `mdi`) morfam melhor que traço com muitos sub-paths.
2. **Pegar o SVG do ícone escolhido** (markup pronto para inline):
   ```
   curl -s "https://api.iconify.design/{conjunto}/{icone}.svg" -o assets/icons/CONCEITO.svg
   ```
3. **Validar a licença do conjunto** (nos metadados de busca/coleção): **apenas** MIT, Apache-2.0, CC0 ou CC-BY. Se o resultado for proprietário ou sem licença clara, busque alternativa aberta; se não houver, avise.
4. **Registrar atribuição** em `CREDITS.md` do deck: uma linha por conjunto (nome, licença, link). Obrigatório.

## Guarda de propriedade intelectual (inegociável)

**Recuse** personagens ou marcas de IP protegida (heróis de franquia, mascotes de empresa, logos de terceiros). Não baixe automaticamente: explique e sugira **arte original** (ex.: herói genérico de capacete e propulsores, sem personagem real).

## Render: reaproveite o núcleo do mira-svg-morph

Baixados os SVGs, o resto é **idêntico ao `mira-svg-morph`**: inline com ids únicos por arquivo, `MorphSVGPlugin.convertToPath` em formas não-path, vendorar GSAP + MorphSVG em `assets/gsap/`, card limpo (título sem ícone máx. 6 palavras, forma central em #FF904D), timeline em loop (`repeat: -1`; 2 = ida e volta, N = encadeia), `prefers-reduced-motion` com estado final estático, e registrar no trigger do deck. Use o mesmo scaffold de JS daquela skill (a constante `FORMAS` recebe os `d` dos ícones na ordem dos conceitos).

## Passos

1. **Receber os conceitos** em palavras, na ordem do morph (2 ou mais). Com 1 só, avise que precisa de 2 ou mais. Se for IP protegida, recuse e sugira arte original.
2. **Buscar no Iconify**, preferindo path único e viewBox 0 0 24 24. Apresente as opções por conceito (conjunto + licença); deixe o usuário escolher ou escolha a melhor single-path de licença aberta.
3. **Baixar os SVGs** para `assets/icons/` e **registrar atribuição** em `CREDITS.md`.
4. **Renderizar o morph** reaproveitando o núcleo do `mira-svg-morph` (inline, ids únicos, convertToPath, vendorar GSAP, card, loop, reduced-motion, trigger).
5. **Reportar.** Caminho do arquivo, conceitos e sequência do morph, conjuntos usados com licença, o loop em uma frase, e que o deck abre por `file://` sem rede.

## Checklist

- [ ] 2 ou mais conceitos; com 1 só, a skill avisou.
- [ ] Ícones de licença aberta (MIT, Apache-2.0, CC0 ou CC-BY); nenhum proprietário ou sem licença.
- [ ] Atribuição de cada conjunto registrada em `CREDITS.md` do deck.
- [ ] Nenhum personagem/marca de IP protegida; arte original sugerida quando aplicável.
- [ ] Preferência por path único e viewBox 0 0 24 24.
- [ ] Render igual ao `mira-svg-morph`: inline, ids únicos, convertToPath, GSAP vendorado, loop, reduced-motion, card limpo.
- [ ] Internet só na geração; o deck final abre por `file://` sem rede (ícones inline, GSAP vendorado).
- [ ] Título sem ícone, no máximo 6 palavras; laranja #FF904D na forma.
- [ ] Marcador `@MIRA:SIZE 3/10`; timeline registrada no trigger do deck; anti-vazamento (`kill`) antes de replay.
- [ ] Nenhum travessão (—); acentuação UTF-8 correta (segue `agents/_shared/idioma.md`).
