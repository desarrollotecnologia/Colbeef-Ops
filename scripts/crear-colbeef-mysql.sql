-- ============================================================
-- Colbeef-Ops — Ejecutar en MySQL Workbench
-- Usar una conexión con permisos de administrador (root u otra)
-- ============================================================

-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS colbeef_ops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Crear usuario propio (como GH_nexus pero para Colbeef)
--    CAMBIE 'Colbeef2026!' por la contraseña que desee
CREATE USER IF NOT EXISTS 'colbeef'@'localhost' IDENTIFIED BY 'Colbeef2026!';

-- 3. Dar permisos solo sobre colbeef_ops
GRANT ALL PRIVILEGES ON colbeef_ops.* TO 'colbeef'@'localhost';
FLUSH PRIVILEGES;

-- 4. Verificar
SHOW DATABASES LIKE 'colbeef_ops';
SELECT user, host FROM mysql.user WHERE user = 'colbeef';
