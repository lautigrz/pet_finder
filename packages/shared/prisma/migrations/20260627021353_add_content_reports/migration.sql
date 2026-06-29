-- CreateTable
CREATE TABLE "content_reports" (
    "content_report_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "reporter_user_id" INTEGER NOT NULL,
    "target_type_id" SMALLINT NOT NULL,
    "target_public_id" UUID NOT NULL,
    "reason_id" SMALLINT NOT NULL,
    "status_id" SMALLINT NOT NULL,
    "description" TEXT,
    "auto_flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("content_report_id")
);

-- CreateTable
CREATE TABLE "content_report_target_types" (
    "content_report_target_type_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "content_report_target_types_pkey" PRIMARY KEY ("content_report_target_type_id")
);

-- CreateTable
CREATE TABLE "content_report_reasons" (
    "content_report_reason_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "content_report_reasons_pkey" PRIMARY KEY ("content_report_reason_id")
);

-- CreateTable
CREATE TABLE "content_report_statuses" (
    "content_report_status_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "content_report_statuses_pkey" PRIMARY KEY ("content_report_status_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_reports_public_id_key" ON "content_reports"("public_id");

-- CreateIndex
CREATE INDEX "content_reports_target_type_id_target_public_id_idx" ON "content_reports"("target_type_id", "target_public_id");

-- CreateIndex
CREATE INDEX "content_reports_status_id_idx" ON "content_reports"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_reports_reporter_user_id_target_type_id_target_publ_key" ON "content_reports"("reporter_user_id", "target_type_id", "target_public_id");

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_target_type_id_fkey" FOREIGN KEY ("target_type_id") REFERENCES "content_report_target_types"("content_report_target_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "content_report_reasons"("content_report_reason_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "content_report_statuses"("content_report_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;
