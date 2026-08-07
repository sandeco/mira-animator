@echo off
rem ============================================================
rem  __MIRA_DECK__
rem  Sobe um servidor local na pasta do deck e abre o navegador.
rem
rem  Duplo clique neste arquivo. Para parar, feche a janela.
rem
rem  POR QUE ELE EXISTE: o modo camera (tecla C) grava os cues no
rem  proprio index.html com Ctrl+S. Em http://localhost isso e
rem  direto. Em file:// depende do seletor de arquivo do Chrome,
rem  pede permissao toda sessao e nao funciona em outro navegador.
rem  Para APRESENTAR, o duplo clique no index.html continua valendo.
rem ============================================================

setlocal
cd /d "%~dp0"

set "PORT=8080"
set "SRV="

rem --- acha o servidor: Python, o launcher py, ou o Node ---
where python >nul 2>nul
if not errorlevel 1 set "SRV=python -m http.server %PORT%"
if defined SRV goto :achou

where py >nul 2>nul
if not errorlevel 1 set "SRV=py -3 -m http.server %PORT%"
if defined SRV goto :achou

where npx >nul 2>nul
if not errorlevel 1 set "SRV=npx --yes serve -l %PORT% ."
if defined SRV goto :achou

echo.
echo   Nao achei Python nem Node no PATH.
echo   Instale um dos dois e rode este arquivo de novo.
echo.
pause
exit /b 1

:achou
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
%SRV%

rem Se o servidor cair na hora (porta 8080 ocupada, por exemplo), a
rem janela nao some sem mostrar o motivo.
if errorlevel 1 pause
endlocal
