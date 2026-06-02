-- AlterTable
ALTER TABLE "sighting_report_details" ADD COLUMN     "breed" VARCHAR(100),
ADD COLUMN     "gender_id" SMALLINT,
ADD COLUMN     "pet_name" VARCHAR(30),
ADD COLUMN     "size_id" SMALLINT;

-- AddForeignKey
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_gender_id_fkey" FOREIGN KEY ("gender_id") REFERENCES "genders"("gender_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pet_sizes"("size_id") ON DELETE SET NULL ON UPDATE CASCADE;
