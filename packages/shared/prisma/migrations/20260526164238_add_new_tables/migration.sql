/*
  Warnings:

  - The primary key for the `pets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `pets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[public_id]` on the table `pets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `animal_type_id` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender_id` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pet_name` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public_id` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_id` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pets" DROP CONSTRAINT "pets_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "animal_type_id" INTEGER NOT NULL,
ADD COLUMN     "breed" TEXT,
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender_id" SMALLINT NOT NULL,
ADD COLUMN     "has_id_collar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vaccinated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pet_id" SERIAL NOT NULL,
ADD COLUMN     "pet_name" TEXT NOT NULL,
ADD COLUMN     "public_id" UUID NOT NULL,
ADD COLUMN     "size_id" SMALLINT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("pet_id");

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE VARCHAR,
ALTER COLUMN "password" SET DATA TYPE VARCHAR;

-- CreateTable
CREATE TABLE "reports" (
    "report_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_type_id" SMALLINT NOT NULL,
    "report_status_id" SMALLINT NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "location_address" TEXT,
    "location_lat" DECIMAL(65,30) NOT NULL,
    "location_lng" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "report_statuses" (
    "report_status_id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "report_statuses_pkey" PRIMARY KEY ("report_status_id")
);

-- CreateTable
CREATE TABLE "report_types" (
    "report_type_id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "requires_registered_pet" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "report_types_pkey" PRIMARY KEY ("report_type_id")
);

-- CreateTable
CREATE TABLE "lost_report_details" (
    "report_id" INTEGER NOT NULL,
    "pet_id" INTEGER NOT NULL,

    CONSTRAINT "lost_report_details_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "sighting_report_details" (
    "report_id" INTEGER NOT NULL,
    "animal_type_id" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "has_id_collar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sighting_report_details_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "animal_types" (
    "animal_type_id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "animal_types_pkey" PRIMARY KEY ("animal_type_id")
);

-- CreateTable
CREATE TABLE "genders" (
    "gender_id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("gender_id")
);

-- CreateTable
CREATE TABLE "pet_sizes" (
    "size_id" SMALLSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "pet_sizes_pkey" PRIMARY KEY ("size_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_public_id_key" ON "reports"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "pets_public_id_key" ON "pets"("public_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_report_type_id_fkey" FOREIGN KEY ("report_type_id") REFERENCES "report_types"("report_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_report_status_id_fkey" FOREIGN KEY ("report_status_id") REFERENCES "report_statuses"("report_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_report_details" ADD CONSTRAINT "lost_report_details_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_report_details" ADD CONSTRAINT "lost_report_details_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_animal_type_id_fkey" FOREIGN KEY ("animal_type_id") REFERENCES "animal_types"("animal_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_animal_type_id_fkey" FOREIGN KEY ("animal_type_id") REFERENCES "animal_types"("animal_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "genders"("gender_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pet_sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;
