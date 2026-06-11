@echo off
title Colbeef-Ops - Instalacion
echo ============================================
echo   Colbeef-Ops - Instalacion del sistema
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descarguelo desde https://nodejs.org/ ^(version 18 o superior^)
    pause
    exit /b 1
)

echo [1/5] Instalando dependencias raiz...
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [2/5] Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [3/5] Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 goto :error

cd ..

echo.
echo [4/5] Verificando archivo .env del backend...
if not exist "backend\.env" (
    echo Copiando backend\.env.example a backend\.env
    copy "backend\.env.example" "backend\.env"
    echo.
    echo IMPORTANTE: Edite backend\.env con sus credenciales de MySQL
    echo               antes de continuar con la migracion.
)

echo.
echo [5/5] Compilando frontend para produccion...
cd frontend
call npm run build
if %errorlevel% neq 0 goto :error

cd ..\backend
call npm run build
if %errorlevel% neq 0 goto :error

cd ..

echo.
echo ============================================
echo   Instalacion completada exitosamente
echo ============================================
echo.
echo Proximos pasos:
echo   1. Configure backend\.env con su base de datos MySQL
echo   2. Ejecute setup-database.bat para crear la BD
echo   3. Ejecute start-server.bat para iniciar el servidor
echo   4. Ejecute setup-autostart.bat para arranque automatico
echo.
pause
exit /b 0

:error
echo.
echo ERROR durante la instalacion.
pause
exit /b 1
