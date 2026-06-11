@echo off
title Colbeef-Ops - Actualizar servidor
echo ============================================
echo   Colbeef-Ops - Actualizando servidor
echo ============================================
echo.

cd /d "%~dp0\.."

echo [1/6] Deteniendo servidor anterior...
call "%~dp0stop.bat"

echo.
echo [2/6] Trayendo cambios de GitHub...
git pull origin master
if %errorlevel% neq 0 (
    echo ERROR: No se pudo traer los cambios. Verifique la conexion.
    pause
    exit /b 1
)

echo.
echo [3/6] Compilando frontend...
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
echo [4/6] Compilando backend...
cd backend
call npm run db:generate
if %errorlevel% neq 0 (
    echo ERROR: Fallo la generacion de Prisma Client.
    cd ..
    pause
    exit /b 1
)
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del backend.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/6] Actualizando campos del formato en base de datos...
cd backend
call npm run db:seed
if %errorlevel% neq 0 (
    echo ERROR: Fallo la actualizacion de la base de datos.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [6/6] Iniciando servidor actualizado...
call "%~dp0start-server.bat"
if %errorlevel% neq 0 (
    echo ERROR: El servidor no inicio correctamente.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Servidor actualizado y en linea
echo ============================================
echo.
echo URL: http://192.168.20.205:8081
echo.
echo El servidor corre en segundo plano (ventana minimizada).
echo Para detenerlo: scripts\stop.bat
echo Para reiniciar solo: scripts\restart-server.bat
echo.
pause
