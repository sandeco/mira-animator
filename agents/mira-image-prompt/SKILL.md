---
name: mira-image-prompt
description: >
  Cria prompts JSON estruturados para geração de imagens de produto com estética
  luxuosa e cinematográfica. Use sempre que o usuário quiser gerar um prompt de imagem,
  criar foto de produto, ou fotografar (comida, bebida, cosmético, joia, moda ou qualquer
  item visual) com IA. Ative também ao mencionar: "prompt para imagem",
  "gerar imagem de produto", "foto de produto com IA", "prompt para Midjourney/DALL-E/Flux",
  "fotografar produto", "montar um prompt JSON de imagem".
---

# Image Prompt Builder

Constrói prompts JSON de produtos com estética cinematográfica e luxuosa — otimizado para
**Nano Banana 2 (Gemini 3.1 Flash Image)** via **Google Antigravity**, com todos os
parâmetros nativos do modelo.

---

## Fluxo obrigatório (nesta ordem)

1. **Entrevista guiada** por blocos (Etapa 1)
2. **Confirmação** — resumo e aprovação (Etapa 2)
3. **Geração do JSON** final (Etapa 3)

---

## ETAPA 1 — Entrevista guiada por blocos

Colete em **3 rodadas**, nunca tudo de uma vez.

### Rodada 1 — Produto e Cena

> "Vamos montar seu prompt de imagem! Preciso entender o produto primeiro. Me conta:"

1. **Tipo de produto**: (ex: bolo de chocolate, frasco de perfume, tênis, shake, joia...)
2. **Nome da marca**: tem marca visível? Qual?
3. **Aparência**: cor, textura, acabamento, forma. Quanto mais detalhe, melhor.
4. **Elementos extras**: acompanhamentos? (frutas, gelo, flores, folhas, reflexos...)
5. **Tipo de cena**: qual o clima geral?
   - luxuoso e cinematográfico / clean e minimalista / dramático e contrastado / quente e aconchegante / futurista e tecnológico

### Rodada 2 — Composição e Ação

> "Ótimo! Agora me conta sobre o visual dinâmico da imagem:"

6. **Ação principal**: estático ou em movimento? (ex: líquido explodindo, partículas suspensas, fumaça, splash, corte revelando interior...)
7. **Elementos suspensos no ar**: o que voa ao redor? (ex: gotas, pó, fragmentos, folhas, cristais, bolhas...)
8. **Superfície de apoio**: onde está? (ex: mármore branco polido, pedra preta fosca, madeira rústica, vidro transparente, superfície abstrata...)
9. **Ângulo da câmera**: ângulo baixo (dominância) / nível dos olhos / levemente acima / macro extremo / ângulo 3/4

### Rodada 3 — Iluminação, Cores e Especificações Técnicas

> "Quase lá! Agora a parte visual e técnica:"

10. **Estilo de iluminação**: estúdio clean e brilhante / dramático com sombras / luz natural suave / luz de produto de luxo com rim light / luz néon colorida
11. **Paleta do fundo**: qual cor/gradiente domina? (ex: preto carvão com bokeh âmbar, gradiente rosa para champanhe, azul escuro para branco...)
12. **Cores de destaque (accents)**: quais surgem ao redor? (ex: dourado, prata, vermelho vivo, tons pastéis...)
13. **Resolução**:
    - `512px` — iteração rápida / testes
    - `1K` — redes sociais e uso digital
    - `2K` — conteúdo profissional
    - `4K` — produção máxima / impressão
14. **Aspect Ratio** (padrão: `16:9`):
    - `16:9` — widescreen (padrão) ✅
    - `1:1` — quadrado (Instagram feed)
    - `9:16` — vertical (Stories, Reels, TikTok)
    - `4:3` — clássico
    - `3:4` — retrato
    - `4:1` / `1:4` — banner horizontal / vertical
    - `8:1` / `1:8` — super banner
15. **Estilo de renderização**: Fotorrealista ultra-detalhado / ilustração / 3D render / foto analógica / outro?
16. **Algo mais?**: algum detalhe especial a garantir?

