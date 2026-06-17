/*
  Warnings:

  - Added the required column `shared_fields_score` to the `match_results` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "match_results" ADD COLUMN     "shared_fields_score" DOUBLE PRECISION NOT NULL;
