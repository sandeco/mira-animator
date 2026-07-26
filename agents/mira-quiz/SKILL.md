---
name: mira-quiz
description: >-
  Slide de QUIZ AO VIVO no Mira: a plateia escaneia um QR-code e responde uma
  múltipla escolha num Google Forms; o slide lê as respostas via Google Sheets
  gviz/JSONP. Diferente do mira-survey, tem resposta correta, revelação
  controlada pelo apresentador e percentuais que só aparecem após revelar. Use
  SEMPRE que o usuário disser /mira-quiz, quiz ao vivo, pergunta com resposta
  correta, revelar resposta, ranking do quiz, quiz com QR, quiz tipo Mentimeter,
  quiz tipo Slido, ou pedir um slide onde a plateia responde pelo celular e a
  resposta correta é revelada no palco. Para enquete sem resposta correta use
  /mira-survey; para QR simples use /mira-qrcode.
---

# Skill: Quiz ao vivo no slide

> **Fonte da verdade:** decisões congeladas em `BRAINSTORM_MIRA_QUIZ.md` (2026-06-30). O `/mira-quiz` reaproveita a arquitetura validada do `mira-survey`: Google Forms como interface, Google Sheets como fonte viva e leitura pelo endpoint `gviz` com JSONP para funcionar por `file://`.

## Modelo mental

O Mira não hospeda o jogo. Ele monta um slide que lê respostas já coletadas pelo Google Forms:

1. A plateia abre o **link de votação** pelo QR-code.
2. Cada envio cai na **planilha de respostas** vinculada ao Forms.
3. O slide lê a planilha a cada poucos segundos pelo `gviz`.
4. Antes da revelação, mostra pergunta, QR, alternativas e total de respostas.
5. Depois da revelação, marca a correta em verde e mostra contagem + percentual por alternativa.

## Dados obrigatórios

Confirme estes dados antes de gerar o slide. Se faltar qualquer item, pergunte e pare.

| Dado | Exemplo | Uso |
|---|---|---|
| Link de votação | `forms.gle/...` ou `docs.google.com/forms/...` | vira QR-code inline |
| Link da planilha | `docs.google.com/spreadsheets/d/<ID>/...` | fonte viva de respostas |
| Pergunta | `Qual destes é um modelo multimodal?` | título do quiz |
| Alternativas | `GPT-4o`, `Excel`, `Photoshop`, `PowerPoint` | cards de resposta |
| Correta | `GPT-4o` | destaque na revelação |
| Campo de nome | primeira coluna textual depois do timestamp, ou índice informado | ranking básico |

Texto sugerido se faltar algo:

> Para montar o quiz ao vivo eu preciso do link de votação do Google Forms, do link da planilha de respostas, da pergunta, das alternativas e da resposta correta. A planilha precisa estar pública como "qualquer pessoa com o link -> Leitor". Pode colar esses dados aqui?

## Formulário esperado

O Google Forms deve ter, no mínimo:

- Um campo de identificação (nome ou apelido).
- Uma pergunta de múltipla escolha com as mesmas alternativas do slide.

Na planilha, a skill assume (salvo se o usuário indicar outro cabeçalho):

- A última coluna é a resposta do quiz.
- A primeira coluna textual depois do timestamp é o nome/apelido.

Se a planilha tiver várias perguntas, avise que o slide usará a última coluna e peça confirmação.

## Verificação da planilha

Extraia o `SHEET_ID` do link da planilha com `/spreadsheets/d/<ID>/` e teste o mesmo endpoint que o slide usará:

```bash
curl -sL "https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json" | head -c 800
```

Se vier `google.visualization.Query.setResponse({...})` com `"status":"ok"`, a planilha está legível. Se vier HTML de login ou erro, peça para o usuário ajustar o compartilhamento para **qualquer pessoa com o link -> Leitor**.

**Nunca use "Publicar na web -> CSV".** Esse endpoint pode ficar cacheado por minutos. O quiz ao vivo usa só `gviz` + JSONP.

## QR-code local

O QR do link de votação é gerado localmente e embutido como SVG inline, igual ao `/mira-qrcode` e ao `/mira-survey`. Não use `npx qrcode`, API externa nem CDN.

1. Instale o pacote uma vez numa pasta temp reaproveitável, se ainda não existir:

```bash
npm install qrcode --no-save --prefix "<pasta-temp>"
```

2. Gere o SVG:

