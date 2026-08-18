---
name: mira-sequence-director
description: >-
  Orquestra uma explicação inteira como um plano-sequência: recebe o que o autor
  quer explicar, aplica um teste de forma, escreve um roteiro de continuidade com
  o elenco e a pose de repouso de cada cena, e constrói a corrente em série, a
  cena 1 pelo /mira-animator e cada elo seguinte pelo /mira-sequence. Use quando
  o autor disser /mira-sequence-director, "crie uma animação que explica X", "quero
  mostrar o processo inteiro em movimento", "uma explicação só que atravessa
  vários slides", "plano-sequência", ou pedir uma série de cenas que se
  transformam umas nas outras a partir de um tema. NÃO faz a junta entre dois
  slides, que é do /mira-sequence. NÃO anima um slide avulso nem elege metáfora,
  que é do /mira-animator. NÃO estrutura história a partir de Story Bible e
  Audience Journey, que é do /mira-direct-slide-sequence.
---

# Skill: Plano-sequência, uma explicação inteira em um movimento só

O autor diz o que quer explicar. Você devolve uma **corrente**: uma cena que se transforma do começo ao fim, cortada em slides que o espectador lê como uma animação única.

A ferramenta da junta é o `/mira-sequence`. Este agente é o que decide **quantas juntas, entre o quê, e com qual elenco**, o que o `/mira-sequence` não tem como saber, porque ele enxerga um par por vez.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Todo texto visível em português brasileiro com acentuação correta. Proibido travessão: use vírgula ou dois-pontos.

## Leia o contrato da junta antes de escrever qualquer elo

Abra `agents/mira-sequence/SKILL.md` inteiro. **Este arquivo não repete o contrato de propósito.** O barramento de pose, o corte seco, o plano B, as três armadilhas nomeadas e os treze portões vivem lá, e estão em evolução. Copiar o contrato para cá garante divergência na primeira vez que a junta mudar.

Você referencia. Nunca duplica.

Se `agents/mira-sequence/SKILL.md` não existir no projeto onde você está rodando, procure a skill instalada (`.claude/skills/mira-sequence/SKILL.md`). Não achando nenhuma das duas, **pare e diga**. Sem o contrato da junta este agente não tem ferramenta, e improvisar as regras de memória é exatamente o defeito que a referência existe para evitar.

## Não sou eu

- **Uma junta entre dois slides** é do `/mira-sequence`. Se o autor tem um slide e quer o seguinte continuando dali, é ele, direto, sem roteiro.
- **Um slide avulso animado**, e a escolha da metáfora, são do `/mira-animator`. Este agente chama o animator para a cena 1 e não elege metáfora nenhuma sozinho.
- **História a partir de Story Bible e Audience Journey** é do `/mira-direct-slide-sequence`. Ele é camada narrativa a montante e não produz continuidade de pose.

## O que este agente faz, e o que não faz

**Faz:** o **arco**. Divide a explicação em cenas, declara quem atravessa cada corte, declara onde cada cena repousa, e executa a construção na ordem.

**Não faz:** a junta, nem a metáfora, nem HTML escrito à mão. Cada elo passa pela skill dona daquele trabalho.

**Nunca faz:** entregar uma corrente quando a explicação pedia slides comuns. O teste de forma tem poder de recusa, e recusar é uma entrega válida.

## Entradas

Duas portas, e só duas.

1. **Corrente nova.** O autor descreve o que quer explicar. O deck é apontado por ele, ou nasce pelo caminho canônico `npx mira-animator new <slug> --deck=mira-default --theme=<tema>`.
2. **Corrente enxertada.** O autor aponta um deck, um slide existente que vira a cena 1, e o que acontece depois. A cena 1 não é recriada: o elenco e a pose de repouso dela são lidos do código que já está lá.

Deck ou slide apontado e ausente é **falha**, com o caminho absoluto conferido. Nunca vire deck inventado.

## Passo 1, o teste de forma

Antes de escrever qualquer arquivo. Três perguntas, e a primeira resposta "não" encerra:

1. **Existe pelo menos um ator em cena do primeiro ao último quadro?** Se todo mundo é substituído no caminho, não é um plano, são planos.
2. **A escala e o ponto de vista se mantêm?** Ir do átomo para o planeta é corte, não continuação. Corrente não faz corte.
3. **O que muda entre as cenas é o comportamento do mesmo elenco, ou é o elenco inteiro?** Se é o elenco inteiro, cada cena é uma cena nova.

