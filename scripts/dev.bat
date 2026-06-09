@echo off
title Colbeef-Ops - Desarrollo
echo ============================================
echo   Colbeef-Ops - Modo desarrollo
echo ============================================
echo.

cd /d "%~dp0\.."

if not exist "backend\.env" (
    echo Copiando backend\.env.example a backend\.env
    copy "backend\.env.example" "backend\.env"
    echo Configure backend\.env con sus credenciales de MySQL.
)

echo Iniciando backend ^(puerto 3001^) y frontend ^(puerto 5173^)...
echo.
call npm run dev

pause
