-- CreateTable
CREATE TABLE "report_followers" (
    "report_follower_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_followers_pkey" PRIMARY KEY ("report_follower_id")
);

-- CreateIndex
CREATE INDEX "report_followers_user_id_idx" ON "report_followers"("user_id");

-- CreateIndex
CREATE INDEX "report_followers_report_id_idx" ON "report_followers"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_followers_user_id_report_id_key" ON "report_followers"("user_id", "report_id");

-- AddForeignKey
ALTER TABLE "report_followers" ADD CONSTRAINT "report_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_followers" ADD CONSTRAINT "report_followers_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
