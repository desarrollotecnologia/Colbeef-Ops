-- Colbeef-Ops — Script SQL inicial (alternativa manual)
-- Ejecutar en MySQL Workbench o consola MySQL

CREATE DATABASE IF NOT EXISTS colbeef_ops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE colbeef_ops;

-- Las tablas se crean automáticamente con Prisma Migrate.
-- Después de crear la BD, ejecute desde el proyecto:
--   scripts\setup-database.bat
