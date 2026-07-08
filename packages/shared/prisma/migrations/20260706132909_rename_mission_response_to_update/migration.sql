/*
  Warnings:

  - You are about to drop the `mission_responses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mission_responses" DROP CONSTRAINT "mission_responses_mission_id_fkey";

-- DropForeignKey
ALTER TABLE "mission_responses" DROP CONSTRAINT "mission_responses_user_id_fkey";

-- DropTable
DROP TABLE "mission_responses";

-- CreateTable
CREATE TABLE "mission_updates" (
    "update_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photo_url" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_updates_pkey" PRIMARY KEY ("update_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mission_updates_public_id_key" ON "mission_updates"("public_id");

-- AddForeignKey
ALTER TABLE "mission_updates" ADD CONSTRAINT "mission_updates_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_updates" ADD CONSTRAINT "mission_updates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
