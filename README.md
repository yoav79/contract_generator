# Contract Generator

Bootstrap técnico para una aplicación de generación controlada de contratos legales.

Abogados gestionarán templates DOCX con placeholders. Personal administrativo completará formularios para generar PDFs finales, sin acceso al DOCX editable.

## Requisitos

- Node.js 20+
- npm
- PostgreSQL instalado localmente

## Instalación

```bash
npm install
```

## Base de datos local (PostgreSQL)

Crea la base de datos manualmente en tu instancia local de PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE contract_generator;"
```

Si usas otro usuario o método de autenticación, adapta el comando según tu entorno.

## Variables de entorno

Copia el archivo de ejemplo y configura tus credenciales locales:

```bash
cp .env.example .env
```

Edita `.env` y reemplaza `USER` y `PASSWORD` en `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/contract_generator?schema=public"
```

No versiones `.env` con credenciales reales.

## Prisma

Genera el cliente de Prisma:

```bash
npm run db:generate
```

Aplica la migración inicial:

```bash
npm run db:migrate
```

Opcional: abre Prisma Studio para inspeccionar la base de datos:

```bash
npm run db:studio
```

### Usuarios de prueba (desarrollo local)

Carga o actualiza usuarios de prueba de forma idempotente:

```bash
npm run db:seed
```

Credenciales **solo para desarrollo local** — no uses estas contraseñas en producción:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Abogado (`LAWYER`) | `lawyer@local.dev` | `ChangeMeLawyer123!` |
| Personal administrativo (`ADMIN_STAFF`) | `admin@local.dev` | `ChangeMeAdmin123!` |

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura base

```text
src/
  app/                 # App Router (Next.js)
  lib/db.ts            # Cliente Prisma compartido
  server/documents/    # Stubs para lógica documental futura
prisma/
  schema.prisma        # Modelos iniciales del dominio
storage/               # Archivos locales (gitignored)
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:migrate` | Ejecuta migraciones en desarrollo |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Crea o actualiza usuarios de prueba locales |

## Estado actual

Este repositorio contiene únicamente el bootstrap técnico:

- Next.js (App Router) + TypeScript + ESLint
- Prisma + PostgreSQL
- Esquema inicial de dominio
- Stubs documentales sin implementación de negocio

Pendiente para fases siguientes: login/logout, upload DOCX, generación PDF y UI de negocio.

Usuarios de prueba locales disponibles vía `npm run db:seed` (ver sección Prisma).
