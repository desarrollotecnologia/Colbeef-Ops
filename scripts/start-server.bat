@echo off
title Colbeef-Ops - Iniciar servidor (produccion)
setlocal

cd /d "%~dp0\.."
set "ROOT=%cd%"

if not exist "%ROOT%\backend\.env" (
    echo ERROR: No existe backend\.env
    echo Configure la base de datos antes de iniciar.
    exit /b 1
)

if not exist "%ROOT%\backend\dist\index.js" (
    echo ERROR: Backend no compilado. Ejecute update.bat primero.
    exit /b 1
)

if not exist "%ROOT%\frontend\dist\index.html" (
    echo ERROR: Frontend no compilado. Ejecute update.bat primero.
    exit /b 1
)

echo Deteniendo servidor anterior si existe...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8081 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo Iniciando Colbeef-Ops en modo produccion...
start "Colbeef-Ops Servidor" /min "%~dp0run-server-bg.bat"

timeout /t 4 /nobreak >nul

set "SERVER_OK=0"
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8081 " ^| findstr "LISTENING"') do set "SERVER_OK=1"
if "%SERVER_OK%"=="0" (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do set "SERVER_OK=1"
)

if "%SERVER_OK%"=="1" (
    echo Servidor activo.
    exit /b 0
)

echo ADVERTENCIA: El servidor no respondio en el puerto esperado.
echo Revise la ventana "Colbeef-Ops Servidor" o backend\.env ^(PORT^).
exit /b 1
