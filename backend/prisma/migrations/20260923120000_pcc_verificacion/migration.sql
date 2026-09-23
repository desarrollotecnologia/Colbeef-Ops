-- Verificación PCC: acceso por usuario + registros locales
CREATE TABLE `user_pcc_access` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `user_pcc_access_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pcc_verificaciones` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `external_ins_id` VARCHAR(64) NOT NULL,
    `id_producto` VARCHAR(96) NOT NULL,
    `snapshot_externo` JSON NOT NULL,
    `cumple_media_canal_1` BOOLEAN NOT NULL,
    `cumple_media_canal_2` BOOLEAN NOT NULL,
    `responsable_puesto` VARCHAR(191) NULL,
    `observacion` TEXT NULL,
    `accion_correctiva` TEXT NULL,
    `work_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `pcc_verificaciones_external_ins_id_work_date_key`(`external_ins_id`, `work_date`),
    INDEX `pcc_verificaciones_work_date_idx`(`work_date`),
    INDEX `pcc_verificaciones_user_id_idx`(`user_id`),
    INDEX `pcc_verificaciones_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_pcc_access`
  ADD CONSTRAINT `user_pcc_access_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pcc_verificaciones`
  ADD CONSTRAINT `pcc_verificaciones_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
