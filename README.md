# 🐾 Pet Alert

Este proyecto es un **monorepo** que aloja los servicios de Pet Alert, dividido en paquetes para separar responsabilidades y escalar fácilmente.

---

## 📁 Estructura del proyecto

```
pet-alert/
├── packages/
│   ├── api/                        # Servidor HTTP principal (Express)
│   │   ├── src/
│   │   │   ├── domain/             # Entidades, modelos e interfaces de repositorios
│   │   │   ├── application/
│   │   │   │   └── usecase/
│   │   │   │       └── __tests__/  # Tests unitarios de casos de uso
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma/         # Cliente de Prisma (singleton)
│   │   │   │   ├── repository/
│   │   │   │   │   └── __tests__/  # Tests de integración de repositorios
│   │   │   │   ├── middleware/
│   │   │   │   └── logger/
│   │   │   └── presentation/
│   │   │       ├── controller/
│   │   │       │   └── __tests__/  # Tests unitarios de controllers
│   │   │       ├── router/
│   │   │       ├── dto/
│   │   │       └── handler/
│   │   ├── e2e/                    # Tests end-to-end (endpoints completos)
│   │   ├── .env                    # Variables propias de api (no se sube)
│   │   └── .env.example            # Plantilla de variables de api
│   │
│   ├── pet-matcher/                # Worker en segundo plano (embeddings + matching via Redis)
│   │   ├── src/
│   │   │   └── **/__tests__/       # Tests unitarios del matcher
│   │   └── .env.example            # Plantilla de variables de pet-matcher
│   │
│   └── shared/                     # Librería interna compartida — NO es un servicio
│       ├── src/                    # Tipos, schemas y constantes compartidas entre servicios
│       └── prisma/
│           ├── schema.prisma       # Fuente única de verdad del schema de DB
│           └── migrations/         # Historial de migraciones (se sube al repo)
│
├── .env                            # Variables compartidas entre servicios (no se sube)
├── .env.example                    # Plantilla de variables compartidas
├── tsconfig.base.json              # Configuración base de TypeScript compartida
├── turbo.json                      # Orquestación de tareas del monorepo
└── package.json                    # Raíz del monorepo (npm workspaces)
```

---

## 💡 Conceptos clave del monorepo

Antes de arrancar, es importante entender cómo está organizado el proyecto:

**`api` y `pet-matcher` son servicios** — procesos Node independientes que se deployán por separado. Cada uno tiene su propio `.env`, su propio Docker y su propio ciclo de deploy.

**`shared` es una librería interna** — no es un servicio, no se deploya, no tiene Docker. Se compila a `dist/` y los demás servicios lo importan. Acá viven los tipos, schemas y constantes que usan más de un servicio.

**La comunicación entre servicios es exclusivamente por Redis** — `api` publica eventos, `pet-matcher` los escucha. No hay llamadas HTTP directas entre servicios.

**El schema de Prisma vive en `shared`** — es la fuente única de verdad de la base de datos. Ambos servicios se conectan a la misma DB pero cada uno tiene su propia instancia del cliente Prisma.

---

## ⚙️ Variables de entorno

Las variables están divididas en dos niveles para separar lo compartido de lo específico:

**`.env` raíz** — variables compartidas entre `api` y `pet-matcher`:
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

> ⚠️ Nunca subir los `.env` al repositorio. Solo los `.env.example` van al repo.

---

## 🚀 Levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/lautigrz/pet_alert.git
cd pet-alert
```

### 2. Instalar dependencias

Un solo comando desde la raíz instala todo el monorepo:

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

Esto crea las tablas en la base de datos y genera el cliente de Prisma automáticamente.

### 6. Levantar los servicios

```bash
npm run dev
```

Turborepo se encarga de compilar `shared` primero y luego levantar `api` y `pet-matcher` en paralelo. No hace falta levantar nada manualmente en orden.

---

## 🔄 Turborepo

El proyecto usa **Turborepo** para orquestar las tareas del monorepo. Cuando corrés un comando desde la raíz, Turbo lee el grafo de dependencias y ejecuta las tareas en el orden correcto.

```
npm run dev
    │
    ├── shared:build    ← compila shared primero (api y pet-matcher dependen de él)
    │       ↓
    ├── api:dev         ← levanta en paralelo
    └── pet-matcher:dev ← levanta en paralelo
