---
name: mira-slide-to-video
description: >-
  Gera um .mp4 de um ou mais slides de um deck do Mira gravando a animação real
  (Chrome headless + ffmpeg): cada slide dispara do zero, sem vazar o anterior,
  preenchendo o frame. Recebe quais slides (um, vários ou todos) e a resolução
  (16:9, 9:16, 1:1), encadeia com transição (4 segundos por slide, alterável),
  toca animações finitas como o chart-race por inteiro e nunca toca no deck
  original. Use SEMPRE que o usuário disser /mira-slide-to-video, gerar
  vídeo do slide, transformar slide em vídeo, exportar slide como mp4, gravar a
  animação do slide, vídeo do deck, quero um mp4 do slide, renderizar o slide em
  vídeo, ou fazer um Reels/Short a partir do slide.
---

# Skill: Slide (ou slides) do Mira em vídeo .mp4

Grava a animação real de um ou mais slides de um deck e entrega um único `.mp4`. Casos típicos: exportar um slide para Reels/Shorts, gerar um teaser do deck, mandar um trecho animado por WhatsApp.

Abre o deck no Chrome headless, grava cada slide pedido em tempo real (animação do zero, sem vazar o slide anterior, preenchendo o frame) e junta os clipes num vídeo com transição entre eles.

## Regra de Ouro: nunca toca no deck original

Grava a partir do `index.html` (ou de um `index-9x16.html` etc.) sem editar nada. A saída `.mp4` vai para a pasta do deck (ou o caminho que o usuário pedir).

## Modelo de tempo (o "4 segundos")

- **`--seconds N` (padrão 4):** quanto tempo CADA slide fica no vídeo. Esse é o 4s padrão, alterável.
- **`--durations 2:17,5:8`:** override por slide. **Slides com animação finita (chart-race, que toca uma vez e para) devem receber aqui a duração total da animação**, senão o vídeo corta no meio. Para chart-race, leia o `durationMs` (linhas) ou `stepMs x (nperiodos-1)` (barras) no JS do slide e use esse valor (some ~1s de folga para segurar o quadro final).
- **`--transition D` (padrão 0.6):** crossfade entre um slide e o próximo. Para uma transição longa de 4s, use `--transition 4`.

Regra prática: slide de **loop contínuo** = 4s (ou o valor pedido); slide de **animação finita** = duração total da animação (via `--durations`).

## Dependências (instalar sob demanda, padrão Mira)

Precisa de **ffmpeg** no PATH (ou em `MIRA_FFMPEG`) e dos pacotes **puppeteer** + **puppeteer-screen-recorder**. Não são dependência do Mira: instale numa pasta temporária reaproveitável (como o `mira-qrcode` faz com o `qrcode`) e rode os scripts com `NODE_PATH` apontando para o `node_modules` dela.

1. **Conferir ffmpeg:** `ffmpeg -version`. Se não houver, avise o usuário (Windows: baixar em gyan.dev e pôr no PATH, ou setar `MIRA_FFMPEG`). Sem ffmpeg a skill não roda.
2. **Instalar os pacotes uma vez** (pule se `node_modules/puppeteer-screen-recorder` ja existir na pasta temp):
   ```
   npm install puppeteer puppeteer-screen-recorder --no-save --prefix "<pasta-temp>"
   ```
   (ex. de pasta-temp: `%TEMP%/mira-s2v` no Windows.) O `puppeteer` baixa um Chromium próprio; se preferir usar o Chrome já instalado, sete `MIRA_CHROME` para o `chrome.exe` (o script já tenta locais comuns no Windows sozinho).
3. **Rodar com NODE_PATH** para a pasta temp:
   ```
   NODE_PATH="<pasta-temp>/node_modules" node "<skill>/scripts/build-video.cjs" <deck.html> <saida.mp4> [flags]
   ```
   No Windows/PowerShell: `$env:NODE_PATH="<pasta-temp>\node_modules"; node ...`.

## Enquadramento e preenchimento

