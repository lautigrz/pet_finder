-- AlterTable: suspensión de conversaciones por moderación
ALTER TABLE "conversations" ADD COLUMN "is_suspended" BOOLEAN NOT NULL DEFAULT false;
