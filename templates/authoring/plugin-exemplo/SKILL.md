---
name: autor-exemplo
description: >-
  Esqueleto de plugin do Mira, feito para ser copiado e reescrito. Troque o
  nome, a descricao e o corpo por um agente de verdade. O nome desta skill tem
  que ser igual ao id do mira-plugin.json e igual ao nome da pasta. Use SEMPRE
  que o usuario disser /autor-exemplo ou pedir o exemplo de plugin.
---

# Skill: plugin de exemplo

Este arquivo é o esqueleto de um plugin do Mira. Ele existe para ser copiado, não para ser usado.

## Três coisas que precisam bater

1. O nome da pasta em `mira-plugins/`.
2. O campo `id` do `mira-plugin.json`.
3. O campo `name` deste cabeçalho.

Se os três não forem idênticos, o Mira recusa o plugin com o código `ID_MISMATCH`.

## Regras do identificador

- Só minúsculas, dígitos e hífen.
- Pelo menos um hífen. A convenção é `<autor>-<nome>`.
- Não pode começar com `mira-`, que é reservado aos agentes nativos.

## O que pode entrar na pasta

- `SKILL.md`, obrigatório, este arquivo.
- `mira-plugin.json`, obrigatório, o manifesto.
- `references/`, opcional, material de apoio que o agente lê.
- `assets/`, opcional, imagens e arquivos que o agente usa.
- `README.md`, opcional, para quem receber o plugin.

## O que não pode

Arquivo executável de qualquer tipo (`.js`, `.sh`, `.bat`, `.ps1`, `.py` e afins). A primeira versão do sistema de plugins recusa por completo, porque o plugin é ativado sozinho no início da sessão e código de terceiro entrando sem barreira é risco que não se conserta depois.

## Como ativar

Coloque a pasta em `mira-plugins/` e inicie uma sessão nova, ou rode `npx mira-animator plugin sync` para não esperar.

## Como desinstalar

Apague a pasta. Na sincronização seguinte o Mira remove a cópia ativada sozinho.

## Corpo do agente

A partir daqui é o seu agente. Escreva as instruções como escreveria para uma pessoa que vai executar a tarefa pela primeira vez: o que fazer, em que ordem, o que verificar antes de dizer que terminou.
