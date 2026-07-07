-- CreateTable
CREATE TABLE "appeals" (
    "appeal_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "appellant_user_id" INTEGER NOT NULL,
    "target_type_id" SMALLINT NOT NULL,
    "target_public_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("appeal_id")
);

-- CreateTable
CREATE TABLE "appeal_target_types" (
    "appeal_target_type_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "appeal_target_types_pkey" PRIMARY KEY ("appeal_target_type_id")
);

-- CreateTable
CREATE TABLE "appeal_statuses" (
    "appeal_status_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "appeal_statuses_pkey" PRIMARY KEY ("appeal_status_id")
);

-- AlterTable
ALTER TABLE "reports" ADD COLUMN "closed_by_moderation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "appeals_public_id_key" ON "appeals"("public_id");

-- CreateIndex
CREATE INDEX "appeals_status_id_idx" ON "appeals"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "appeals_target_type_id_target_public_id_key" ON "appeals"("target_type_id", "target_public_id");

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_appellant_user_id_fkey" FOREIGN KEY ("appellant_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_target_type_id_fkey" FOREIGN KEY ("target_type_id") REFERENCES "appeal_target_types"("appeal_target_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "appeal_statuses"("appeal_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed catalogs
INSERT INTO "appeal_target_types" ("appeal_target_type_id", "name") VALUES (1, 'POST'), (2, 'ACCOUNT');
INSERT INTO "appeal_statuses" ("appeal_status_id", "name") VALUES (1, 'PENDING'), (2, 'ACCEPTED'), (3, 'REJECTED');
