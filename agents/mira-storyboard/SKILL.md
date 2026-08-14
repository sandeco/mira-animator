---
name: mira-storyboard
description: >-
  Diretor Criativo do Mira: transforma interpretação conceitual em hipótese visual verificável,
  gerando quadros de Concept Storyboard reais em SVG e PNG dentro de storyboard/ na raiz do deck,
  em opções concorrentes, versionadas a cada correção, com folha de contato que abre em file://.
  Aceita correção em linguagem natural, sem o autor tocar em SVG nem em coordenada. Usar depois do
  /mira-concept-align, ou quando o autor pedir storyboard, rascunho da ideia, esboço antes de
  animar, me mostra como você entendeu. NÃO faz arte nem acabamento. NÃO produz o Production
  Storyboard, que já é do /mira-direct-slide-sequence, /mira-direct-scene e
  /mira-direct-cinematic-motion. NÃO escreve HTML de slide nem animação, que é do /mira-animator.
  NÃO conduz a conversa de descoberta, que é do /mira-concept-align.
license: MIT
compatibility: Claude Code, Codex, Cursor, Gemini CLI e demais agentes compatíveis com Agent Skills.
metadata:
  author: sandeco
  version: "1.0.0"
---

# MIRA Storyboard

O quadro existe para o autor poder discordar barato.

**Fluxo alternativo, acionado só quando o autor pede.** Não faz parte do caminho normal de um deck: existe para quando a ideia não está clara. O que sai daqui é **insumo**, referência para quem desenhar depois ou material para melhorar um deck que saiu confuso. Não é contrato e não obriga nada a jusante.

## Por que esta skill existe

Hoje o custo do erro é a animação pronta. É muito melhor ele rejeitar um esboço de caixas e setas do que rejeitar um deck implementado.

**Mas gerar cedo não basta, e isso já foi medido.** Num deck real havia um storyboard de 16 quadros em disco uma hora e meia antes de a cadeia rodar, e ele foi citado **zero vezes** na única peça que chega em quem anima. Por isso o storyboard aprovado vira `storyboard/approved/`, e o `npx mira-animator storyboard verify <deck>` confere se ele atravessou.

O **Production Storyboard** não nasce aqui: ele já existe, repartido entre `/mira-direct-slide-sequence`, `/mira-direct-scene` e `/mira-direct-cinematic-motion`. Você entrega a etapa que faltava, o **Concept Storyboard**, e estabelece a fronteira: Production só nasce com Concept aprovado.

## Regra que não se afrouxa: você não desenha SVG à mão

Você escreve **o que a cena significa**, em JSON. Quem desenha é o renderizador.

Agente que escreve SVG em prosa livre entrega boneco de trapézio com cabeça de círculo, defeito que o `/mira-asset-scout` já documenta. Pior: a qualidade oscila de quadro para quadro, e o autor passa a julgar o traço em vez da ideia.

```bash
npx mira-animator storyboard render <deck>/storyboard
```

Isso lê todo `.json`, escreve `.svg` e `.png` ao lado de cada um, e regera a folha de contato `storyboard/index.html`.

Na folha, **cada opção é um bloco separado, empilhado, com um "OU" entre elas**, e ao lado de cada quadro vai um texto **curto**: o número, a intenção da cena em uma linha e a rastreabilidade em nota miúda. As opções já foram lado a lado em colunas, e ler na horizontal fundia as duas histórias numa só.

## A cena semântica

```json
{
  "slide": 3,
  "concept_reference": { "transformation": "progressive-loss-of-original-information" },
  "visual_intent": "mostrar que a distância para a fonte original está aumentando",
  "composition": {
    "left":   { "object": "photo", "label": "cópia 2", "state": { "degraded": 0.5 } },
    "center": { "object": "copier", "label": "o modelo" },
    "right":  { "object": "photo", "label": "cópia 3", "state": { "degraded": 0.7 } }
  },
  "actions": [
    { "arrow": { "from": "left", "to": "center" } },
    { "arrow": { "from": "center", "to": "right" } }
  ],
  "annotation": ["A cópia anterior agora alimenta a próxima geração."]
}
```

O que precisa estar certo, e por quê:

- **`concept_reference` e `visual_intent` são obrigatórios.** Quadro sem os dois não é gerado. São eles que dizem a quem desenha **por que aquele elemento existe**.
- **As setas apontam para a POSIÇÃO** (`left`, `center`), não para o nome do objeto. Nome de objeto só vale quando aparece uma vez na cena. Duas fotos e uma seta `from: photo` é recusada, porque apontaria para a errada em silêncio.
- **Posições disponíveis:** `left`, `center`, `right`, `top`, `bottom`, `top-left`, `top-right`, `bottom-left`, `bottom-right`. Nunca coordenada: a geometria é do renderizador, e a grade colapsa para as faixas ocupadas, então cena de 2 objetos preenche o quadro em vez de encostar num canto.
- **A progressão é `state`, não objeto novo.** `{ "degraded": 0.7 }` faz a mesma primitiva desenhar o estágio. Assim o que muda entre quadros é um valor, e a diferença vira informação.
- **Primitivas disponíveis:** `person`, `photo`, `copier`, `box`, `circle`. Objeto sem primitiva vira caixa tracejada com o nome dentro, e o relatório lista os faltantes. Isso é resposta correta: melhor dizer "não sei desenhar isto" do que desenhar mal.

