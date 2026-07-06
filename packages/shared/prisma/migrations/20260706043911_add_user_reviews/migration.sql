-- CreateTable
CREATE TABLE "user_reviews" (
    "user_review_id" SERIAL NOT NULL,
    "reviewer_user_id" INTEGER NOT NULL,
    "reviewed_user_id" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("user_review_id")
);

-- CreateIndex
CREATE INDEX "user_reviews_reviewed_user_id_idx" ON "user_reviews"("reviewed_user_id");

-- CreateIndex
CREATE INDEX "user_reviews_reviewer_user_id_idx" ON "user_reviews"("reviewer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reviews_reviewer_user_id_reviewed_user_id_key" ON "user_reviews"("reviewer_user_id", "reviewed_user_id");

-- AddForeignKey
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
