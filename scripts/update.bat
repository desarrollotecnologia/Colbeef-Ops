@echo off
title Colbeef-Ops - Actualizar servidor
echo ============================================
echo   Colbeef-Ops - Actualizando servidor
echo ============================================
echo.

cd /d "%~dp0\.."

echo [1/5] Trayendo cambios de GitHub...
git pull origin master
if %errorlevel% neq 0 (
    echo ERROR: No se pudo traer los cambios. Verifique la conexion.
    pause
    exit /b 1
)

echo.
echo [2/5] Compilando frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del frontend.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Compilando backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del backend.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Deteniendo servidor anterior...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [5/5] Iniciando servidor actualizado...
cd backend
start /b node dist\index.js
cd ..

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   Servidor actualizado correctamente
echo ============================================
echo.
echo URL: http://192.168.20.205:8081
echo.
pause