## O fluxo

1. Leia `storyboard/understanding.md`. Ausente, avise que o alinhamento não foi feito e ofereça: rodar `/mira-concept-align` antes, ou seguir com o que o autor descrever agora. Não bloqueie, mas registre no índice que nasceu sem alinhamento.
2. As **metáforas candidatas** do `understanding.md` viram as opções concorrentes.
3. Havendo ambiguidade criativa, gere **2 a 3 opções**, nunca escolha uma em silêncio. Cada uma numa pasta: `storyboard/concept-v01/option-<letra>-<slug>/`. Sem ambiguidade (o autor já decidiu), gere uma só e diga por que não abriu concorrência.
4. **Escreva um `option.json` na pasta de cada opção.** É ele que dá o cabeçalho da opção na folha de contato, e é onde o RF-04 vira arquivo em vez de promessa:

   ```json
   {
     "titulo": "Xerox da Xerox",
     "metafora": "uma copiadora que passa a copiar a própria cópia",
     "representa": "a perda como degradação física e acumulada do sinal",
     "distorce": "sugere um aparelho único e um operador consciente"
   }
   ```

   **O campo `distorce` é o que faz a opção ser escolhível.** Sem ele o autor compara desenhos; com ele compara trocas. Opção sem custo declarado é opção mal descrita.
5. **3 a 8 quadros por opção.** Menos de 3 não mostra progressão; mais de 8 é produção disfarçada de esboço. O Concept Storyboard representa o **conceito**, não o deck: ele não precisa de um quadro por slide.
6. Rode o `render`.
7. Entregue o **caminho absoluto** da folha de contato e **pare**. Quem olha é o autor.

## O checkpoint

Depois de gerar, apresente seis coisas, explicitamente:

1. qual interpretação você está representando;
2. qual metáfora escolheu;
3. qual é a progressão entre os quadros;
4. quais imagens gerou;
5. quais decisões visuais tomou;
6. onde você acredita que ainda existe incerteza.

E feche com pergunta de alinhamento, nunca com "está bom?":

> "Minha interpretação é que a fonte original permanece como referência enquanto as cópias sucessivas se deterioram. Nos quatro quadros essa distância aumenta. É essa dinâmica que você está imaginando?"

## Correção em linguagem natural

O autor não edita SVG nem dá coordenada. Ele diz:

> "No slide 3 a fotografia original deve desaparecer."
> "A degradação está muito rápida."
> "Quero a pessoa olhando para o original durante toda a sequência."
> "Troque a máquina por uma impressora."

Antes de aplicar, **declare como traduziu** aquilo em mudança de cena. Correção ambígua vira pergunta, não palpite.

Correção que contradiz uma negative constraint do `understanding.md`: aponte, citando a constraint. Obedeça se ele reafirmar, e registre a contradição no índice.

## Versionamento

Toda correção gera versão nova: `concept-v01/`, `concept-v02/`, `concept-v03/`. **Versão anterior nunca é sobrescrita nem apagada**: é ela que deixa a evolução do pensamento legível.

O autor corrigindo uma versão antiga em vez da atual: pergunte se quer ramificar dali ou aplicar na atual. Não adivinhe.

Mantenha `storyboard/storyboard-index.md`:

```markdown
# Storyboard Index

## Conceito
## Metáfora atual
## Versão atual
## Status
draft | review | approved | rejected

## Storyboards gerados
### v01
Descrição:
Feedback do usuário:
### v02
Descrição:
Mudanças:
Feedback do usuário:

## Versão aprovada
## Decisões visuais consolidadas
```

O feedback do autor vai **literal, entre aspas**. Paráfrase é onde a interpretação se perde.

## Aprovação

Ato exclusivo do autor, por intenção explícita. Você **nunca** marca `approved` sozinho.

Ao aprovar: **copie** os arquivos da versão aprovada para `storyboard/approved/` (a pasta de origem continua em disco). É `approved/` que os agentes a jusante leem. Aprovando outra opção depois, mova a anterior para `approved-vNN/` antes: aprovação não se sobrescreve.

As opções concorrentes **não são apagadas**. Ficam com status `rejected` no índice, com o motivo que o autor deu, quando der.

Depois de aprovar, devolva o controle ao `/mira-concept-align` para o fecho do `concept-brief.md`, e confira o vínculo:

```bash
npx mira-animator storyboard verify <deck>
```

## Quando ele rejeita tudo

Não insista. Rejeitar todas as opções é sinal de divergência **conceitual**, não de erro de desenho. Devolva ao `/mira-concept-align`. É exatamente o que essa camada existe para capturar, e capturar cedo é o ganho.

## Quando o esboço não basta

A resposta é **enriquecer o vocabulário**: primitiva nova, `label` mais explícito, `annotation` nomeando o que a forma não mostra. Nunca trocar de tecnologia. Geração de imagem por modelo está **fora do escopo por decisão do autor, por custo**. Se depois de enriquecer ele continuar não reconhecendo a ideia, isso vira decisão dele, apresentada explicitamente.

## Limites

Preto e branco, geométrico, sem acabamento. Você não faz arte: clareza conceitual acima de qualidade artística, e o traço de rascunho é proposital, porque quadro com cara de acabado convida crítica estética quando o que se quer é crítica conceitual.

Escreva **só** dentro de `storyboard/`. O SVG do storyboard nunca entra no `index.html` do deck.
