-- ============================================================================
--  Esquema de base de datos: inventario_subproductos
--  Sistema de Inventario de Subproductos — Colbeef SAS
--
--  Versión: v2026.07 (Trazabilidad de calidad y vencimientos)
--  Autor:   Daniel Almeida Jaimes — Colbeef SAS
--
--  Motor:   InnoDB  ·  Charset: utf8mb4  ·  Collation: utf8mb4_unicode_ci
--
--  Notas de diseño:
--    * Las relaciones son LÓGICAS (por nombre), NO FOREIGN KEYs físicas.
--      La aplicación las hace cumplir en código. Esto es intencional: permite
--      renombrar productos y almacenes con una cascada gestionada por la app
--      (ver módulo "Catálogo de productos") sin bloqueos por integridad.
--    * DDL 100% idempotente (CREATE TABLE IF NOT EXISTS).
--    * Ejecutable en MySQL 5.7+ / MySQL 8.x.
--    * Importable en MySQL Workbench vía  Database → Reverse Engineer.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inventario_subproductos
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE inventario_subproductos;

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================================
--  1) TABLAS DE CATÁLOGO / REFERENCIA
-- ============================================================================

-- ----------------------------------------------------------------------------
--  usuarios — Autenticación y autorización
-- ----------------------------------------------------------------------------
--  Referenciada por:  movimientos.NOMBRE_USUARIO,
--                     log_actividad.nombre_usuario,
--                     historial_movimiento.nombre_usuario
--  Roles válidos:     'Consulta', 'Operador', 'Medico Veterinario',
--                     'Administrador', 'Super Admin'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    correo   VARCHAR(100) NULL,
    password VARCHAR(100) NOT NULL,
    rol      VARCHAR(50)  NOT NULL,
    UNIQUE KEY uk_usuarios_nombre (nombre),
    INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema. La contraseña se almacena en texto plano (ver deuda técnica).';


-- ----------------------------------------------------------------------------
--  catalogo_productos — Maestro de productos con vida útil
-- ----------------------------------------------------------------------------
--  Referenciada por:  movimientos.PRODUCTO (por nombre, no por id)
--  Notas:
--    - vida_util_dias es OPCIONAL. Si está NULL, los ingresos se registran
--      sin FECHA_VENCIMIENTO (el usuario no queda bloqueado).
--    - Cuando está poblada, la app calcula automáticamente:
--         movimientos.FECHA_VENCIMIENTO = movimientos.FECHA + vida_util_dias
--    - La app cascadea el nombre en movimientos ante renombres (rename manual
--      desde el módulo "Catálogo de productos").
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_productos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    vida_util_dias INT          NULL,
    UNIQUE KEY uk_catalogo_prod_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo maestro de subproductos cárnicos + días de vida útil por producto.';


