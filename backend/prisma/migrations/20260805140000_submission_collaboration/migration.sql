-- Colaboración en envíos: colaboradores, locks por campo, actividad, submitted_by

ALTER TABLE `form_submissions` ADD COLUMN `submitted_by_id` VARCHAR(191) NULL;

CREATE INDEX `form_submissions_submitted_by_id_idx` ON `form_submissions`(`submitted_by_id`);

ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_submitted_by_id_fkey` FOREIGN KEY (`submitted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `submission_collaborators` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `added_by_id` VARCHAR(191) NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `submission_collaborators_submission_id_user_id_key`(`submission_id`, `user_id`),
    INDEX `submission_collaborators_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `submission_collaborators` ADD CONSTRAINT `submission_collaborators_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `submission_collaborators` ADD CONSTRAINT `submission_collaborators_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `submission_collaborators` ADD CONSTRAINT `submission_collaborators_added_by_id_fkey` FOREIGN KEY (`added_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `submission_field_locks` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `sheet_id` VARCHAR(191) NOT NULL,
    `field_key` VARCHAR(191) NOT NULL,
    `filled_by_id` VARCHAR(191) NOT NULL,
    `filled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `submission_field_locks_submission_id_sheet_id_field_key_key`(`submission_id`, `sheet_id`, `field_key`),
    INDEX `submission_field_locks_submission_id_idx`(`submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `submission_field_locks` ADD CONSTRAINT `submission_field_locks_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `submission_field_locks` ADD CONSTRAINT `submission_field_locks_filled_by_id_fkey` FOREIGN KEY (`filled_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `submission_activities` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `type` ENUM('CREATED', 'COLLABORATOR_ADDED', 'COLLABORATOR_REMOVED', 'SHEET_SAVED', 'SUBMITTED', 'REJECTED', 'APPROVED') NOT NULL,
    `actor_id` VARCHAR(191) NULL,
    `target_user_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `submission_activities_submission_id_created_at_idx`(`submission_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `submission_activities` ADD CONSTRAINT `submission_activities_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `submission_activities` ADD CONSTRAINT `submission_activities_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `submission_activities` ADD CONSTRAINT `submission_activities_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
