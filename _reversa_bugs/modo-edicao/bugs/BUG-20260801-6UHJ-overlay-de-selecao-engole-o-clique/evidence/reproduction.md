# Cápsula de reprodução · BUG-20260801-6UHJ

## Ambiente

| item | valor |
|---|---|
| commit base | `7d66ae70fbc1764ec29de28cf1d27a190a94f981` (tag 0.1.52) |
| branch | `main` |
| OS | Linux 5.15.167.4-microsoft-standard-WSL2 |
| runtime | Node v24.15.0 |
| navegador | Chromium do puppeteer 25.3.0, headless, viewport 1366x768 |
| servidor | `node lib/mira-serve.js <deck> 5200` |
| deck | `decks/teste-mira-default` (cópia em diretório temporário) |

## Comando

```bash
node lib/mira-serve.js /tmp/.../deck-real 5200 &
node evidence/repro-overlay.mjs
```

Exit code: `0` (o script não falha; ele imprime a medição).

## Medição

Passos: `E` → clicar no `<h1>` da capa (seleciona) → clicar no `<span class="accent">` que está
**dentro** desse `<h1>`.

Saída relevante, uma linha por execução:

```text
p1 (SPAN 427x79): { selecionou: false, quemRecebeuOClique: 'DIV.mef-body' }
```

- Tentativas: 10
- Falhas: 10
- Taxa: **10/10**
- Classificação: `deterministic`

A execução acima foi repetida DEPOIS da observação do relator de que "agora parece estar
funcionando" (ver `../../../intake/relato-20260801-2156.md`), e o resultado não mudou: o defeito
descrito neste bug não é intermitente. O que pode ser intermitente é o sintoma completo relatado
pelo usuário, que inclui a associação com o ato de salvar. Essa parte segue como pergunta aberta.

## Controle negativo (o que NÃO reproduz)

`evidence/repro-ciclo-salvar.mjs`, ciclo `mover → salvar → redimensionar → salvar → recortar →
salvar → outro elemento → salvar`, em 5 decks (`demo-tecnica`, `pitch-projeto`,
`mira-studio-demo`, `mira-studio-full-demo`, `teste-mira-default`): completou em todas as rodadas,
com o botão Salvar reativando e a contagem subindo. Nenhuma falha.

Conclusão do controle: o ato de salvar não é a causa. A correção deste bug precisa ser validada
contra o sintoma do usuário separadamente, não presumida.

## Assinatura do defeito, em uma linha

`document.elementFromPoint(centro do elemento alvo)` devolve `DIV.mef-body` em vez do elemento de
conteúdo, e `onDocDown` sai em `if (isChrome(e.target)) return;` sem chamar `select()`.
