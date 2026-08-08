@echo off
rem ============================================================
rem  __MIRA_DECK__
rem  Sobe o servidor de autoria do Mira nesta pasta e abre o navegador.
rem
rem  Duplo clique neste arquivo. Para parar, feche a janela.
rem
rem  POR QUE ELE EXISTE: o modo camera (tecla C) e a edicao (tecla E)
rem  gravam no proprio index.html com Ctrl+S, via POST /__mira_save.
rem  Esse endpoint so existe no servidor do Mira (mira\mira-serve.mjs).
rem  Um servidor estatico qualquer (python -m http.server) mostra o
rem  deck mas NAO grava: o Ctrl+S falha com "Failed to fetch".
rem  Para APRESENTAR, o duplo clique no index.html continua valendo.
rem ============================================================

setlocal
cd /d "%~dp0"

set "PORT=8080"

rem --- caminho certo: Node com o servidor do Mira (Ctrl+S grava) ---
where node >nul 2>nul
if errorlevel 1 goto :sem_node
if not exist "mira\mira-serve.mjs" goto :sem_node

echo.
echo   ============================================
echo    __MIRA_DECK__
echo   ============================================
echo.
echo    http://localhost:%PORT%/index.html
echo.
echo    Tecla C: modo camera.  Ctrl+S grava no arquivo.
echo    Para parar: feche esta janela ou Ctrl+C.
echo.

start "" "http://localhost:%PORT%/index.html"
node "mira\mira-serve.mjs" . %PORT%
if errorlevel 1 pause
exit /b 0

:sem_node
rem --- fallback estatico: mostra o deck, mas o Ctrl+S NAO grava ---
set "SRV="
where python >nul 2>nul
if not errorlevel 1 set "SRV=python -m http.server %PORT%"
if defined SRV goto :achou

where py >nul 2>nul
if not errorlevel 1 set "SRV=py -3 -m http.server %PORT%"
if defined SRV goto :achou

echo.
echo   Nao achei Node nem Python no PATH.
echo   Instale o Node (o Ctrl+S precisa dele) e rode este arquivo de novo.
echo.
pause
exit /b 1

:achou
echo.
echo   ============================================
echo    __MIRA_DECK__   (modo leitura)
echo   ============================================
echo.
echo    http://localhost:%PORT%/index.html
echo.
echo    AVISO: sem Node, o Ctrl+S do modo camera NAO grava no arquivo.
echo    Instale o Node e rode este bat de novo para salvar direto.
echo.

start "" "http://localhost:%PORT%/index.html"
%SRV%
if errorlevel 1 pause
endlocal
