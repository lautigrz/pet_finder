-- CreateTable
CREATE TABLE "match_views" (
    "match_view_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "match_result_id" INTEGER NOT NULL,
    "seen_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_views_pkey" PRIMARY KEY ("match_view_id")
);

-- CreateIndex
CREATE INDEX "match_views_user_id_idx" ON "match_views"("user_id");

-- CreateIndex
CREATE INDEX "match_views_match_result_id_idx" ON "match_views"("match_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_views_user_id_match_result_id_key" ON "match_views"("user_id", "match_result_id");

-- AddForeignKey
ALTER TABLE "match_views" ADD CONSTRAINT "match_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_views" ADD CONSTRAINT "match_views_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_results"("match_result_id") ON DELETE CASCADE ON UPDATE CASCADE;
