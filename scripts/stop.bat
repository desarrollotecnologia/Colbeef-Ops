@echo off
title Colbeef-Ops - Detener Servidor
echo Deteniendo procesos de Colbeef-Ops...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Cerrando proceso PID %%a en puerto 3001...
    taskkill /PID %%a /F >nul 2>&1
)

echo Listo.
timeout /t 2 >nul
