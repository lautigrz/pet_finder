-- CreateTable
CREATE TABLE "notification_preferences" (
    "notification_preference_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_radius" INTEGER NOT NULL DEFAULT 5,
    "lost_reports_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sighting_reports_enabled" BOOLEAN NOT NULL DEFAULT true,
    "matches_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifications_muted_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey"
        PRIMARY KEY ("notification_preference_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key"
ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "notification_preferences"
ADD CONSTRAINT "notification_preferences_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("user_id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Copy existing preferences from users
INSERT INTO "notification_preferences" (
    "user_id",
    "notification_radius",
    "lost_reports_enabled",
    "sighting_reports_enabled",
    "matches_enabled",
    "notifications_muted_until",
    "created_at",
    "updated_at"
)
SELECT
    "user_id",
    "notification_radius",
    true,
    true,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users";

-- Remove the old column only after copying its values
ALTER TABLE "users"
DROP COLUMN "notification_radius";