Reprovado, **recuse**: diga em uma frase o que troca no meio, aponte o `/mira-animator` mais deck comum, e **não escreva arquivo nenhum**. Corrente forçada em explicação que troca de cena fica pior que slides normais, e o autor só descobre isso na hora da fala.

Aprovado, registre o veredito e o porquê. Ele vai no roteiro, sempre, mesmo aprovando.

**Quantas cenas.** De 3 a 6. Teto duro de 8. Explicação que caberia em 2 cenas não é corrente: encaminhe ao `/mira-sequence` direto. Explicação que pediria dez cenas é cortada para 6, com o que ficou de fora dito em uma frase e uma segunda corrente sugerida.

## Passo 2, o roteiro de continuidade

O formato está em `references/roteiro-gabarito.md`. Copie a estrutura inteira. O roteiro é persistido em `references/sequence-director-<id>.md` na pasta do deck, **antes** do primeiro elo existir.

Não é `roteiro.md` na raiz. Esse nome já é do `/mira-studio`, e a raiz de um deck é fechada pela diretiva do `CLAUDE.md`.

Sete campos por cena, e nenhum é enfeite:

| Campo | Por que existe |
|---|---|
| **id do par** | Curto, minúsculo, único no deck. Confira contra os `data-mira-seq` já presentes: uma segunda corrente no mesmo deck colide |
| **elenco herdado** | Define quem **não pode ter entrada nenhuma** naquele elo. Sem fade, sem stagger, sem escala 0, sem `data-aos` |
| **elenco que entra** | Define quem pode entrar coreografado, porque é novo em cena e não veio do corte |
| **elenco que sai** | Quem sai, sai **dentro** da cena, antes do repouso. Ator sumindo no corte é o defeito mais visível que uma corrente tem |
| **ação** | Uma frase. O que acontece nessa cena |
| **pose de repouso** | Escrita com a mesma expressão que a cena usa, nunca número mágico. É ela que o elo seguinte copia para o `poseEntrega(F)` dele |
| **o que muda na seguinte** | Uma frase. É literalmente a única entrada que o `/mira-sequence` declara não conseguir deduzir sozinho |

Mais três decisões globais, uma vez para a corrente inteira:

- **Metáfora única.** Uma frase. Eleita pelo `/mira-animator` na cena 1 e herdada por todos os elos. Nenhum elo troca.
- **Orçamento de elenco.** O elenco não cresce em todas as cenas. Se ninguém sai nunca, a cena final fica carregada, e isso tem que estar escrito no roteiro em vez de ser descoberto no fim.
- **Política de título.** O padrão é **título constante em toda a corrente**, e a razão é do contrato herdado: título trocando é a única coisa que o espectador enxerga no corte. Quando o autor quiser legenda por etapa, a saída não é trocar o título, é um **rótulo de etapa dentro do palco**, tratado como qualquer ator herdado: ele atravessa o corte, entra na pose e é animado pela própria corrente. Se ainda assim o autor quiser título por cena, avise que cada troca aparece, mantenha o mesmo número de linhas, e registre a escolha.

Apresente o roteiro ao autor e **siga para a construção**, sem esperar aprovação. Quem quiser revisar antes pede "só o roteiro", e aí o fluxo termina aqui.

## Passo 3, o laço serial

Um elo por vez, na ordem. **Nunca em paralelo**, e a razão não é preferência: o `poseEntrega(F)` do elo N+1 tem que ser escrito com a mesma expressão do repouso do elo N, o que é uma dependência de código-fonte. Para escrever o elo N+1 é preciso **ler o elo N já escrito**. Fan-out do tipo `/mira-fast` não se aplica aqui.

```
cena 1   -> /mira-animator  (ou o slide existente, na corrente enxertada)
cena 2   -> /mira-sequence, recebendo a ação e a pose de repouso da cena 1
cena 3   -> /mira-sequence, recebendo a ação e a pose de repouso da cena 2
...
cena N   -> /mira-sequence
```

A cada elo:

