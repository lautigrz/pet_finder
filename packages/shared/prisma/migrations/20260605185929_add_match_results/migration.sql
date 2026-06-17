-- CreateTable
CREATE TABLE "match_results" (
    "match_result_id" SERIAL NOT NULL,
    "source_report_id" INTEGER NOT NULL,
    "candidate_report_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "image_score" DOUBLE PRECISION NOT NULL,
    "description_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("match_result_id")
);

-- CreateIndex
CREATE INDEX "match_results_source_report_id_idx" ON "match_results"("source_report_id");

-- CreateIndex
CREATE INDEX "match_results_score_idx" ON "match_results"("score");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_source_report_id_candidate_report_id_key" ON "match_results"("source_report_id", "candidate_report_id");

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_source_report_id_fkey" FOREIGN KEY ("source_report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_candidate_report_id_fkey" FOREIGN KEY ("candidate_report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;
