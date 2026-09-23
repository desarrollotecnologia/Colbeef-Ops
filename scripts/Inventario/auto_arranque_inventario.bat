@echo off
chcp 65001 >nul
title Inventario Colbeef - Streamlit
cd /d "%~dp0"

REM =============================================================================
REM INVENTARIO COLBEEF — Arranque automático (Streamlit)
REM =============================================================================
REM 1) Inicio con Windows: Win+R  →  shell:startup
REM    Cree un acceso directo a:
REM      - Este archivo (verá la ventana de consola), o
REM      - iniciar_inventario_oculto.vbs (sin ventana de consola)
REM
REM 2) Junto con Laragon: abra (o cree) el archivo:
REM      C:\laragon\usr\user.cmd
REM    y agregue UNA línea al final (ajuste la ruta si su carpeta no es esta).
REM    En user.cmd use la ruta absoluta real, por ejemplo:
REM    SIN punto al final. Ejemplo correcto:
REM      start "ColbeefInventario" /MIN cmd /c "cd /d C:\proyectos\Inventario && auto_arranque_colbeef.bat /servicio"
REM    Linea incorrecta (rompe el comando): ...bat /servicio".
REM
REM 3) Espera inferior: si MySQL aún no está listo, aumente TIMEOUT_SEG (segundos).
REM =============================================================================

set TIMEOUT_SEG=25
echo [%date% %time%] Esperando %TIMEOUT_SEG%s para MySQL (Laragon^)...
timeout /t %TIMEOUT_SEG% /nobreak >nul

where py >nul 2>&1
if %errorlevel%==0 (
    set "PY=py"
) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
        set "PY=python"
    ) else (
        echo [ERROR] No se encontro "py" ni "python" en el PATH.
        echo Instale Python o marque "Add Python to PATH" en la instalacion.
        pause
        exit /b 1
    )
)

echo [%date% %time%] Iniciando aplicacion...
echo URL local:  http://localhost:8501
echo URL en red (ejemplo): http://^<IP-de-esta-PC^>:8501
echo.
if /i "%~1"=="/servicio" (
    REM Abre el navegador tras unos segundos mientras Streamlit arranca (modo Laragon / sin consola visible).
    start "" cmd /c "timeout /t 14 /nobreak >nul & start http://127.0.0.1:8501/"
)

%PY% -m streamlit run main_colbeef_web.py

REM Si Streamlit termina (error o cierre), mantener ventana para ver el mensaje
echo.
echo [%date% %time%] Streamlit ha finalizado.

if /i "%~1"=="/servicio" exit /b 0
pause
