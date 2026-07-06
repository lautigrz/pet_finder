-- AlterTable: motivo de cierre del reporte (reencuentro) + momento de resolución para estadísticas
ALTER TABLE "reports" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resolved_at" TIMESTAMP(6);
