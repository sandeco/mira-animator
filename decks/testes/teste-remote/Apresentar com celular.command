#!/bin/bash
# Mira remote: sobe o servidor local e abre o deck no navegador (RF-01).
# macOS: duplo clique no Finder. Linux: execute ou rode ./Apresentar\ com\ celular.command
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  O Node.js não foi encontrado neste computador."
  echo "  Baixe e instale em: https://nodejs.org"
  echo "  (Sem o Node, o deck continua funcionando: abra o index.html direto.)"
  echo
  read -n 1 -s -r -p "  Pressione qualquer tecla para fechar..."
  exit 1
fi

node "./mira-remote-server.cjs"
echo
read -n 1 -s -r -p "  O servidor parou. Pressione qualquer tecla para fechar..."
