# 🐾 Pet Alert API

## 🚀 Levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/pet-alert.git
cd pet-alert
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editá el `.env` con tus valores:

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
DATABASE_URL="postgresql://usuario:password@localhost:5432/pet_alert"

```

### 4. Levantar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

---

## 🗄️ Base de datos

### Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE pet_alert;
```

O desde la terminal:

```bash
psql -U postgres -c "CREATE DATABASE pet_alert;"
```

### Verificar la conexión

Asegurate de que el `DATABASE_URL` en el `.env` tenga el usuario, password y nombre de la BD correctos:

```bash
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/pet_alert"
```

---

## 🔄 Comandos de Prisma

### Crear una migración

Cuando modificás el `schema.prisma`, generás una migración con:

```bash
npx prisma migrate dev --name nombre_descriptivo
```

### Aplicar migraciones en producción

```bash
npx prisma migrate deploy
```

### Resetear la base de datos

⚠️ Borra todos los datos y vuelve a correr las migraciones desde cero.

```bash
npx prisma migrate reset
```

### Generar el cliente de Prisma

Se corre automáticamente con `migrate dev`, pero si necesitás regenerarlo:

```bash
npx prisma generate
```

### Ver el estado de las migraciones

```bash
npx prisma migrate status
```

### Abrir Prisma Studio

Interfaz visual para explorar y editar datos de la BD en el navegador:

```bash
npx prisma studio
```

---

## 📁 Estructura del proyecto

```
pet-alert/
├── prisma/
│   ├── schema.prisma       # Definición de modelos
│   └── migrations/         # Migraciones generadas
├── src/
│   ├── domain/
│   │   ├── model/          # Entidades y Value Objects
│   │   ├── repository/     # Interfaces de repositorios
│   │   └── service/        # Lógica de negocio pura
│   ├── application/
│   │   ├── usecase/        # Varios pasos, orquestacion
│   │   └── service/        # Un solo paso simple
│   ├── infrastructure/
│   │   ├── prisma/         # Cliente de Prisma (singleton)
│   │   ├── repository/     # Implementaciones de repositorios
│   │   ├── middleware/     # Rate limit, logging
│   │   └── logger/         # Configuración de Winston
│   └── presentation/
│       ├── controller/     # Controllers
│       ├── router/         # Rutas de Express
│       ├── dto/            # Data Transfer Objects
│       └── handler/        # Manejo global de errores
├── app.ts                  # Configuración de Express
├── server.ts               # Entry point
├── .env                    # Variables de entorno (no se sube)
├── .env.example            # Plantilla de variables de entorno
└── tsconfig.json
```

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta el servidor en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a JavaScript en `/dist` |
| `npm start` | Corre el servidor compilado en producción |

---

## 🌐 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Healthcheck del servidor |

---

## 📦 Dependencias principales

| Paquete | Descripción |
|---------|-------------|
| `express` | Framework HTTP |
| `prisma` | ORM para PostgreSQL |
| `winston` | Logging |
| `cors` | Configuración de CORS |
| `dotenv` | Variables de entorno |