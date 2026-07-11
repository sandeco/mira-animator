@echo off
rem Mira remote: sobe o servidor local e abre o deck no navegador (RF-01).
rem Mensagens sem acento de proposito: o console do Windows nao garante UTF-8.
title Mira remote - apresentar com o celular
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   O Node.js nao foi encontrado neste computador.
  echo   Baixe e instale em:  https://nodejs.org
  echo   Depois de instalar, de dois cliques neste atalho de novo.
  echo   ^(Sem o Node, o deck continua funcionando: abra o index.html direto.^)
  echo.
  pause
  exit /b 1
)

echo.
echo   Subindo o Mira remote...
echo   Se o Windows perguntar sobre o firewall, clique em PERMITIR
echo   ^(tambem quando a rede for publica ou hotspot^).
echo.
node "%~dp0mira-remote-server.cjs"

echo.
echo   O servidor parou.
pause