1. **Leia o código do elo anterior.** Não o roteiro: o código. A expressão do repouso sai de lá.
2. Chame o `/mira-sequence` com a ação da cena e o que muda, do roteiro.
3. **Confira os portões daquele par**, os treze do contrato da junta.
4. **Reporte:** qual elo, qual id de par, quem atravessou, qual pose foi entregue, quais portões passaram.

Falha em um elo **para ali**. Reporte o que faltou. Os elos anteriores ficam preservados e válidos, e a retomada acha o último elo pelos `data-mira-seq` presentes no deck.

**Quando o roteiro declarar alteração na cena 1** (origem existente sem compasso de repouso), anuncie antes de aplicar. Modificação de slide pré-existente nunca é silenciosa.

## O que é do deck, e não do par

Duas coisas são instaladas **uma vez** e depois apenas **verificadas**. Reinstalar a cada elo duplica o barramento e é a forma mais fácil de quebrar o deck.

- **O barramento de pose.** Um bloco `@MIRA:SEQ:BUS` por deck. No elo seguinte, confira que existe e siga.
- **A guarda de corte seco.** Procure por `scrollIntoView`, não por `function ir`. Um deck real tem mais de um caminho: teclado, botão flutuante, barra de progresso, controle remoto. **Liste os caminhos encontrados no relatório** e aplique em todos. Guarda aplicada só no teclado deixa o botão rolando suave, e o defeito só aparece na palestra.

A guarda é **sempre condicional ao par**. Se em algum ponto do patch você escreveu o comportamento novo sem o par decidindo, você mudou o deck inteiro. A transição de todo slide fora da corrente sai idêntica à de antes, incluindo `data-aos`, dissolve e o `scroll-behavior` do CSS.

Antes de entregar, passe os slides fora da corrente, um a um, e confirme.

## Portões de entrega

- [ ] Teste de forma aplicado, veredito e justificativa escritos no roteiro.
- [ ] Corrente entre 3 e 6 cenas, nunca acima de 8.
- [ ] `references/sequence-director-<id>.md` persistido antes do primeiro elo.
- [ ] Sete campos preenchidos em todas as cenas, sem campo vazio.
- [ ] Ids de par únicos, conferidos contra os `data-mira-seq` do deck.
- [ ] Metáfora única declarada uma vez e citada por todos os elos.
- [ ] Elenco com entradas e saídas declaradas; ninguém desaparece no corte.
- [ ] Poses de repouso escritas em expressão, nunca em número mágico.
- [ ] Construção serial, cada elo escrito depois de ler o código do anterior.
- [ ] Os treze portões do `/mira-sequence` conferidos em **cada** par, não só no último.
- [ ] Barramento presente uma vez só no deck.
- [ ] Guarda de corte seco em todos os caminhos de `scrollIntoView`, com a lista no relatório.
- [ ] Transição global intacta: slides fora da corrente conferidos um a um.
- [ ] Deck não reordenado; a corrente nasce logo depois da cena 1.
- [ ] Relatório por elo entregue durante a construção, e checklist agregado no fim.

## Limites conhecidos, diga na entrega

- **Título constante custa a legenda de etapa.** É o padrão porque o contrato da junta manda, não porque é ideal. Ofereça o rótulo de etapa dentro do palco quando a explicação tiver etapas nomeadas.
- **O plano B escala com a corrente.** Numa corrente de 6, são 5 funções `poseEntrega(F)` para manter em sincronia com 5 origens. É por isso que existe teto, e é por isso que o elenco deve encolher em vez de crescer.
- **A roda do mouse ignora o corte seco.** A rolagem é do espectador, não do deck. Vale para toda corrente, herdado do `/mira-sequence`.
- **Corrente em modo cinema:** se a cena usa `MiraCinema`, a câmera faz parte da pose. Ou ela entra no roteiro como campo próprio, ou as cenas ficam todas na mesma posição de câmera. Senão o corte ganha zoom.
- **A verificação final é do autor.** Passar a corrente com a seta e procurar o corte é olho humano. Diga o que ele deve procurar: ator que pula, pisca ou muda de tamanho na passagem.

## Referências

- `agents/mira-sequence/SKILL.md`, o contrato da junta. Leitura obrigatória.
- `agents/mira-sequence/references/exemplo-bola.html`, deck real que abre em `file://` e mostra o contrato funcionando. Abra antes de escrever a primeira corrente.
- `references/roteiro-gabarito.md`, o formato do roteiro de continuidade.
