@echo off
title Colbeef-Ops - Arranque Automatico
echo ============================================
echo   Colbeef-Ops - Configurar arranque automatico
echo ============================================
echo.
echo Este script registrara Colbeef-Ops en el Programador
echo de tareas de Windows para que inicie automaticamente
echo cuando el servidor se reinicie.
echo.

cd /d "%~dp0"

set TASK_NAME=ColbeefOps-Server
set START_SCRIPT=%~dp0start-server.bat

echo Script de inicio: %START_SCRIPT%
echo.

where schtasks >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: schtasks no disponible en este sistema.
    pause
    exit /b 1
)

schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo La tarea '%TASK_NAME%' ya existe. Eliminando...
    schtasks /delete /tn "%TASK_NAME%" /f
)

echo Creando tarea programada...
schtasks /create /tn "%TASK_NAME%" /tr "cmd /c \"%START_SCRIPT%\"" /sc onstart /ru SYSTEM /rl highest /f

if %errorlevel% neq 0 (
    echo.
    echo No se pudo crear con SYSTEM. Intentando con usuario actual...
    schtasks /create /tn "%TASK_NAME%" /tr "cmd /c \"%START_SCRIPT%\"" /sc onstart /rl highest /f
)

if %errorlevel% neq 0 goto :error

echo.
echo ============================================
echo   Arranque automatico configurado
echo ============================================
echo.
echo Tarea: %TASK_NAME%
echo Se ejecutara al iniciar Windows.
echo.
echo Para verificar:  schtasks /query /tn "%TASK_NAME%"
echo Para eliminar:   schtasks /delete /tn "%TASK_NAME%" /f
echo Para probar ahora: scripts\start-server.bat
echo.
pause
exit /b 0

:error
echo.
echo ERROR al configurar arranque automatico.
echo Puede crear la tarea manualmente en:
echo   Panel de control ^> Herramientas administrativas ^> Programador de tareas
echo.
echo Programa: cmd /c "%START_SCRIPT%"
echo Desencadenador: Al iniciar el sistema
echo.
pause
exit /b 1
