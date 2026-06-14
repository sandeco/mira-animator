# Mira

**Transforme seus projetos, livros e PDFs em apresentações HTML animadas — montadas por um time de agentes de IA.**

*Mira* significa "olha" / "veja" em espanhol. É também um acrônimo: **M**etáforas **I**nteligentes **R**esponsivas e **A**nimadas. O nome é a promessa: *olha isto* — e o movimento faz você olhar.

O Mira é um conjunto de agentes, skills e templates para criar apresentações HTML animadas (Tailwind + glassmorphism + animação vetorial programática) a partir do conteúdo que você já tem. Ele segue a filosofia do [Reversa](https://github.com/sandeco/reversa): instala-se numa pasta de trabalho isolada e lê conteúdo de **fontes vinculadas**, sem misturar nada com os projetos de origem.

O resultado é um `index.html` autossuficiente que abre direto do `file://` — sem servidor, sem build — pronto para apresentar ou gravar em vídeo.

---

## Em um minuto

```bash
# 1. instale o Mira numa pasta nova de slides
cd minha-pasta-de-slides
npx mira-animator install

# 2. vincule o conteúdo sobre o qual você quer apresentar
npx mira-animator link ../meu-projeto --name=meuprojeto

# 3. crie um deck
npx mira-animator new minha-aula --deck=aula-capitulo --theme=mira-dark
```

Depois abra o projeto no Claude e diga:

> *"preencha o deck minha-aula com o conteúdo da fonte meuprojeto"*

O pipeline de agentes lê a fonte, planeja os slides, escreve o texto, monta o HTML e coreografa as animações.

---

## O que torna o Mira diferente

- **Fontes vinculadas, não invasão.** O Mira lê das fontes que você vincula, mas escreve somente em `decks/`. Seus projetos de origem nunca são tocados.
- **Tudo se move.** Todo slide de conceito ganha uma animação em loop contínuo. A regra de ouro do Mira: nenhuma animação é estática — ela *entra* com coreografia e *depois* entra em loop.
- **Metáforas, não bullet points.** O agente `mira-animated-metaphor` transforma conceitos abstratos em analogias concretas e animadas do cotidiano.
- **Vários formatos de um único deck.** Um deck 16:9 vira versões 1:1, 9:16, regra dos terços e transição dissolve — sem tocar no original.
- **Roda em qualquer lugar.** A saída é HTML puro. Dê dois cliques no arquivo. Sem servidor, sem toolchain.

---

## Por onde seguir

| Você quer… | Leia |
|---|---|
| Entender o problema que o Mira resolve | [Por que o Mira](por-que-mira.md) |
| Instalar | [Instalação](instalacao.md) |
| Entender o modelo de fontes vinculadas | [Fontes vinculadas](fontes.md) |
| Montar seu primeiro deck | [Como usar](uso.md) |
| Ver todos os comandos | [CLI](cli.md) |
| Entender o time de agentes | [Pipeline de agentes](pipeline.md) · [Agentes](agentes.md) |
| Exportar para formatos de rede social | [Formatos de vídeo](formatos.md) |
| Customizar a aparência | [Temas e templates](temas.md) |
