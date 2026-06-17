/*
  Warnings:

  - You are about to drop the column `shared_fields_score` on the `match_results` table. All the data in the column will be lost.
  - Added the required column `shared_fields` to the `match_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `structured_score` to the `match_results` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- AlterTable
ALTER TABLE "match_results" DROP COLUMN "shared_fields_score",
ADD COLUMN     "shared_fields" INTEGER NOT NULL,
ADD COLUMN     "structured_score" DOUBLE PRECISION NOT NULL;

CREATE INDEX idx_reports_location 
ON reports USING GIST (
  geography(ST_MakePoint(location_lng, location_lat))
);