```bash
node -e "require('qrcode').toString('LINK_VOTACAO',{type:'svg',errorCorrectionLevel:'M',margin:0,color:{dark:'#0a0a0a',light:'#ffffff'}},(e,s)=>{if(e)throw e;process.stdout.write(s)})"
```

3. Cole o `<svg>` inteiro dentro de `.qr-card`, com o comentário:

```html
<!-- QR gerado localmente (pacote npm qrcode, ECC M) para LINK_VOTACAO -->
```

O link de votação não aparece por extenso no slide.

## Estados

O slide tem três estados:

- `votando`: mostra pergunta, alternativas neutras, QR-code, total de respostas e status ao vivo. Não mostra percentuais.
- `revelando`: pausa curta, cards respiram e incorretas reduzem brilho.
- `revelado`: correta em verde `#35D07F`, contagens e percentuais visíveis, barras proporcionais preenchidas.

Comandos:

- Botão discreto "Revelar".
- Tecla `R` para revelar.
- Tecla `K` para alternar ranking depois da revelação.
- Tecla `V` para voltar ao estado de votação durante testes.

## Direção visual

Padrão da v1: cards de alternativas com barras internas. Melhor formato para esconder porcentagens antes da revelação e destacar a correta depois.

- Fundo escuro Mira, laranja `#FF904D` como identidade.
- Correta em verde `#35D07F`, fundo translúcido e halo leve.
- Incorretas continuam legíveis, com menos destaque após revelar.
- Check discreto na correta.
- Barras aparecem só depois da revelação.
- Animação elegante, sem partículas e sem atrapalhar a leitura em projeção.
- A Regra Zero do Mira continua valendo (loop interno contínuo): a bolinha "ao vivo", o brilho do QR e a respiração leve dos cards mantêm o slide vivo.

## Template canônico

O template completo (HTML + CSS + JS, um arquivo standalone) está em
[`references/quiz-template.html`](references/quiz-template.html). Copie-o para
`decks/<nome-do-quiz>/index.html` e preencha apenas:

- `SHEET_ID`
- `QUESTION`
- `OPTIONS`
- `CORRECT`
- `ANSWER_HEADER`, se necessário
- `NAME_HEADER`, se necessário
- SVG inline do QR dentro de `.qr-card`

## Passos

1. **Confirmar dados obrigatórios.** Link de votação, link da planilha, pergunta, alternativas e resposta correta. Se faltar algo, peça e pare.
2. **Validar a correta.** A resposta correta precisa ser exatamente uma das alternativas, ignorando só caixa e acentos para conferência. No HTML, grave o texto canônico da alternativa.
3. **Extrair `SHEET_ID`** do link da planilha e verificar o `gviz`. Se a planilha não estiver pública, peça ajuste.
4. **Gerar QR localmente** com `qrcode` e embutir SVG inline. Nunca mostre o link por extenso no slide.
5. **Montar o slide** com o template canônico. Preencha `QUESTION`, `OPTIONS`, `CORRECT`, `SHEET_ID` e, se necessário, `ANSWER_HEADER` e `NAME_HEADER`.
6. **Salvar em `decks/<nome-do-quiz>/index.html`.**
7. **Reportar** o caminho do arquivo, os atalhos (`R`, `K`, `V`) e lembrar que o slide precisa de internet para ler a planilha, mas abre por duplo clique via `file://`.

## Checklist

- [ ] Usa QR code gerado localmente como SVG inline.
- [ ] Usa Google Forms como interface de resposta.
- [ ] Usa Google Sheets como fonte viva de dados.
- [ ] Lê a planilha via `gviz` + JSONP.
- [ ] Pergunta é de múltipla escolha.
- [ ] Resposta correta configurada explicitamente.
- [ ] Correta existe entre as alternativas.
- [ ] Porcentagens só aparecem depois da revelação.
- [ ] Revelação acionada por botão ou tecla `R`.
- [ ] Correta marcada em verde suave `#35D07F`, flat e legível.
- [ ] Animação de revelação tem suspense, destaque e barras animadas.
- [ ] Ranking básico por nome/apelido disponível por tecla `K`.
- [ ] Preserva a Regra Zero do Mira com loop interno contínuo.
- [ ] Link de votação não aparece por extenso no slide.
- [ ] Nenhum "Publicar na web -> CSV".
- [ ] Texto revisado, acentuação correta e sem travessão.
