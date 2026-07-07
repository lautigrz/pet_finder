-- CreateTable
CREATE TABLE "achievement_definitions" (
    "achievement_definition_id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "required_xp" INTEGER NOT NULL,
    "icon" VARCHAR(20),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "achievement_definitions_pkey" PRIMARY KEY ("achievement_definition_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievement_definitions_code_key" ON "achievement_definitions"("code");
