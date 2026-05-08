# 🐾 Pet Alert

Este proyecto es un **monorepo** que aloja los servicios de Pet Alert, dividido en paquetes para separar responsabilidades y escalar fácilmente.

---

## 📁 Estructura del proyecto

```
pet-alert/
├── packages/
│   ├── api/                  # Servidor HTTP principal (Express + Arquitectura Hexagonal)
│   │   ├── src/
│   │   │   ├── domain/       # Entidades, modelos e interfaces de repositorios
│   │   │   ├── application/  # Casos de uso y lógica de negocio
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma/   # Cliente de Prisma (singleton)
│   │   │   │   ├── repository/
│   │   │   │   ├── middleware/
│   │   │   │   └── logger/
│   │   │   └── presentation/
│   │   │       ├── controller/
│   │   │       ├── router/
│   │   │       ├── dto/
│   │   │       └── handler/
│   │   ├── .env              # Variables propias de api (no se sube)
│   │   └── .env.example      # Plantilla de variables de api
│   │
│   ├── pet-matcher/          # Worker en segundo plano (embeddings + matching via Redis)
│   │   ├── src/
│   │   └── .env.example      # Plantilla de variables de pet-matcher
│   │
│   └── shared/               # Librería interna compartida (NO es un servicio)
│       ├── src/              # Tipos, schemas y constantes compartidas
│       └── prisma/
│           ├── schema.prisma # Fuente única de verdad del schema de DB
│           └── migrations/
│
├── .env                      # Variables compartidas entre servicios (no se sube)
├── .env.example              # Plantilla de variables compartidas
├── package.json              # Raíz del monorepo (npm workspaces)
└── turbo.json                # Configuración de Turborepo
```

---

## ⚙️ Variables de entorno

Las variables están divididas en dos niveles:

**`.env` raíz** — variables compartidas entre servicios:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/pet_alert"
REDIS_URL="redis://localhost:6379"
```

**`packages/api/.env`** — variables específicas de la API:
```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

Copiá los `.env.example` correspondientes para empezar:
```bash
cp .env.example .env
cp packages/api/.env.example packages/api/.env
```

---

## 🚀 Levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/lautigrz/pet_alert.git
cd pet-alert
```

### 2. Instalar dependencias

Desde la raíz — instala todo el monorepo de una vez:

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
cp packages/api/.env.example packages/api/.env
```

Editá cada `.env` con tus valores locales.

### 4. Crear la base de datos

```bash
psql -U postgres -c "CREATE DATABASE pet_alert;"
```

### 5. Correr migraciones

```bash
npm run prisma:migrate
```

### 6. Levantar los servicios

```bash
# Levantar todo el monorepo (recomendado)
npm run dev

# O por separado:
cd packages/api && npm run dev
cd packages/pet-matcher && npm run dev
```

---

## 🗄️ Comandos de Prisma

Todos los comandos de Prisma se corren desde la **raíz del monorepo**. El schema vive en `packages/shared/prisma/schema.prisma`.

| Comando | Descripción |
|---------|-------------|
| `npm run prisma:migrate` | Crea y aplica una nueva migración (usar en desarrollo) |
| `npm run prisma:generate` | Regenera el cliente de Prisma (correr después de cambiar el schema sin migrar) |

> ⚠️ Cada vez que modificás el `schema.prisma`, tenés que correr `prisma:migrate`. Esto regenera el cliente automáticamente.

### Aplicar migraciones en producción

```bash
npx dotenv -e .env -- prisma migrate deploy --schema packages/shared/prisma/schema.prisma
```

### Resetear la base de datos (⚠️ borra todos los datos)

```bash
npm run prisma:migrate -- --reset
```

### Abrir Prisma Studio

```bash
npx dotenv -e .env -- prisma studio --schema packages/shared/prisma/schema.prisma
```

---

## 🛠️ Scripts disponibles

Desde la raíz del monorepo:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta todos los servicios en modo desarrollo |
| `npm run build` | Compila todos los paquetes |
| `npm run prisma:migrate` | Crea y aplica migraciones |
| `npm run prisma:generate` | Regenera el cliente de Prisma |
| `npm run test` | Corre los test en el modulo que estas |

---

## 🌐 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Healthcheck del servidor |

---

## 📦 Dependencias principales

| Paquete | Usado en | Descripción |
|---------|----------|-------------|
| `express` | `api` | Framework HTTP |
| `prisma` / `@prisma/client` | `shared`, `api` | ORM para PostgreSQL |
| `ioredis` | `api`, `pet-matcher` | Cliente de Redis |
| `bullmq` | `pet-matcher` | Manejo de colas de trabajo |
| `winston` | `api` | Logging |
| `dotenv` | `api`, `shared` | Variables de entorno |


---

## 🔑 Consideraciones importantes

- **El schema de Prisma vive en `shared`** — no modificar los clientes de cada servicio, solo el schema central.
- **Los comandos de Prisma se corren siempre desde la raíz** — los scripts del `package.json` raíz apuntan al schema correcto.
- **Cada servicio declara sus propias dependencias** — aunque npm las hoistee al root, cada `package.json` debe tener todo lo que usa para que funcione en producción (Docker/Railway).
- **`shared` no es un servicio** — no tiene Docker, no se deploya, solo se compila y los demás lo importan.