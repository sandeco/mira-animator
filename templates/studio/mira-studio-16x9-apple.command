#!/bin/bash
# Mira Studio 16:9: launcher macOS/Linux do deck full-hd (index-16x9.html,
# regra dos terços com câmera no terço direito).
# macOS: duplo clique no Finder. Linux: execute ./mira-studio-16x9-apple.command
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  O Node.js não foi encontrado neste computador."
  echo "  Baixe e instale em: https://nodejs.org"
  echo "  (Sem o Node, abra o index-16x9.html direto; câmera e salvar exigem localhost.)"
  echo
  read -n 1 -s -r -p "  Pressione qualquer tecla para fechar..."
  exit 1
fi

if [ ! -f "./mira/mira-studio-server.cjs" ]; then
  echo
  echo "  mira/mira-studio-server.cjs não encontrado."
  echo "  Atualize os templates do Mira antes de tentar novamente."
  echo
  read -n 1 -s -r -p "  Pressione qualquer tecla para fechar..."
  exit 1
fi

echo
echo "  Subindo o Mira Studio 16:9..."
echo "  O navegador abrirá somente depois que o servidor estiver pronto."
echo "  Esta janela mantém o servidor vivo. Pressione Ctrl+C para encerrar."
echo

export MIRA_STUDIO_PAGE="/index-16x9.html"
export MIRA_STUDIO_FULLSCREEN=1
node "./mira/mira-studio-server.cjs"

echo
read -n 1 -s -r -p "  O servidor parou. Pressione qualquer tecla para fechar..."
