-- Datos de catalogo (idempotente).
-- Reemplaza la dependencia de seed.ts/tsx en el deploy: estos INSERT se aplican
-- con `prisma migrate deploy`. ON CONFLICT DO NOTHING = seguro sobre bases ya pobladas.

-- Roles
INSERT INTO "roles" ("role_id", "name") VALUES
  (1, 'ADMIN'),
  (2, 'USER')
ON CONFLICT ("role_id") DO NOTHING;

-- Estados de reporte
INSERT INTO "report_statuses" ("report_status_id", "name") VALUES
  (1, 'ACTIVE'),
  (2, 'RESOLVED'),
  (3, 'CLOSED')
ON CONFLICT ("report_status_id") DO NOTHING;

-- Tipos de reporte
INSERT INTO "report_types" ("report_type_id", "name") VALUES
  (1, 'LOST'),
  (2, 'SIGHTING')
ON CONFLICT ("report_type_id") DO NOTHING;

-- Tipos de animal
INSERT INTO "animal_types" ("animal_type_id", "name") VALUES
  (1, 'DOG'),
  (2, 'CAT')
ON CONFLICT ("animal_type_id") DO NOTHING;

-- Generos
INSERT INTO "genders" ("gender_id", "name") VALUES
  (1, 'MALE'),
  (2, 'FEMALE')
ON CONFLICT ("gender_id") DO NOTHING;

-- Tamanos de mascota
INSERT INTO "pet_sizes" ("size_id", "name") VALUES
  (1, 'SMALL'),
  (2, 'MEDIUM'),
  (3, 'LARGE')
ON CONFLICT ("size_id") DO NOTHING;

-- Colores (PK autoincremental, unico por name)
INSERT INTO "colors" ("name") VALUES
  ('Negro'), ('Blanco'), ('Marrón'), ('Gris'), ('Atigrado'), ('Naranja'),
  ('Crema'), ('Beige'), ('Dorado'), ('Negro y blanco'), ('Marrón y blanco'),
  ('Tricolor'), ('Manchado'), ('Otro')
ON CONFLICT ("name") DO NOTHING;

-- Razas (PK autoincremental, unico por (name, animal_type_id))
INSERT INTO "breeds" ("name", "animal_type_id") VALUES
  ('Mestizo', 1), ('Labrador', 1), ('Caniche', 1), ('Bulldog', 1),
  ('Pastor Alemán', 1), ('Golden Retriever', 1), ('Chihuahua', 1), ('Boxer', 1),
  ('Dálmata', 1), ('Salchicha', 1), ('Pitbull', 1), ('Rottweiler', 1),
  ('Beagle', 1), ('Border Collie', 1), ('Pug', 1), ('Otra', 1),
  ('Mestizo', 2), ('Siamés', 2), ('Persa', 2), ('Angora', 2), ('Bengalí', 2),
  ('Maine Coon', 2), ('Esfinge', 2), ('Común europeo', 2), ('Otra', 2)
ON CONFLICT ("name", "animal_type_id") DO NOTHING;

-- Tipos de objetivo de denuncia
INSERT INTO "content_report_target_types" ("content_report_target_type_id", "name") VALUES
  (1, 'CHAT'),
  (2, 'POST'),
  (3, 'USER')
ON CONFLICT ("content_report_target_type_id") DO NOTHING;

-- Motivos de denuncia
INSERT INTO "content_report_reasons" ("content_report_reason_id", "name") VALUES
  (1, 'SUSPICIOUS_BEHAVIOR'),
  (2, 'FRAUD_OR_SCAM'),
  (3, 'IMPERSONATION'),
  (4, 'INAPPROPRIATE_CONTENT'),
  (5, 'PERSONAL_DATA_EXPOSED'),
  (6, 'FALSE_INFORMATION'),
  (7, 'SPAM'),
  (8, 'DUPLICATE_REPORT'),
  (9, 'OTHER')
ON CONFLICT ("content_report_reason_id") DO NOTHING;

-- Estados de denuncia
INSERT INTO "content_report_statuses" ("content_report_status_id", "name") VALUES
  (1, 'PENDING'),
  (2, 'REVIEWED'),
  (3, 'DISMISSED'),
  (4, 'SUSPENDED')
ON CONFLICT ("content_report_status_id") DO NOTHING;

-- Estados de mision
INSERT INTO "mission_statuses" ("mission_status_id", "name") VALUES
  (1, 'OPEN'),
  (2, 'IN_PROGRESS'),
  (3, 'CLOSED')
ON CONFLICT ("mission_status_id") DO NOTHING;

-- Definiciones de logros (PK autoincremental, unico por code)
INSERT INTO "achievement_definitions" ("code", "name", "description", "required_xp", "icon") VALUES
  ('FIRST_RESCUE', 'Primer rescate', 'Alcanzá 10 XP colaborando en la comunidad.', 10, '🐾'),
  ('SOLIDARY_NEIGHBOR', 'Vecino solidario', 'Alcanzá 50 XP aportando a búsquedas y reportes.', 50, '🏠'),
  ('URBAN_EXPLORER', 'Explorador urbano', 'Alcanzá 100 XP ayudando a reunir mascotas con sus familias.', 100, '👁️'),
  ('GIANT_HEART', 'Corazón gigante', 'Alcanzá 250 XP sosteniendo la red de ayuda.', 250, '❤️'),
  ('WEEKLY_STREAK', 'Fuerza imparable', 'Alcanzá 500 XP impulsando a la comunidad.', 500, '🔥'),
  ('COMMUNITY_BOND', 'Vínculo comunitario', 'Alcanzá 750 XP fortaleciendo la red de ayuda.', 750, '🔗'),
  ('FREQUENT_SIGHTER', 'Avistador frecuente', 'Alcanzá 1000 XP participando activamente en reportes.', 1000, '👁️'),
  ('CERTIFIED_CAREGIVER', 'Cuidador certificado', 'Alcanzá 1250 XP demostrando compromiso con la comunidad.', 1250, '🛡️')
ON CONFLICT ("code") DO NOTHING;

-- Valores de puntos (PK autoincremental, unico por points)
INSERT INTO "point_values" ("points", "label") VALUES
  (10, 'Básico'),
  (25, 'Bueno'),
  (50, 'Excelente'),
  (75, 'Sobresaliente'),
  (100, 'Máximo')
ON CONFLICT ("points") DO NOTHING;

-- Contextos de cada valor de puntos (PK compuesta); se referencia por points
INSERT INTO "point_value_contexts" ("point_value_id", "context")
SELECT pv."point_value_id", c."context"
FROM (VALUES
  (10, 'COMMENT'),
  (25, 'COMMENT'),
  (50, 'COMMENT'),
  (50, 'MISSION_COMPLETION'),
  (75, 'MISSION_COMPLETION'),
  (100, 'MISSION_COMPLETION')
) AS c("points", "context")
JOIN "point_values" pv ON pv."points" = c."points"
ON CONFLICT ("point_value_id", "context") DO NOTHING;
