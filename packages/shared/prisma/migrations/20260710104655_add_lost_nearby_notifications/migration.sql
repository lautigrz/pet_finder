-- CreateTable
CREATE TABLE "lost_nearby_notifications" (
    "lost_nearby_notification_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" INTEGER NOT NULL,
    "report_public_id" UUID NOT NULL,
    "pet_name" VARCHAR(30),
    "report_image" VARCHAR(500),
    "report_address" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lost_nearby_notifications_pkey" PRIMARY KEY ("lost_nearby_notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lost_nearby_notifications_public_id_key" ON "lost_nearby_notifications"("public_id");

-- CreateIndex
CREATE INDEX "lost_nearby_notifications_user_id_idx" ON "lost_nearby_notifications"("user_id");

-- AddForeignKey
ALTER TABLE "lost_nearby_notifications" ADD CONSTRAINT "lost_nearby_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
