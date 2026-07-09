-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL,
ADD COLUMN     "google_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
