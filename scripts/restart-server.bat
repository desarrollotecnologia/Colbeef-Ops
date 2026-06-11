@echo off
title Colbeef-Ops - Reiniciar servidor
echo ============================================
echo   Colbeef-Ops - Reiniciando servidor
echo ============================================
echo.

call "%~dp0stop.bat"
call "%~dp0start-server.bat"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo reiniciar el servidor.
    pause
    exit /b 1
)

echo.
echo Servidor reiniciado correctamente.
echo.
pause
