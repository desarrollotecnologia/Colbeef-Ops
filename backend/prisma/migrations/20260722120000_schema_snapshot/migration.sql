-- Congela el esquema del formato al entregar, para no alterar envíos históricos
ALTER TABLE `form_submissions` ADD COLUMN `schema_snapshot` JSON NULL;
