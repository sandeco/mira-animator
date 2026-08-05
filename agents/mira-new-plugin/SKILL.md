---
name: mira-new-plugin
description: >-
  Cria um plugin do Mira, que é um agente novo feito pelo proprio usuario e que
  vive em mira-plugins/, fora do pacote do Mira. Orquestra o ciclo inteiro:
  confere se o Reversa esta instalado e instala se faltar, especifica com
  reversa-new, implementa com reversa-forward escrevendo dentro da pasta do
  plugin, valida o manifesto e ativa. Avisa que as specs ficam locais e nao
  viajam no pacote compartilhado. Use SEMPRE que o usuario disser
  /mira-new-plugin, criar plugin, novo plugin do Mira, quero fazer meu proprio
  agente, criar agente proprio, estender o Mira, plugin do Mira, ou pedir para
  empacotar e compartilhar um agente que ele mesmo escreveu.
---

# Skill: criar um plugin do Mira

Um plugin é um agente do Mira escrito pelo usuário. Mora em `mira-plugins/<id>/`, não entra no pacote do Mira, e é compartilhável.

> **Antes de tudo:** este skill orquestra o Reversa. Se o usuário só quer um SKILL.md rápido e improvisado, diga que ele pode escrever a pasta na mão seguindo `mira-templates/authoring/plugin-exemplo/` e pular este fluxo inteiro. Não empurre o processo completo para quem não pediu.

## Fase 0, preparo

### 0.1. Colete a ideia e derive o identificador

Pergunte, em uma pergunta só, o que o agente deve fazer. Com a resposta, proponha um identificador no formato `<autor>-<nome>` e confirme.

Regras do identificador, todas obrigatórias:

- Só minúsculas, dígitos e hífen, com pelo menos um hífen.
- **Não pode começar com `mira-`**, prefixo reservado aos agentes nativos.
- Não pode colidir com agente nativo nem com pasta já existente em `mira-plugins/`.

Confira as duas últimas listando `mira-plugins/` e lendo `agents` em `.mira/state.json`. Se colidir, proponha outro e siga.

### 0.2. Confira o Reversa

Procure os skills do Reversa nos diretórios de skills (`.claude/skills/reversa-new/`, `.agents/skills/reversa-new/`). Se não existirem:

> Para criar plugin eu preciso do Reversa nesta pasta. Ele não vem com o Mira.
> Vou rodar `npx reversa install` aqui. Isso cria `.reversa/` e mexe no seu
> `CLAUDE.md` e no `.gitignore`. Posso seguir?

Espere a resposta. **Sem "sim" explícito, encerre sem instalar nada.** Com "sim", rode e siga.

### 0.3. Crie a pasta

Copie `mira-templates/authoring/plugin-exemplo/` para `mira-plugins/<id>/` e ajuste `mira-plugin.json`: `id`, `name`, `author`, `description`. Deixe `version` em `0.1.0` e `tier` em `prompt-only`.

Ajuste também o campo `name` do cabeçalho do `SKILL.md` para o `id`. Os três precisam bater: nome da pasta, `id` do manifesto, `name` do cabeçalho.

### 0.4. Avise sobre as specs

Diga, com estas palavras ou equivalentes:

> As specs deste plugin ficam em `_reversa_sdd/` e `_reversa_forward/`, aqui na
> sua máquina. Elas não entram no pacote que você compartilha. Quem receber o
> plugin recebe ele funcionando, mas não consegue evoluí-lo com Reversa a partir
> das specs. Se apagar essas pastas, sobra só o SKILL.md.

## Fase 1, especificação

**Rode `/reversa-new` apenas se `_reversa_sdd/prd.md` ainda não existir.**

O motivo é mecânico: o `/reversa-new` grava `prd.md`, `ideation.md` e `personas.md` na raiz da área de saída, um conjunto por projeto e não por feature. Rodar de novo destruiria a especificação do plugin anterior.

- **Primeiro plugin do usuário:** rode `/reversa-new` em modo expresso. O brief é a oficina de plugins dele, não um plugin específico. Algo como "coleção de plugins do Mira de <nome>, agentes próprios que estendem o Mira".
- **Do segundo em diante:** pule esta fase inteira e vá direto para a fase 2. Diga ao usuário que o PRD da oficina já existe e que cada plugin entra como feature.

## Fase 2, implementação

Rode o ciclo forward, nesta ordem: `/reversa-requirements` → `/reversa-clarify` (só se sobrar dúvida) → `/reversa-plan` → `/reversa-to-do` → `/reversa-coding`.

O requirements descreve **este plugin**. O `actions.md` tem que mandar escrever dentro de `mira-plugins/<id>/`, e nada fora dela.

Restrições que precisam aparecer no requirements, porque o Mira as impõe na ativação:

1. O plugin é autocontido: nenhum arquivo dele mora fora da própria pasta.
2. **Nenhum arquivo executável** (`.js`, `.sh`, `.bat`, `.ps1`, `.py` e afins). A primeira versão do sistema de plugins recusa por completo, porque o plugin é ativado sozinho no início da sessão.
3. O agente é um `SKILL.md` só, com `references/` e `assets/` opcionais ao lado.

## Fase 3, ativar

1. Rode `npx mira-animator plugin validate <id>`.
2. Se reprovar, corrija o que o código de recusa apontar e valide de novo. Não siga com plugin reprovado.
3. Rode `npx mira-animator plugin sync`.
4. Diga que o comando aparece **na próxima sessão**, porque é quando o agente relê os skills.

## Depois

- **Evoluir:** `/mira-new-plugin editar <id>` entra direto na fase 2, sem refazer o PRD.
- **Compartilhar:** `npx mira-animator plugin pack <id>` gera o `.mplug`. Quem recebe roda `npx mira-animator plugin add <arquivo>`, ou simplesmente coloca a pasta em `mira-plugins/`.
- **Desinstalar:** apagar `mira-plugins/<id>/`. O Mira remove a cópia ativada sozinho na sincronização seguinte.

## Modo editar

Quando o usuário chamar `/mira-new-plugin editar <id>`:

1. Confirme que `mira-plugins/<id>/` existe. Se não existir, liste o que existe e pare.
2. Pule as fases 0 e 1 inteiras.
3. Entre na fase 2 pelo `/reversa-requirements`, descrevendo só o que muda.
4. Suba a `version` no `mira-plugin.json` ao terminar, senão o Mira não reativa a cópia.
5. Faça a fase 3.

## O que este skill nunca faz

- Não instala o Reversa sem confirmação explícita do usuário.
- Não escreve nada fora de `mira-plugins/<id>/`, exceto os artefatos que o próprio Reversa gera em `_reversa_sdd/` e `_reversa_forward/`.
- Não roda `/reversa-new` mais de uma vez no mesmo projeto.
- Não empacota nem publica nada sem o usuário pedir.
