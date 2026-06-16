-- AlterEnum: add PANEL role
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'OPERARIO', 'PANEL') NOT NULL DEFAULT 'OPERARIO';

-- CreateTable
CREATE TABLE `usage_events` (
    `id` VARCHAR(191) NOT NULL,
    `event_type` ENUM('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PAGE_VIEW', 'SUBMISSION_CREATED', 'SHEET_SAVED', 'SUBMISSION_SUBMITTED', 'SUBMISSION_SUBMITTED_FAILED', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'SUBMISSION_DELETED', 'SUBMISSION_OPENED', 'PDF_DOWNLOADED', 'SEARCH_EXECUTED', 'PENDING_VIEWED') NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `user_role` ENUM('ADMIN', 'OPERARIO', 'PANEL') NULL,
    `path` VARCHAR(191) NULL,
    `format_id` VARCHAR(191) NULL,
    `format_code` VARCHAR(191) NULL,
    `format_name` VARCHAR(191) NULL,
    `submission_id` VARCHAR(191) NULL,
    `sheet_id` VARCHAR(191) NULL,
    `sheet_name` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usage_events_event_type_idx`(`event_type`),
    INDEX `usage_events_user_id_idx`(`user_id`),
    INDEX `usage_events_created_at_idx`(`created_at`),
    INDEX `usage_events_format_id_idx`(`format_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usage_events` ADD CONSTRAINT `usage_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
