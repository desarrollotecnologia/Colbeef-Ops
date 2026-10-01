-- Control de cambios documental por formato
CREATE TABLE `format_change_logs` (
    `id` VARCHAR(191) NOT NULL,
    `format_code` VARCHAR(64) NOT NULL,
    `version` VARCHAR(20) NOT NULL,
    `change_date` DATE NULL,
    `elaboro` VARCHAR(191) NULL,
    `reviso` VARCHAR(191) NULL,
    `aprobo` VARCHAR(191) NULL,
    `descripcion` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `updated_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `format_change_logs_format_code_sort_order_idx`(`format_code`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `format_change_logs`
  ADD CONSTRAINT `format_change_logs_updated_by_id_fkey`
  FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Datos iniciales tomados de la hoja CONTROL DE CAMBIOS de cada Excel
INSERT INTO `format_change_logs`
  (`id`, `format_code`, `version`, `change_date`, `elaboro`, `reviso`, `aprobo`, `descripcion`, `sort_order`)
VALUES
  (UUID(), 'INSPECCION_BIENESTAR_ANIMAL', '01', '2024-12-16', 'Gestor de Calidad', 'Director(a) Aseguramiento de la Calidad', 'Director(a) Aseguramiento de la Calidad', 'Creación versión inicial del documento', 10),
  (UUID(), 'INSPECCION_VEHICULOS', '01', '2019-10-23', 'Coordinador(a) de calidad', 'Gerente de calidad', 'Gerente de calidad', 'Creación versión inicial del documento.', 10),
  (UUID(), 'INSPECCION_VEHICULOS', '02', '2024-12-16', 'Gestor de calidad', 'Coordinador(a) de calidad - Analista SIG', 'Director(a) aseguramiento de la calidad', 'Se actualiza de acuerdo con el procedimiento de elaboración y control documental e inclusión de criterios de aceptación, rango de temperatura de visceras y canales para despacho.', 20),
  (UUID(), 'INSPECCION_VEHICULOS', '03', '2025-09-25', 'Analista SIG', 'Coordinador(a) de calidad', 'Director(a) aseguramiento de la calidad', 'Se realiza actualización de logo corporativo', 30),
  (UUID(), 'DEVOLUCIONES', '1.0.0', '2021-07-24', 'Gestor Calidad', 'Coordinación calidad', 'Dirección Calidad', 'Creación del documento', 10),
  (UUID(), 'DEVOLUCIONES', '02', '2025-05-02', 'Analista SIG', 'Director de planta', 'Comité de gestión integral', 'Se realiza ajuste según procedimiento de control documental', 20),
  (UUID(), 'MONITOREO_TITULACION_ACIDO_LACTICO', '01', '2023-07-15', 'Coordinación de Calidad', 'Gerencia de calidad', 'Gerencia de calidad', 'Creación versión inicial del documento.', 10),
  (UUID(), 'MONITOREO_TITULACION_ACIDO_LACTICO', '02', NULL, 'Gestor de Calidad', 'Coordinación de Calidad', 'Dirección Aseguramiento de la Calidad', 'Ajuste de acuerdo con la actualización del procedimiento de control documental y cambio del nombre del formato.', 20),
  (UUID(), 'MONITOREO_TITULACION_ACIDO_LACTICO', '03', NULL, NULL, NULL, NULL, 'Separación de formato', 30),
  (UUID(), 'PREOP_DESPOSTE', '01', '2019-11-09', 'Gestor Calidad desposte', 'Coordinación calidad', 'Gerencia de calidad', 'Creación del documento', 10),
  (UUID(), 'PREOP_DESPOSTE', '02', NULL, NULL, NULL, NULL, NULL, 20),
  (UUID(), 'PREOP_DESPOSTE', '03', '2025-06-27', 'Gestor Calidad desposte', 'Directora Aseguramiento de la Calidad e I+D', 'Comité de gestión Integral', 'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie', 30),
  (UUID(), 'DESPACHO_PRODUCTO', '01', '2019-11-09', 'Gestor Calidad desposte', 'Coordinación calidad', 'Gerencia de calidad', 'Creación del documento', 10),
  (UUID(), 'DESPACHO_PRODUCTO', '02', NULL, NULL, NULL, NULL, NULL, 20),
  (UUID(), 'DESPACHO_PRODUCTO', '03', '2025-06-27', 'Gestor Calidad desposte', 'Coordinación calidad', 'Directora Aseguramiento de la Calidad e I+D', 'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie.', 30),
  (UUID(), 'PROCESO_DESPOSTE', '01', '2019-11-09', 'Gestor Calidad desposte', 'Coordinación calidad', 'Gerencia de calidad', 'Creación del documento', 10),
  (UUID(), 'PROCESO_DESPOSTE', '02', NULL, NULL, NULL, NULL, NULL, 20),
  (UUID(), 'PROCESO_DESPOSTE', '03', '2025-06-27', 'Gestor Calidad desposte', 'Coordinación calidad', 'Directora Aseguramiento de la Calidad e I+D', 'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos, se incluye casilla de especie.', 30),
  (UUID(), 'PROCESO_DESPOSTE', '04', '2025-10-29', 'Analista SIG', 'Directora Aseguramiento de la Calidad e I+D', 'Comité de gestión integral', 'Se incluye página para verificación de etiquetado e injet', 40),
  (UUID(), 'RECEPCION_CANALES_FORANEAS', '01', '2019-11-09', 'Gestor Calidad desposte', NULL, NULL, NULL, 10),
  (UUID(), 'RECEPCION_CANALES_DESPOSTE', '01', '2019-11-09', 'Gestor Calidad desposte', 'Coordinación calidad', 'Gerencia de calidad', 'Creación del documento', 10),
  (UUID(), 'RECEPCION_CANALES_DESPOSTE', '03', '2025-09-25', 'Gestor Calidad desposte', 'Coordinación calidad', 'Directora Aseguramiento de la Calidad e I+D', 'Se ajusta de acuerdo al procedimiento de elaboración y control de documentos, se elimina columna correspondiente a sexo', 20),
  (UUID(), 'VERIFICACION_PRODUCTO', '01', '2022-10-01', 'Gestor Calidad desposte', 'Coordinación calidad', 'Gerencia de calidad', 'Creación del documento', 10),
  (UUID(), 'VERIFICACION_PRODUCTO', '02', '2025-09-25', 'Gestor Calidad desposte', 'Directora Aseguramiento de la Calidad e I+D', 'Comité de gestión integral', 'Se ajusta de acuerdo con el procedimiento de elaboración y control de documentos', 20),
  (UUID(), 'VERIFICACION_PCC', '01', '2026-09-10', 'Analista de calidad', 'Jefe de Calidad', 'Comité de gestión integral', 'Creación versión inicial del documento.', 10);
