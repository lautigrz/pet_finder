/*
  Warnings:

  - You are about to drop the column `status` on the `missions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "missions" DROP COLUMN "status",
ADD COLUMN     "mission_status_id" SMALLINT NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "mission_statuses" (
    "mission_status_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "mission_statuses_pkey" PRIMARY KEY ("mission_status_id")
);

-- CreateTable
CREATE TABLE "mission_volunteers" (
    "mission_volunteer_id" SERIAL NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_volunteers_pkey" PRIMARY KEY ("mission_volunteer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mission_volunteers_mission_id_user_id_key" ON "mission_volunteers"("mission_id", "user_id");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_mission_status_id_fkey" FOREIGN KEY ("mission_status_id") REFERENCES "mission_statuses"("mission_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_volunteers" ADD CONSTRAINT "mission_volunteers_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_volunteers" ADD CONSTRAINT "mission_volunteers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
