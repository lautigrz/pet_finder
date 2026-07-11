-- CreateTable
CREATE TABLE "mission_coverages" (
    "mission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "geohash_cell" VARCHAR(8) NOT NULL,
    "first_visited_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_visited_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_coverages_pkey" PRIMARY KEY ("mission_id","user_id","geohash_cell")
);

-- AddForeignKey
ALTER TABLE "mission_coverages" ADD CONSTRAINT "mission_coverages_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_coverages" ADD CONSTRAINT "mission_coverages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
