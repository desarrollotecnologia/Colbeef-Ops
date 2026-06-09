@echo off
title Colbeef-Ops - Servidor
echo ============================================
echo   Colbeef-Ops - Iniciando servidor
echo ============================================
echo.

cd /d "%~dp0\.."

if not exist "backend\.env" (
    echo ERROR: No existe backend\.env
    echo Ejecute install.bat primero y configure la base de datos.
    pause
    exit /b 1
)

if not exist "backend\dist\index.js" (
    echo Compilando backend...
    cd backend
    call npm run build
    cd ..
)

if not exist "frontend\dist\index.html" (
    echo Compilando frontend...
    cd frontend
    call npm run build
    cd ..
)

echo Servidor iniciando en http://localhost:3001
echo Presione Ctrl+C para detener.
echo.

cd backend
set NODE_ENV=production
node dist/index.js

pause
