---
name: mira-remote-control
description: >-
  Liga um deck do Mira a um segundo aparelho pela rede local: o notebook
  apresenta, o celular espelha, controla (avançar/voltar) e desenha (telestrator
  sincronizado). Sem app, sem login e sem internet — só a mesma rede ou o hotspot
  do celular; sem o atalho instalado, o deck segue 100% funcional em file://. Use
  SEMPRE que o usuário disser /mira-remote-control, apresentar com o celular, controlar
  pelo celular, controle remoto da apresentação, espelhar no celular, segunda tela,
  passar slide pelo celular, apresentar andando pela sala, QR para controlar o
  deck, ou pedir para o celular/tablet comandar ou acompanhar a apresentação.
---

# Skill: Apresentar com o celular (espelho + controle pela rede local)

Ativa num deck existente a camada do **mira-remote**: um servidor leve serve o deck pela LAN e sincroniza estado entre os aparelhos. O notebook é o palco; o primeiro celular que escanear o QR vira o controle (e caneta); os demais entram como espelho.

> **Fonte da verdade:** specs em `_reversa_sdd/remote-control/mira-remote.md` (produto) e `_reversa_sdd/remote-control/protocolo.md` (canal). Os arquivos prontos vivem em `mira-templates/remote/` (no repo fonte: `templates/remote/`). Não reescreva o servidor nem a shell: copie.

## Modelo mental

- **Sincroniza-se estado, não quadros.** O canal move `{slide, reveal}` e os traços do telestrator; a animação de cada slide (Regra Zero) roda local em cada tela. Na **mesa tática** também viaja o estado das peças/bola/setas/zonas/desenhos, além do painel de jogada e dos quadros gravados: o board expõe `window.miraTactics` e a shell publica em `/tactics` (contrato no servidor). O painel de jogada abre pelo botão 🎬 da barra (no celular não há tecla `R`).
- **Reprodução da jogada (▶ Play) viaja por COMANDO, não por posições a cada frame.** Durante o Play, o `getRemoteState` da mesa congela posições e `rec.next` e emite só um `play: { token, playing, from }`; cada aparelho roda a própria `playRec` local (fluido). Transmitir posições por frame serializava o estado ~8x/s competindo com o `requestAnimationFrame` e **engasgava o telão (PC)** — nunca voltar a esse modelo durante o Play.
- **Palco 16:9 fixo.** A shell roda o deck num iframe de exatamente 1280x720, escalado para caber em qualquer tela: a geometria do slide é idêntica no notebook e no celular, e os desenhos caem no mesmo lugar (viajam em coordenadas do palco).
- **Papéis por IP, sem login:** localhost = palco; primeiro IP externo = controle; demais = espelho (só acompanham; comandos deles são ignorados em silêncio).
- **Camada opcional.** Nada no `index.html` é alterado. Sem o atalho, o deck abre em `file://` como sempre (regressão zero).

## Passos (ativar num deck)

1. **Localize a pasta do deck** (a que tem o `index.html`). Se o usuário não disser qual, pergunte ou use o deck em que estão trabalhando.
2. **Copie de `mira-templates/remote/` para o deck** (fallback: `templates/remote/` do pacote mira-animator). Arquivos de apoio vão na subpasta `mira/`; só os launchers ficam na raiz do deck:
   - `mira/mira-remote-server.cjs` (servidor da sessão)
   - `mira/mira-remote.html` (shell de espelhamento)
   - `remote-control-windows.bat` na raiz (Windows)
   - `remote-control-apple.command` na raiz (macOS; serve também para Linux; rode `chmod +x` nele quando o sistema não for Windows)
3. **Atualize o `mira-draw.js` do deck** com a cópia de `mira-templates/authoring/mira-draw.js`, gravando em `mira/mira-draw.js`. A versão antiga não tem a API de sincronização (`miraDraw.onchange`/`setShapes`); sem ela o desenho não espelha. Ajuste (ou adicione antes do `</body>`) a tag `<script src="mira/mira-draw.js" defer></script>`. Se houver um `mira-draw.js` antigo na raiz do deck, remova-o.
4. **Confira o Node:** o servidor exige Node >= 18 na máquina que apresenta. Não instale nada: o launcher orienta o usuário se faltar.
5. **Se o deck usa CDN** (Tailwind, fontes), recomende rodar o `/mira-offline` antes: o celular busca os assets pelo servidor local, e CDN exigiria internet no celular.
6. **Reporte ao usuário:**
   - Como apresentar: duplo clique em `remote-control-windows.bat` (Windows) ou `remote-control-apple.command` (macOS/Linux); o deck abre com um QR no canto; escanear com o celular; o QR some e o celular controla.
   - Teclas no notebook: `C` mostra/esconde o QR de novo; `P` liga a caneta; setas navegam.
   - No celular: setas redondas nas pontas do rodapé (`←` à esquerda volta, `→` à direita avança), `✎` desenha, `⛶` tela cheia (no iPhone o botão não aparece; gire o aparelho).
   - Firewall do Windows: no primeiro uso, clicar em PERMITIR (inclusive em rede pública/hotspot).
   - Como reverter: apagar os 4 arquivos copiados devolve o deck ao `file://` puro.

## Solução de problemas (oriente sem mudar código)

| Sintoma | Causa provável | Saída |
|---|---|---|
| Celular não carrega a página | Firewall bloqueou o Node, ou hotspot com AP isolation | Permitir no firewall; digitar a URL mostrada sob o QR; trocar de rede |
| QR sumiu e outro aparelho precisa entrar | Comportamento normal (some na 1ª conexão) | Tecla `C` no notebook reabre o QR; quem entrar agora é espelho |
| Porta ocupada | Outra sessão na mesma máquina | O servidor pula sozinho para a porta seguinte (3000..3009) |
| Celular "reconectando" | Wi-Fi oscilou | O canal reconecta sozinho e volta sincronizado no slide atual |
| Slides dessincronizados após trocar de rede | O IP do notebook mudou | Reescanear o QR (ele é gerado na hora com o IP atual) |

## Checklist

- [ ] Servidor e shell em `mira/`; launchers `remote-control-windows.bat`/`remote-control-apple.command` na raiz do deck.
- [ ] `mira/mira-draw.js` na versão com API de sync (sem cópia antiga na raiz).
- [ ] `index.html` do deck INTACTO (a camada é opcional; nada injetado no arquivo).
- [ ] Usuário sabe: duplo clique + escanear; tecla `C`; firewall = PERMITIR.
- [ ] Deck com CDN: sugerido `/mira-offline` antes de apresentar.
- [ ] Texto em português correto, sem travessão.
