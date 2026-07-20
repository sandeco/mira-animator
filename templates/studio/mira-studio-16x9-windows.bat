@echo off
rem Mira Studio 16:9: launcher do deck full-hd 16:9 (index-16x9.html, regra
rem dos tercos com camera no terco direito).
rem O Node fica em primeiro plano e abre o Chrome somente depois de listen().
rem Fechar o Chrome nao derruba o servidor por engano; Ctrl+C encerra.
rem Mensagens sem acento de proposito: o console do Windows pode nao usar UTF-8.
setlocal
title Mira Studio 16:9
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :semnode
if not exist "%~dp0mira\mira-studio-server.cjs" goto :semservidor

echo.
echo   Subindo o Mira Studio 16:9...
echo   O Chrome abrira somente depois que o servidor estiver pronto.
echo   Esta janela mantem o servidor vivo. Pressione Ctrl+C para encerrar.
echo.
set "MIRA_STUDIO_PAGE=/index-16x9.html"
set "MIRA_STUDIO_FULLSCREEN=1"
node "%~dp0mira\mira-studio-server.cjs"
set "MIRA_EXIT=%ERRORLEVEL%"

echo.
echo   O servidor parou.
if not "%MIRA_EXIT%"=="0" echo   Consulte o log em: %~dp0mira\mira-studio.log
pause
exit /b %MIRA_EXIT%

:semnode
echo.
echo   Node.js nao encontrado. Instale Node.js 18.20.2 ou superior e tente novamente.
echo   O Chrome nao sera aberto porque o servidor local nao pode iniciar.
echo   Download: https://nodejs.org/
echo.
pause
exit /b 1

:semservidor
echo.
echo   mira\mira-studio-server.cjs nao encontrado.
echo   Atualize os templates do Mira antes de tentar novamente.
echo.
pause
exit /b 1
