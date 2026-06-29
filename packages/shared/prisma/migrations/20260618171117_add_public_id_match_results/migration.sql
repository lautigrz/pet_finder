/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `match_results` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "match_results" ADD COLUMN     "public_id" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "match_results_public_id_key" ON "match_results"("public_id");
