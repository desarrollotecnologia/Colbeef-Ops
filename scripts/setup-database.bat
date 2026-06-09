@echo off
title Colbeef-Ops - Configurar Base de Datos
echo ============================================
echo   Colbeef-Ops - Configuracion de MySQL
echo ============================================
echo.

cd /d "%~dp0\.."

if not exist "backend\.env" (
    echo ERROR: No existe backend\.env
    echo Copie backend\.env.example a backend\.env y configure DATABASE_URL
    pause
    exit /b 1
)

echo Este script ejecutara las migraciones de Prisma.
echo Asegurese de que MySQL este corriendo y que la base
echo de datos 'colbeef_ops' ya este creada.
echo.
echo Si aun no creo la base de datos, abra MySQL y ejecute:
echo   CREATE DATABASE colbeef_ops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo.
pause

echo.
echo [1/3] Generando cliente Prisma...
cd backend
call npx prisma generate
if %errorlevel% neq 0 goto :error

echo.
echo [2/3] Ejecutando migraciones...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 goto :error

echo.
echo [3/3] Sembrando datos iniciales ^(formatos y usuarios de prueba^)...
call npx tsx prisma/seed.ts
if %errorlevel% neq 0 goto :error

cd ..

echo.
echo ============================================
echo   Base de datos configurada exitosamente
echo ============================================
echo.
echo Usuarios de prueba:
echo   Admin:    admin / admin123
echo   Operario: operario / operario123
echo.
echo Cambie estas contrasenas en produccion.
echo.
pause
exit /b 0

:error
echo.
echo ERROR durante la configuracion de la base de datos.
echo Verifique que MySQL este corriendo y que DATABASE_URL
echo en backend\.env sea correcto.
pause
exit /b 1
