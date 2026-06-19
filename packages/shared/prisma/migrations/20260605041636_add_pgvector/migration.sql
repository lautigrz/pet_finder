CREATE EXTENSION IF NOT EXISTS vector;
-- AlterTable
ALTER TABLE "pet_images" ADD COLUMN     "embedding_photo" vector(384);

-- AlterTable
ALTER TABLE "report_images" ADD COLUMN     "embedding_photo" vector(384);

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "embedding_description" vector(384);
