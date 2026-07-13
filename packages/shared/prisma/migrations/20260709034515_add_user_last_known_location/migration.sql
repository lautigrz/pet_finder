-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_known_latitude" DECIMAL(9,6),
ADD COLUMN     "last_known_location_at" TIMESTAMP(6),
ADD COLUMN     "last_known_longitude" DECIMAL(9,6);