```

**El caché** es la otra ventaja clave — si no cambiaste nada en `shared`, Turbo no lo recompila, usa el resultado cacheado. Si cambiás solo `api`, `pet-matcher` no se toca. Esto acelera los builds en local y especialmente en CI/CD.

```
Cambiás algo en api     → solo api se rebuilea
Cambiás algo en shared  → shared + api + pet-matcher se rebuilean (dependen de shared)
```

---

## 🗄️ Comandos de Prisma

Todos los comandos de Prisma se corren desde la **raíz del monorepo**. El schema vive en `packages/shared/prisma/schema.prisma`.

| Comando | Cuándo usarlo |
|---------|---------------|
| `npm run prisma:migrate` | Cuando modificás el `schema.prisma` — crea la migración, la aplica y regenera el cliente |
| `npm run prisma:generate` | Solo si cambiás el schema sin querer migrar todavía |

> ⚠️ `prisma:migrate` ya corre `prisma:generate` automáticamente al final. No hace falta correr los dos.

### Otros comandos útiles

```bash
# Aplicar migraciones en producción (no crea nuevas, solo aplica las pendientes)
npx dotenv -e .env -- prisma migrate deploy --schema packages/shared/prisma/schema.prisma

# Resetear la base de datos — ⚠️ borra todos los datos
npm run prisma:migrate -- --reset

# Abrir Prisma Studio (interfaz visual para explorar la DB)
npx dotenv -e .env -- prisma studio --schema packages/shared/prisma/schema.prisma
```

---

## 🧪 Testing

El proyecto usa **Vitest** como framework de testing con tres niveles:

**Unitarios** — testean lógica aislada mockeando DB y Redis. Viven en carpetas `__tests__/` dentro de la capa que testean.

**Integración** — testean que las capas funcionan juntas (repositorios contra DB real, eventos Redis).

**E2E** — testean endpoints HTTP completos con Supertest. Viven en `packages/api/e2e/`.

### Convención de archivos

```
controller/
  health.controller.ts
  __tests__/
    health.controller.test.ts   ← tests del controller
```

### Comandos

Desde la raíz corre los tests de todos los paquetes:

```bash
npm run test
```

Desde un paquete específico:

```bash
cd packages/api
npm run test          # corre una vez
npm run test:watch    # modo watch para desarrollo
npm run test:coverage # genera reporte de cobertura
```

> ⚠️ Los tests unitarios y E2E nunca tocan la DB ni Redis reales — siempre mockear las dependencias externas.

---

## 🛠️ Scripts disponibles

Desde la raíz del monorepo:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Compila `shared` y levanta todos los servicios en paralelo |
| `npm run build` | Compila todos los paquetes en orden |
| `npm run test` | Corre los tests de todos los paquetes |
| `npm run prisma:migrate` | Crea y aplica migraciones de DB |
| `npm run prisma:generate` | Regenera el cliente de Prisma |

---

## 🌐 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Healthcheck del servidor |

---

## 📦 Dependencias principales

| Paquete | Usado en | Descripción |
|---------|----------|-------------|
| `express` | `api` | Framework HTTP |
| `prisma` / `@prisma/client` | `shared`, `api`, `pet-matcher` | ORM para PostgreSQL |
| `ioredis` | `api`, `pet-matcher` | Cliente de Redis |
| `bullmq` | `pet-matcher` | Manejo de colas de trabajo |
| `winston` | `api`, `pet-matcher` | Logging |
| `dotenv` | `api`, `shared` | Variables de entorno |
| `vitest` | `api`, `pet-matcher` | Framework de testing |
| `supertest` | `api` | Testing de endpoints HTTP |
| `turbo` | raíz | Orquestador de tareas del monorepo |

---

## 🔑 Reglas del monorepo

- **Cada servicio declara todas sus dependencias** — aunque npm las hoistee al `node_modules` raíz en local, en producción cada contenedor necesita tener todo declarado en su `package.json`. Si lo usás, lo declarás.
- **Los comandos de Prisma siempre desde la raíz** — los scripts apuntan al schema correcto automáticamente.
- **`shared` no se deploya** — solo se compila. Nunca agregar lógica de negocio ni código específico de un servicio en `shared`.
- **No mezclar variables de entorno** — las compartidas van al `.env` raíz, las específicas al `.env` de cada servicio.
- **El caché de Turbo no se sube al repo** — `.turbo/` está en el `.gitignore`.