-- ----------------------------------------------------------------------------
--  almacenes — Destinos válidos para SALIDA POR DESPACHO
-- ----------------------------------------------------------------------------
--  Referenciada por:  movimientos.ALMACEN_DESTINO (por nombre)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS almacenes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre_almacen VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_almacenes_nombre (nombre_almacen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Almacenes / destinos de despacho.';


-- ----------------------------------------------------------------------------
--  tipos_movimiento — Whitelist de tipos oficiales
-- ----------------------------------------------------------------------------
--  Referenciada por:  movimientos.TIPO_DE_MOVIMIENTO (por nombre)
--  Notas:
--    - La aplicación mantiene la whitelist en la constante
--      TIPOS_MOVIMIENTO_OFICIALES del código Python. Esta tabla es un
--      espejo persistente para referencia y auditoría.
--    - Valores actuales:
--        · INGRESO DE PRODUCCION   (suma stock, recibe FECHA_VENCIMIENTO)
--        · SALIDA POR DESPACHO     (resta stock, requiere almacén + remisión)
--        · MERMA                   (resta stock, destino DESPERDICIO)
--        · ENTRADA POR AJUSTE      (suma stock, recibe FECHA_VENCIMIENTO)
--        · DEVOLUCION              (resta stock, exclusivo Medico Veterinario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_movimiento (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_tipos_nombre (nombre_tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tipos oficiales de movimiento (whitelist).';

-- Semilla (idempotente): inserta los tipos válidos si no existen.
INSERT IGNORE INTO tipos_movimiento (nombre_tipo) VALUES
    ('INGRESO DE PRODUCCION'),
    ('SALIDA POR DESPACHO'),
    ('MERMA'),
    ('ENTRADA POR AJUSTE'),
    ('DEVOLUCION');


-- ============================================================================
--  2) NÚCLEO TRANSACCIONAL
-- ============================================================================

-- ----------------------------------------------------------------------------
--  movimientos — Registro maestro de operaciones sobre el inventario
-- ----------------------------------------------------------------------------
--  Reglas de negocio:
--    - INGRESO / AJUSTE  → suman al stock, reciben FECHA_VENCIMIENTO calculada
--                          desde catalogo_productos.vida_util_dias.
--    - SALIDA / MERMA / DEVOLUCION → restan del stock.
--    - REMISION es relevante en SALIDA POR DESPACHO y DEVOLUCION.
--    - Auditoría fina en historial_movimiento por ID_MOVIMIENTOS.
--
--  Relaciones lógicas (no FK física):
--    TIPO_DE_MOVIMIENTO  → tipos_movimiento.nombre_tipo
--    PRODUCTO            → catalogo_productos.nombre
--    ALMACEN_DESTINO     → almacenes.nombre_almacen
--    NOMBRE_USUARIO      → usuarios.nombre
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos (
    ID_MOVIMIENTOS      INT AUTO_INCREMENT PRIMARY KEY,
    TIPO_DE_MOVIMIENTO  VARCHAR(100)  NOT NULL COMMENT 'Ref. lógica: tipos_movimiento.nombre_tipo',
    ALMACEN_ORIGEN      VARCHAR(100)  NULL     COMMENT 'Reservado (histórico).',
    ALMACEN_DESTINO     VARCHAR(100)  NULL     COMMENT 'Ref. lógica: almacenes.nombre_almacen',
    PRODUCTO            VARCHAR(100)  NOT NULL COMMENT 'Ref. lógica: catalogo_productos.nombre',
    PESO                DECIMAL(10,2) NOT NULL,
    REMISION            VARCHAR(100)  NULL,
    FECHA               DATETIME      NOT NULL,
    FECHA_VENCIMIENTO   DATE          NULL     COMMENT 'Solo INGRESO/AJUSTE. Calculada por la app: FECHA + vida_util_dias.',
    NOMBRE_USUARIO      VARCHAR(100)  NOT NULL COMMENT 'Ref. lógica: usuarios.nombre',
    INDEX idx_mov_fecha           (FECHA),
    INDEX idx_mov_producto        (PRODUCTO),
    INDEX idx_mov_tipo            (TIPO_DE_MOVIMIENTO),
    INDEX idx_mov_usuario         (NOMBRE_USUARIO),
    INDEX idx_mov_vencimiento     (FECHA_VENCIMIENTO),
    INDEX idx_mov_prod_venc       (PRODUCTO, FECHA_VENCIMIENTO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Movimientos maestros del inventario (transaccional).';


-- ============================================================================
--  3) AUDITORÍA (BITÁCORAS)
-- ============================================================================

-- ----------------------------------------------------------------------------
--  log_actividad — Bitácora general de acciones humanas
-- ----------------------------------------------------------------------------
--  Alimentada por la función registrar_log(accion) del módulo Python.
--  Alimenta el módulo "📊 Estadísticas de uso" (Super Admin).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_actividad (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL COMMENT 'Ref. lógica: usuarios.nombre',
    accion         TEXT         NOT NULL,
    fecha_hora     DATETIME     NOT NULL,
    rol            VARCHAR(50)  NULL,
    INDEX idx_log_fecha   (fecha_hora),
    INDEX idx_log_usuario (nombre_usuario),
    INDEX idx_log_accion  (accion(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bitácora general: login, edición, eliminación, cambios de vida útil, etc.';


-- ----------------------------------------------------------------------------
--  historial_movimiento — Auditoría fina por ID de movimiento
-- ----------------------------------------------------------------------------
--  Alimentada por registrar_historial_movimiento(id, accion, detalle).
--  Guarda el DIFF de cada cambio con el formato "Campo: «antes» → «después»".
--
--  Acciones válidas: CREAR / ACTUALIZAR / ELIMINAR
--
--  Relaciones lógicas (no FK física):
--    id_movimiento  → movimientos.ID_MOVIMIENTOS
--    nombre_usuario → usuarios.nombre
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_movimiento (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    id_movimiento  INT          NOT NULL COMMENT 'Ref. lógica: movimientos.ID_MOVIMIENTOS',
    fecha_hora     DATETIME     NOT NULL,
    nombre_usuario VARCHAR(200) NULL     COMMENT 'Ref. lógica: usuarios.nombre',
    accion         VARCHAR(40)  NOT NULL COMMENT 'CREAR / ACTUALIZAR / ELIMINAR',
    detalle        TEXT         NULL,
    INDEX idx_hist_mov   (id_movimiento),
    INDEX idx_hist_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial auditable de cambios por ID_MOVIMIENTOS.';


-- ============================================================================
--  4) LEGACY (NO USADA POR LA APP ACTUAL)
-- ============================================================================
--
--  ⚠️ La tabla siguiente existe en la BD por razones históricas pero la
--  aplicación (main_colbeef_web.py) NO la consulta ni escribe en ella.
--  Toda la gestión de productos se hace exclusivamente contra
--  catalogo_productos.
--
--  Recomendación:
--    1. Verificar que no queda ningún proceso externo que la consulte.
--    2. Hacer respaldo (mysqldump o SELECT INTO OUTFILE).
--    3. Ejecutar:  DROP TABLE IF EXISTS productos;
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS productos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='⚠️ LEGACY - reemplazada por catalogo_productos. Candidata a DROP.';


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
--  APÉNDICE: MAPA DE RELACIONES LÓGICAS
-- ============================================================================
--
--   usuarios (1) ─── (N) movimientos              [por NOMBRE_USUARIO]
--   usuarios (1) ─── (N) log_actividad            [por nombre_usuario]
--   usuarios (1) ─── (N) historial_movimiento     [por nombre_usuario]
--
--   catalogo_productos (1) ─── (N) movimientos    [por PRODUCTO]
--   almacenes         (1) ─── (N) movimientos    [por ALMACEN_DESTINO]
--   tipos_movimiento  (1) ─── (N) movimientos    [por TIPO_DE_MOVIMIENTO]
--
--   movimientos (1) ─── (N) historial_movimiento [por ID_MOVIMIENTOS]
--
-- ============================================================================
--  Fin del script.
--
--  Para visualizar el ER completo (con relaciones dibujadas), abrir el archivo
--  companion:  ESQUEMA_BD.drawio
-- ============================================================================