---

## ETAPA 2 — Confirmação

Mostre um **resumo em tópicos** para o usuário confirmar. Só avance após confirmação.

```
📋 RESUMO DO PROMPT:
- Produto: [tipo] — [marca]
- Aparência: [descrição]
- Cena: [tipo]
- Ação: [descrição]
- Elementos suspensos: [lista]
- Superfície: [descrição]
- Ângulo: [ângulo]
- Iluminação: [estilo]
- Fundo: [cores]
- Accents: [cores]
- Resolução: [ex: 2K]
- Aspect Ratio: [ex: 1:1]
- Renderização: [ex: ultra-photorealistic]

Está correto? Posso montar o prompt JSON agora?
```

---

## ETAPA 3 — Geração do JSON

Com as respostas confirmadas, siga **exatamente** este schema:

```json
{
  "master_prompt": {
    "scene_type": "[velocidade/estilo] [nicho] photography",
    "product": {
      "type": "[descrição rica e adjetivada do produto]",
      "brand_name": "[nome da marca ou 'no visible branding']",
      "appearance": "[cor, textura, forma, acabamento detalhados]",
      "accompaniments": [
        "[elemento 1 com descrição sensorial]",
        "[elemento 2 com descrição sensorial]"
      ]
    },
    "composition": {
      "action": "[ação dramática central capturada em movimento]",
      "surrounding_elements": [
        "[elemento suspenso 1 com detalhe de movimento]",
        "[elemento suspenso 2 com detalhe de movimento]",
        "[elemento suspenso 3 com detalhe de movimento]"
      ],
      "placement": "[posicionamento hero centralizado na superfície especificada]"
    },
    "lighting": {
      "style": "[estilo de iluminação completo]",
      "effects": [
        "[efeito de rim light]",
        "[efeito de key light]",
        "[efeito de backlight ou top light]",
        "[efeito extra se necessário]"
      ]
    },
    "color_palette": {
      "background": "[gradiente/bokeh do fundo com descrição de transição]",
      "accents": "[lista de cores de destaque separadas por vírgula]"
    },
    "technical_specs": {
      "camera": "[tipo de lente], [ângulo escolhido]",
      "shutter": "[tipo de captura — freeze-motion, long exposure, etc.]",
      "depth_of_field": "[foco principal], [descrição do blur]",
      "rendering_style": "[fotorrealista / ilustração / 3D render / foto analógica / etc.]"
    },
    "output_specs": {
      "resolution": "[512px | 1K | 2K | 4K]",
      "aspect_ratio": "16:9",
      "model": "nano-banana-2",
      "synthid_watermark": true
    }
  }
}
```

---

## Regras de qualidade do JSON

- **Adjetivos de luxo/premium** obrigatórios em todo campo descritivo
- **Movimento congelado** sempre presente em `action` e `surrounding_elements`
- **Superfícies reflexivas** mencionadas em `placement`
- Produto sempre o **herói centralizado** da cena
- `surrounding_elements`: **mínimo 3, máximo 6 itens**
- `lighting.effects`: **sempre 3 ou 4 efeitos** (rim, key, back/top + extra opcional)
- `scene_type`: padrão `"[adjetivo de velocidade/estilo] [nicho] photography"`
- `output_specs.resolution`: valores nativos `512px`, `1K`, `2K` ou `4K`
- `output_specs.aspect_ratio`: valores nativos suportados pelo modelo
- `output_specs.model`: sempre `"nano-banana-2"`
- `output_specs.synthid_watermark`: sempre `true` (padrão obrigatório do Google)

---

## Após gerar o JSON

Apresente o JSON em bloco de código e adicione:

> 💡 **Dica de uso no Antigravity:** Cole este JSON diretamente no campo de prompt do Nano Banana 2 no Google Antigravity. Os campos `output_specs` são interpretados nativamente pelo modelo — sem prefixo adicional.

Pergunte se o usuário quer ajustar algum campo, trocar o aspect ratio ou gerar variações.

---

## Exemplos de referência

Para padrões de linguagem, consulte `references/Examples.md` se disponível.
