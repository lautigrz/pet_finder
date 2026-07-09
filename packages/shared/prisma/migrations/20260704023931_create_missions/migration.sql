-- CreateTable
CREATE TABLE "missions" (
    "mission_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "missions_pkey" PRIMARY KEY ("mission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "missions_public_id_key" ON "missions"("public_id");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