- **16:9 (padrão):** `--width 1920 --height 1080`. O script mede a caixa do conteúdo do slide e dá um `scale` (`--fill`, padrão 0.92) para preencher o frame sem distorcer. Sobra faixa lateral quando o conteúdo é mais estreito que 16:9 (inerente, mantém a proporção).
- **9:16 / 1:1:** para um vertical/quadrado que preenche de verdade, grave a partir do **deck já adaptado ao formato** (`index-9x16.html` do `mira-vertical`, `index-1x1.html` do `mira-squared`) com `--width 1080 --height 1920` (ou `1080 1080`) e `--fill 0` (o deck já preenche). Gravar o 16:9 direto num quadro 9:16 deixa o conteúdo como uma faixa fina no meio.
- **Deck de cena única (sem `body > section`):** decks que são UMA cena full-screen (ex.: a cena de digitação do `mira-animated-typing`, com `.mira-frame` no lugar de `<section>`) não tem slides. A skill detecta isso (0 seções), grava a **página inteira** como um único clipe e, para um t=0 limpo, limpa a tela e carrega o deck do zero já gravando. Passe `--seconds` cobrindo a duração total da cena. Para **1:1 sem cinza**, grave o `index-1x1.html` com `--width 1080 --height 1080`: o quadro do deck (lado `100vh`) preenche o frame quadrado e as laterais cinza nem aparecem. O `--slides` é ignorado nesse caso.

## Passos

1. **Descobrir o alvo.** Qual deck (ache o `index.html` em `decks/<deck>/`; se houver vários e o usuário não disser, pergunte) e quais slides (um, lista `2,3`, ou todos). Qual formato (16:9 padrão, 9:16, 1:1). Se pedir 9:16/1:1, confirme se existe o deck adaptado do formato; se não, ofereça rodar antes o `mira-vertical`/`mira-squared`.
2. **Definir as durações.** Para cada slide alvo: loop contínuo usa `--seconds` (4 padrão); animação finita (chart-race) recebe a duração total via `--durations` (leia `durationMs`/`stepMs` no JS do slide). Confirme a transição (`--transition`, 0.6 padrão; ou o que o usuário pedir).
3. **Garantir dependências** (seção acima): ffmpeg + instalar puppeteer/recorder na pasta temp.
4. **Rodar o `build-video.cjs`** com as flags. Ele grava cada slide (animação do zero, sem vazamento) e junta com crossfade.
5. **Conferir o resultado.** Extraia 2-3 frames com ffmpeg (início, meio, fim) e verifique: (a) o t=0 é o slide certo, sem vazar o anterior; (b) a animação roda inteira; (c) o enquadramento preenche o frame; (d) as transições entre slides estão suaves.
6. **Reportar.** Caminho do `.mp4`, resolução/duração, quais slides e com que duração cada um, e que o deck original ficou intacto.

## Exemplos

```
# um slide, 16:9, animacao finita de ~16s (chart-race no slide 2):
node build-video.cjs decks/meu/index.html decks/meu/slide-2.mp4 --slides 2 --durations 2:17

# tres slides de loop, 4s cada, transicao de 0.6s:
node build-video.cjs decks/meu/index.html decks/meu/teaser.mp4 --slides 1,3,4

# vertical (deck ja reflowado pelo mira-vertical):
node build-video.cjs decks/meu/index-9x16.html decks/meu/reels.mp4 --slides 2 --durations 2:17 --width 1080 --height 1920 --fill 0
```

## Edge cases

- **Sem ffmpeg:** aborte com mensagem clara (é obrigatório). Não tente gerar só frames.
- **Slide finito cortado:** se o vídeo termina antes da animação acabar, a duração daquele slide ficou curta; aumente via `--durations`.
- **9:16 com faixa fina no meio:** foi gravado o 16:9 direto; grave o `index-9x16.html` com `--fill 0`.
- **Transição maior que o clipe:** o script reduz o crossfade automaticamente e avisa.
- **Chart-race que ainda não entrou na viewport:** o script já resolve, faz shim do IntersectionObserver e dispara a animação no início da gravação.
- **Deck sem `body > section` (cena full-screen):** a skill grava a página inteira como clipe único, recarregando o deck no início da gravação (t=0 limpo). Ajuste `--seconds` para a duração da cena; `--slides` não se aplica. Para 1:1 sem cinza, grave o `index-1x1.html` em `1080x1080`.

## Checklist

- [ ] Deck original intacto (a skill só lê o HTML, nunca edita).
- [ ] `.mp4` gerado na pasta do deck (ou caminho pedido), na resolução certa.
- [ ] Cada slide expressa exatamente o slide: t=0 correto (sem vazar o anterior), animação inteira, enquadramento preenchendo o frame.
- [ ] Slides de animação finita (chart-race) com duração total via `--durations` (não cortados).
- [ ] Transição entre slides aplicada (padrão 4s de tempo por slide; crossfade `--transition`).
- [ ] ffmpeg presente; puppeteer + puppeteer-screen-recorder instalados na pasta temp; rodou com `NODE_PATH`.
- [ ] Nenhum travessão (—); acentuação correta (segue `agents/_shared/idioma.md`).
