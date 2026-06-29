/*
  Warnings:

  - You are about to drop the column `color` on the `report_types` table. All the data in the column will be lost.
  - You are about to drop the column `requires_registered_pet` on the `report_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "report_types" DROP COLUMN "color",
DROP COLUMN "requires_registered_pet";
