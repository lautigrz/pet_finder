-- CreateTable
CREATE TABLE "point_value_contexts" (
    "point_value_id" INTEGER NOT NULL,
    "context" VARCHAR(50) NOT NULL,

    CONSTRAINT "point_value_contexts_pkey" PRIMARY KEY ("point_value_id","context")
);

-- AddForeignKey
ALTER TABLE "point_value_contexts" ADD CONSTRAINT "point_value_contexts_point_value_id_fkey" FOREIGN KEY ("point_value_id") REFERENCES "point_values"("point_value_id") ON DELETE CASCADE ON UPDATE CASCADE;
