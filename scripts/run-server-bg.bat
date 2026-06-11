@echo off
title Colbeef-Ops Servidor
cd /d "%~dp0..\backend"
set NODE_ENV=production
node dist\index.js
echo.
echo El servidor se detuvo. Revise errores arriba.
pause
