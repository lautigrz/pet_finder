/*
  Warnings:

  - You are about to alter the column `photo_url` on the `pet_images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `photo_url` on the `report_images` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "pet_images" ALTER COLUMN "photo_url" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "report_images" ALTER COLUMN "photo_url" SET DATA TYPE VARCHAR(500);

-- CreateTable
CREATE TABLE "message_images" (
    "image_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "photo_url" VARCHAR(500) NOT NULL,
    "message_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_images_public_id_key" ON "message_images"("public_id");

-- CreateIndex
CREATE INDEX "message_images_message_id_idx" ON "message_images"("message_id");

-- AddForeignKey
ALTER TABLE "message_images" ADD CONSTRAINT "message_images_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;
