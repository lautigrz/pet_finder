-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "suspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspicious_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "suspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspicious_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[];
