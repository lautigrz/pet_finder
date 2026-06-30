-- AlterTable
ALTER TABLE "content_reports" ADD COLUMN "suspension_reason" TEXT;

-- Nuevo estado de denuncia para la suspensión de reportes por moderación
INSERT INTO "content_report_statuses" ("content_report_status_id", "name")
VALUES (4, 'SUSPENDED')
ON CONFLICT ("content_report_status_id") DO NOTHING;
