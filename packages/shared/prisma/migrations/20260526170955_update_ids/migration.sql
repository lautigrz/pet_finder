-- AlterTable
ALTER TABLE "animal_types" ALTER COLUMN "animal_type_id" DROP DEFAULT;
DROP SEQUENCE "animal_types_animal_type_id_seq";

-- AlterTable
ALTER TABLE "genders" ALTER COLUMN "gender_id" DROP DEFAULT;
DROP SEQUENCE "genders_gender_id_seq";

-- AlterTable
ALTER TABLE "pet_sizes" ALTER COLUMN "size_id" DROP DEFAULT;
DROP SEQUENCE "pet_sizes_size_id_seq";

-- AlterTable
ALTER TABLE "report_statuses" ALTER COLUMN "report_status_id" DROP DEFAULT;
DROP SEQUENCE "report_statuses_report_status_id_seq";

-- AlterTable
ALTER TABLE "report_types" ALTER COLUMN "report_type_id" DROP DEFAULT;
DROP SEQUENCE "report_types_report_type_id_seq";
