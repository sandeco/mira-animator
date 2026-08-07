---
name: mira-cine-animator
description: >-
  Irmão cinematográfico do /mira-animator, para o slide em que o cinema É a cena e não o tempero.
  Herda o método inteiro do /mira-animator por referência, e inverte duas travas: um recurso de
  cinema pode ser a mudança de estado dominante, e a nota de corte é avaliada com o cinema ligado.
  Usar quando o autor pedir explicitamente cena cinematográfica, atmosfera, profundidade ou câmera
  como protagonista, e o deck tiver o mira-cinema.js instalado. Não usar por padrão: slide comum é
  do /mira-animator, e escolher errado troca clareza por espetáculo. NÃO usar em deck sem
  mira-cinema.js, onde não existe câmera, plano nem grade para serem a cena.
---

# MIRA Cine Animator

## Este arquivo não é uma cópia do `/mira-animator`

**Leia `agents/mira-animator/SKILL.md` inteiro primeiro. Ele é o método.** Este arquivo só declara
onde o irmão diverge, e é curto de propósito.

Copiar o método aqui seria garantir que os dois divergissem no primeiro ajuste: uma correção feita
num arquivo não chegaria no outro, e em três meses um estaria pior sem ninguém saber qual. **A
herança é por referência, não por cópia**, e é isso que dá mecanismo à regra de paridade em vez de
deixá-la como boa intenção escrita em dois lugares.

Consequência prática: recurso novo do `/mira-animator` chega aqui **sozinho**, porque aqui não há
cópia para atualizar. O que precisa de decisão humana é só o que colide com as inversões abaixo.

**Se o `/mira-animator` não estiver instalado, pare e diga.** Sem ele este agente não tem método,
só duas exceções soltas.

## As duas inversões, e nada mais

| | `/mira-animator` | `/mira-cine-animator` |
|---|---|---|
| Recurso de cinema pode ser a mudança de estado dominante? | **Não.** Se ao desligar câmera, luz, grade e atmosfera a cena deixa de contar a história, a história não existia | **Sim.** O cinema pode ser a cena |
| A nota de corte 85 é avaliada com o cinema... | **desligado** | **ligado** |

Tudo o mais é idêntico: o método de metáfora, os seis eixos de diferenciação, a rubrica, os vetos, o
esqueleto do deck, o PRNG semeado, a Regra Zero, os dois relógios, a proibição de travessão, a cor da
marca, `file://` e offline.

## O que a inversão NÃO libera

A inversão é sobre **doutrina**, não sobre engenharia. Continua valendo tudo que existe por medição
ou por custo:

- **Filtro de tela cheia animado continua proibido.** Vinheta, grão e grade são estáticos. Isso não é
  doutrina de gosto, é o deck aguentar captura de vídeo em taxa fixa;
- **De 3 a 5 planos, nunca mais.** Raio de desfoque no máximo 4;
- **Teto de cues por cena pelo temperamento**, e `razao` obrigatória em cada um;
- **`file://`, offline, sem build.** O deck abre com duplo clique;
- **Nenhum renderizador novo.** Nada de PixiJS, Three.js, Lottie ou Rive no palco.

E o que ainda espera medição:

- **Atmosfera em SVG é livre** (poeira, brasa, faísca, névoa por formas e gradientes). Já roda;
- **Atmosfera em `<canvas>` irmão do palco está PENDENTE** do teste E1 do gate da fase 0, que
  pergunta se o gravador captura esse canvas ou se ele sai buraco no vídeo. Enquanto E1 não tiver
  veredito, prescreva atmosfera em SVG. Se a cena exigir canvas, **descreva a intenção e marque como
  pendente**, sem escrever a chamada.

## O que muda na prática, e é pouco

Ao avaliar a cena pela rubrica, avalie **com o cinema ligado**. Uma cena cuja força vem da
profundidade, do movimento de câmera ou da atmosfera passa aqui, e essa é a única razão deste agente
existir.

O que **não** muda: a rubrica continua sendo a mesma, com os mesmos vetos. Cinema ligado não é
desconto de nota. Uma cena confusa com câmera bonita continua reprovada, e o veto de "não compete com
o conteúdo" continua valendo. A inversão permite que o cinema seja a cena; ela não permite que o
cinema **substitua** a cena.

Teste que separa os dois casos, e é a pergunta a se fazer antes de aprovar:

> Tirando o cinema, sobra menos história, ou sobra história nenhuma?

**Menos história** é o caso legítimo aqui: o cinema carregava peso dramático real. **História nenhuma**
continua reprovado nos dois agentes, porque aí não havia cena, havia efeito.

## Quando NÃO usar

- **Por padrão.** Slide comum é do `/mira-animator`. A escolha é do autor, explícita, no momento de
  gerar;
- **Deck sem `mira-cinema.js`.** Sem câmera, plano e grade não há o que inverter. Confira o arquivo
  antes de escrever uma linha;
- **Consertar um slide que já existe.** Continua sendo `/mira-animator`, a menos que o autor peça a
  versão cinematográfica de novo;
- **Quando o conteúdo é a estrela.** Tabela, número, citação e código pedem clareza. Cinema ali
  compete com a leitura, e o veto pega.

## Paridade com o irmão

Recurso novo do `/mira-animator` vale aqui **quando for viável**. Nem tudo cabe: as duas inversões
existem justamente porque há regra que não atravessa.

Como este arquivo não copia o método, a paridade acontece por herança, e o único trabalho manual é
verificar se o recurso novo colide com as inversões. Se colidir, registre a exceção **aqui**, nesta
seção, com o motivo. Exceção não registrada vira divergência silenciosa, que é o que mata irmão.
