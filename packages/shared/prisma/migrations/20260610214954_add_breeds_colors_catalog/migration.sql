-- CreateTable
CREATE TABLE "breeds" (
    "breed_id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "animal_type_id" SMALLINT NOT NULL,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("breed_id")
);

-- CreateTable
CREATE TABLE "colors" (
    "color_id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("color_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "breeds_name_animal_type_id_key" ON "breeds"("name", "animal_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "colors_name_key" ON "colors"("name");

-- AddForeignKey
ALTER TABLE "breeds" ADD CONSTRAINT "breeds_animal_type_id_fkey" FOREIGN KEY ("animal_type_id") REFERENCES "animal_types"("animal_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
