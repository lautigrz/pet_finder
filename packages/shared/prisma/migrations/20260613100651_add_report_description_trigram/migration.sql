-- Habilita búsqueda por trigramas en PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para acelerar búsquedas sobre la descripción
CREATE INDEX IF NOT EXISTS "reports_description_trgm_idx"
ON "reports"
USING GIN ("description" gin_trgm_ops)
WHERE "description" IS NOT NULL;