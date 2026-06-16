/*
  Warnings:

  - You are about to drop the column `user_id` on the `messages` table. All the data in the column will be lost.
  - Added the required column `receiver_user_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_user_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_user_id_fkey";

-- DropIndex
DROP INDEX "messages_user_id_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "user_id",
ADD COLUMN     "receiver_user_id" INTEGER NOT NULL,
ADD COLUMN     "sender_user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "messages_sender_user_id_idx" ON "messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "messages_receiver_user_id_idx" ON "messages"("receiver_user_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_user_id_fkey" FOREIGN KEY ("receiver_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
