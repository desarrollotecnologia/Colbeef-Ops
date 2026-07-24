-- Permisos de formatos por usuario (operarios)
CREATE TABLE `user_format_access` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `format_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_format_access_user_id_format_id_key`(`user_id`, `format_id`),
    INDEX `user_format_access_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_format_access` ADD CONSTRAINT `user_format_access_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_format_access` ADD CONSTRAINT `user_format_access_format_id_fkey` FOREIGN KEY (`format_id`) REFERENCES `formats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Operarios existentes: acceso a todos los formatos activos (no romper tableros tras migrar)
INSERT INTO `user_format_access` (`id`, `user_id`, `format_id`, `created_at`)
SELECT UUID(), u.`id`, f.`id`, CURRENT_TIMESTAMP(3)
FROM `users` u
CROSS JOIN `formats` f
WHERE u.`role` = 'OPERARIO' AND f.`active` = 1
AND NOT EXISTS (
  SELECT 1 FROM `user_format_access` a
  WHERE a.`user_id` = u.`id` AND a.`format_id` = f.`id`
);
