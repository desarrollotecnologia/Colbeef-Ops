@echo off
title Colbeef-Ops - Detener Servidor
echo Deteniendo Colbeef-Ops...

set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8081 " ^| findstr "LISTENING"') do (
    echo Cerrando proceso PID %%a en puerto 8081...
    taskkill /PID %%a /F >nul 2>&1
    set "FOUND=1"
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo Cerrando proceso PID %%a en puerto 3001...
    taskkill /PID %%a /F >nul 2>&1
    set "FOUND=1"
)

if "%FOUND%"=="0" (
    echo No hay servidor activo en puertos 8081 ni 3001.
) else (
    echo Servidor detenido.
)

timeout /t 2 >nul
