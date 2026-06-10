-- Normaliza breed/color de texto libre a FK (breed_id / color_id) preservando los datos existentes.
-- Estrategia expand -> backfill -> contract.

-- 1. Agregar columnas FK como nullable (para poder backfillear antes de exigirlas)
ALTER TABLE "pets" ADD COLUMN "color_id" SMALLINT;
ALTER TABLE "pets" ADD COLUMN "breed_id" SMALLINT;
ALTER TABLE "sighting_report_details" ADD COLUMN "color_id" SMALLINT;
ALTER TABLE "sighting_report_details" ADD COLUMN "breed_id" SMALLINT;

-- 2. Preservar colores que estén en los datos pero no en el catálogo (match case-insensitive)
INSERT INTO "colors" ("name")
SELECT DISTINCT TRIM("pets"."color")
FROM "pets"
WHERE "pets"."color" IS NOT NULL AND TRIM("pets"."color") <> ''
  AND NOT EXISTS (SELECT 1 FROM "colors" c WHERE LOWER(c."name") = LOWER(TRIM("pets"."color")))
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "colors" ("name")
SELECT DISTINCT TRIM("sighting_report_details"."color")
FROM "sighting_report_details"
WHERE "sighting_report_details"."color" IS NOT NULL AND TRIM("sighting_report_details"."color") <> ''
  AND NOT EXISTS (SELECT 1 FROM "colors" c WHERE LOWER(c."name") = LOWER(TRIM("sighting_report_details"."color")))
ON CONFLICT ("name") DO NOTHING;

-- Garantizar un color de fallback para registros sin color resoluble
INSERT INTO "colors" ("name") VALUES ('Otro') ON CONFLICT ("name") DO NOTHING;

-- 3. Preservar razas no catalogadas (la raza es por especie -> matchear también animal_type_id)
INSERT INTO "breeds" ("name", "animal_type_id")
SELECT DISTINCT TRIM("pets"."breed"), "pets"."animal_type_id"
FROM "pets"
WHERE "pets"."breed" IS NOT NULL AND TRIM("pets"."breed") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "breeds" b
    WHERE LOWER(b."name") = LOWER(TRIM("pets"."breed")) AND b."animal_type_id" = "pets"."animal_type_id"
  )
ON CONFLICT ("name", "animal_type_id") DO NOTHING;

INSERT INTO "breeds" ("name", "animal_type_id")
SELECT DISTINCT TRIM("sighting_report_details"."breed"), "sighting_report_details"."animal_type_id"
FROM "sighting_report_details"
WHERE "sighting_report_details"."breed" IS NOT NULL AND TRIM("sighting_report_details"."breed") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "breeds" b
    WHERE LOWER(b."name") = LOWER(TRIM("sighting_report_details"."breed")) AND b."animal_type_id" = "sighting_report_details"."animal_type_id"
  )
ON CONFLICT ("name", "animal_type_id") DO NOTHING;

-- 4. Backfill de color_id (case-insensitive)
UPDATE "pets" SET "color_id" = c."color_id"
FROM "colors" c
WHERE LOWER(TRIM("pets"."color")) = LOWER(c."name");

UPDATE "sighting_report_details" SET "color_id" = c."color_id"
FROM "colors" c
WHERE LOWER(TRIM("sighting_report_details"."color")) = LOWER(c."name");

-- 5. Backfill de breed_id (por especie)
UPDATE "pets" SET "breed_id" = b."breed_id"
FROM "breeds" b
WHERE "pets"."breed" IS NOT NULL AND TRIM("pets"."breed") <> ''
  AND LOWER(TRIM("pets"."breed")) = LOWER(b."name")
  AND b."animal_type_id" = "pets"."animal_type_id";

UPDATE "sighting_report_details" SET "breed_id" = b."breed_id"
FROM "breeds" b
WHERE "sighting_report_details"."breed" IS NOT NULL AND TRIM("sighting_report_details"."breed") <> ''
  AND LOWER(TRIM("sighting_report_details"."breed")) = LOWER(b."name")
  AND b."animal_type_id" = "sighting_report_details"."animal_type_id";

-- 6. Fallback: cualquier color_id sin resolver (color vacío/nulo) -> 'Otro'
UPDATE "pets"
SET "color_id" = (SELECT "color_id" FROM "colors" WHERE "name" = 'Otro' LIMIT 1)
WHERE "color_id" IS NULL;

UPDATE "sighting_report_details"
SET "color_id" = (SELECT "color_id" FROM "colors" WHERE "name" = 'Otro' LIMIT 1)
WHERE "color_id" IS NULL;

-- 7. Exigir color_id (color era obligatorio); breed_id queda opcional
ALTER TABLE "pets" ALTER COLUMN "color_id" SET NOT NULL;
ALTER TABLE "sighting_report_details" ALTER COLUMN "color_id" SET NOT NULL;

-- 8. Borrar las columnas viejas de texto
ALTER TABLE "pets" DROP COLUMN "color";
ALTER TABLE "pets" DROP COLUMN "breed";
ALTER TABLE "sighting_report_details" DROP COLUMN "color";
ALTER TABLE "sighting_report_details" DROP COLUMN "breed";

-- 9. Foreign keys
ALTER TABLE "pets" ADD CONSTRAINT "pets_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pets" ADD CONSTRAINT "pets_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("breed_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sighting_report_details" ADD CONSTRAINT "sighting_report_details_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("breed_id") ON DELETE SET NULL ON UPDATE CASCADE;
