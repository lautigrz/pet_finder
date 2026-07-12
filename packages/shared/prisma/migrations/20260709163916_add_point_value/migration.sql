-- AlterTable
ALTER TABLE "mission_updates" ADD COLUMN     "point_value_id" INTEGER,
ADD COLUMN     "scored_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "point_values" (
    "point_value_id" SERIAL NOT NULL,
    "points" INTEGER NOT NULL,
    "label" VARCHAR(50),

    CONSTRAINT "point_values_pkey" PRIMARY KEY ("point_value_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_values_points_key" ON "point_values"("points");

-- AddForeignKey
ALTER TABLE "mission_updates" ADD CONSTRAINT "mission_updates_point_value_id_fkey" FOREIGN KEY ("point_value_id") REFERENCES "point_values"("point_value_id") ON DELETE SET NULL ON UPDATE CASCADE;
