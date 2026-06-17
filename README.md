# Contract Generator

Aplicación para generación controlada de contratos legales.

Los abogados gestionan templates DOCX con placeholders. El personal administrativo completará formularios para generar PDFs finales, sin acceso al DOCX editable.

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

Edita `.env` y configura al menos:

- `DATABASE_URL` — conexión a PostgreSQL local
- `SESSION_SECRET` — secreto aleatorio de al menos 32 caracteres para cookies de sesión

No versiones `.env` con credenciales reales.

## Prisma

Genera el cliente de Prisma:

```bash
npm run db:generate
```

Aplica las migraciones en desarrollo:

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

## Probar `/lawyer/templates` (Fase 2)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Inicia el servidor con `npm run dev`.
3. Inicia sesión como `lawyer@local.dev`.
4. Entra a [http://localhost:3000/lawyer/templates](http://localhost:3000/lawyer/templates).
5. Completa el formulario con nombre, descripción opcional y un archivo `.docx` (máximo **10 MB**).
6. Confirma el mensaje de éxito y que el template aparece en la lista con metadata visible (estado, versión, archivo original, tamaño, hash parcial, fecha).

**Seguridad esperada:**

- `ADMIN_STAFF` no puede acceder a `/lawyer/templates` — el middleware redirige a `/dashboard`.
- `docxPath` y rutas privadas de storage **no** se exponen al cliente; solo metadata segura en la UI.

## Probar extracción y campos (Fase 3)

1. Crea un template DOCX con placeholders en formato `{{snake_case}}` (ver sección Fase 3).
2. Abre **Ver detalle** → [http://localhost:3000/lawyer/templates/{templateId}](http://localhost:3000/lawyer/templates).
3. Pulsa **Extraer placeholders** y confirma contadores (`validCount`, `createdCount`, etc.).
4. Edita cada campo: `label`, `fieldType`, `required`, `displayOrder` (la `key` es solo lectura).
5. Vuelve a extraer sobre el mismo DOCX y confirma que las configuraciones editadas se preservan.

**Seguridad esperada:**

- Solo el abogado propietario del template puede extraer y editar campos.
- `ADMIN_STAFF` no accede a `/lawyer/templates/*` ni ve formularios de extracción/edición.
- `docxPath`, rutas de `storage/` y contenido del DOCX **no** aparecen en la UI.

## Probar publicación y archivado (Fase 4)

1. Crea un template DOCX con al menos un placeholder válido (ver Fase 3).
2. Abre **Ver detalle** → extrae placeholders y configura labels si hace falta.
3. En estado `DRAFT`, confirma el checklist de publicación:
   - DOCX asociado: Sí
   - Al menos un campo detectado
   - Labels válidos (no vacíos, máximo 120 caracteres)
   - Versión en `DRAFT`
4. Pulsa **Publicar template** y confirma:
   - Estado del template y versión: `PUBLISHED`
   - `publishedAt` visible
   - Sin extracción ni formularios de edición
   - Campos en solo lectura
   - Botón **Archivar template** visible
5. Pulsa **Archivar template** y confirma:
   - Estado del template y versión: `ARCHIVED`
   - `publishedAt` conservado
   - Mensaje de template archivado
   - Sin acciones de publicar, archivar, extraer ni editar
6. Opcional: verifica en PostgreSQL (`npm run db:studio`) estados, `publishedAt`, campos intactos y auditoría `TEMPLATE_PUBLISHED` / `TEMPLATE_ARCHIVED`.

**Seguridad esperada:**

- Solo el abogado propietario puede publicar y archivar.
- `ADMIN_STAFF` no accede a `/lawyer/templates/*` — redirigido a `/dashboard`.
- `docxPath`, rutas de `storage/` y contenido del DOCX **no** aparecen en el HTML.

**Validación E2E realizada:** flujo `DRAFT` → `PUBLISHED` → `ARCHIVED` con Playwright; PostgreSQL, auditoría e inspección HTML sin rutas privadas confirmados.

## Storage local privado

Los archivos DOCX subidos se guardan en desarrollo bajo:

```text
storage/templates/{templateId}/v1/source.docx
```

- La carpeta `storage/` está **ignorada por Git** (salvo `storage/.gitkeep`).
- Los DOCX reales **no deben versionarse** en el repositorio.
- No se sirven archivos desde `public/`.

Rutas futuras previstas (aún sin uso completo): `storage/generated/`, `storage/temp/`.

## Estructura base

```text
src/
  app/                          # App Router (Next.js)
    (auth)/login/               # Login
    (protected)/                # Rutas protegidas por rol
      lawyer/templates/         # Gestión de templates DOCX (abogado)
        [templateId]/           # Detalle, extracción, edición, publicación y archivado
      admin/generate/           # Placeholder administrativo
  lib/
    auth/                       # Sesión, roles, autorización
    storage/                    # Rutas y guardado privado de DOCX
    audit/                      # Registro de auditoría
    db.ts                       # Cliente Prisma compartido
  server/
    templates/                  # Creación, extracción, campos, publicación y archivado
    documents/                  # Extracción de placeholders DOCX; render/PDF pendientes
prisma/
  schema.prisma                 # Modelos del dominio
storage/                        # Archivos locales (gitignored)
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

### Fase 1 — completada

- Autenticación con sesión (`iron-session`)
- Roles `LAWYER` y `ADMIN_STAFF`
- Middleware y guards de rutas protegidas
- Navegación contextual por rol (`/dashboard`, `/lawyer/*`, `/admin/*`)
- Login, logout y usuarios de prueba vía seed

### Fase 2 — completada

- Gestión inicial de templates DOCX para abogados en `/lawyer/templates`
- Creación de `ContractTemplate` + `ContractTemplateVersion` v1 en estado `DRAFT`
- Upload privado de DOCX con metadata en PostgreSQL (`docxSha256`, `originalFileName`, `fileSizeBytes`, `mimeType`, `docxPath` solo en servidor/BD)
- Storage local bajo `storage/templates/`
- Auditoría: `TEMPLATE_CREATED`, `TEMPLATE_VERSION_CREATED`, `TEMPLATE_UPLOAD_STORED`
- Lista de templates propios del abogado autenticado

### Fase 3 — completada

Extracción y configuración de campos DOCX para abogados.

**Dependencia:** [pizzip](https://github.com/open-xml-templating/pizzip) — descompresión de DOCX (ZIP OOXML).

**Formato permitido de placeholders:** `{{snake_case}}` — letras minúsculas, números y guion bajo; debe empezar con letra.

Ejemplos válidos:

- `{{nombre_cliente}}`
- `{{fecha_inicio}}`
- `{{monto_total}}`

Ejemplos inválidos (reportados, no persistidos):

- `{{NombreCliente}}` — mayúsculas
- `{{ campo }}` — espacios
- `{{campo-extra}}` — guiones
- `{{123}}` — empieza con número

**Flujo:**

- Extracción **manual** desde `/lawyer/templates/[templateId]` (botón **Extraer placeholders**).
- Lectura privada del DOCX desde `storage/` vía `readStoredDocx` (servidor).
- Procesamiento de `word/document.xml`, `word/header*.xml` y `word/footer*.xml`.
- Soporte básico para placeholders partidos entre nodos `<w:t>` (concatenación en orden).
- Creación/sincronización de `TemplateField` por versión en estado `DRAFT`.

**Configuración editable por campo:**

- `label`, `fieldType` (`TEXT`, `DATE`, `NUMBER`, `BOOLEAN`), `required`, `displayOrder`
- `key` **no editable** (identificador del placeholder en el DOCX)

**Política de re-extracción (MVP):**

- Keys existentes en DOCX → se **preservan** (`label`, `fieldType`, `required`, `displayOrder`).
- Keys nuevas en DOCX → se **crean** con defaults.
- Keys ausentes en DOCX → se **eliminan** como huérfanas.

**Auditoría:**

- `TEMPLATE_FIELDS_EXTRACTED` — extracción/sincronización de campos
- `TEMPLATE_FIELD_UPDATED` — edición de configuración de un campo

**Seguridad:**

- Solo `LAWYER` propietario del template (`createdById`).
- `ADMIN_STAFF` bloqueado en rutas `/lawyer/*`.
- `docxPath` y rutas privadas **no** se exponen en UI ni respuestas de Server Actions.

### Fase 4 — completada

Publicación y archivado de templates DOCX para abogados.

**Estados del dominio:**

- `DRAFT` — borrador editable (extracción y configuración de campos)
- `PUBLISHED` — template aprobado, listo para uso administrativo futuro
- `ARCHIVED` — template retirado; terminal en MVP (sin desarchivado)

**Flujo de publicación:**

- Precondiciones: `ContractTemplate.status === DRAFT`, versión actual en `DRAFT`, DOCX asociado (`docxPath`), al menos un `TemplateField`, labels válidos (trim no vacío, máximo 120 caracteres).
- Efecto atómico: `template.status` y `version.status` → `PUBLISHED`; `version.publishedAt` se establece.
- Servidor: `publishTemplate` en `src/server/templates/publish-template.ts`.
- Server Action: `publishTemplateAction`.
- UI: checklist informativo + botón **Publicar template** en `/lawyer/templates/[templateId]`.

**Flujo de archivado:**

- Precondición: template y versión en `PUBLISHED` (no se puede archivar desde `DRAFT`).
- Efecto atómico: `template.status` y `version.status` → `ARCHIVED`.
- Se conserva `publishedAt`, DOCX en storage, `TemplateField` y registros previos de `AuditLog`.
- Archivado **terminal** en MVP — no hay desarchivado ni republicación.
- Servidor: `archiveTemplate` en `src/server/templates/archive-template.ts`.
- Server Action: `archiveTemplateAction`.

**UI condicional en detalle del template:**

| Estado | Extracción / edición | Publicar | Archivar | Campos |
|--------|----------------------|----------|----------|--------|
| `DRAFT` | Visible | Visible | — | Editables |
| `PUBLISHED` | Oculto | — | Visible | Solo lectura |
| `ARCHIVED` | Oculto | — | — | Solo lectura + aviso |

**Auditoría:**

- `TEMPLATE_PUBLISHED` — metadata: `versionId`, `version`, `publishedAt`, `fieldCount`, estados previos
- `TEMPLATE_ARCHIVED` — metadata: `versionId`, `version`, `publishedAt`, estados previos

**Seguridad:**

- Solo `LAWYER` propietario (`createdById`).
- `ADMIN_STAFF` bloqueado en rutas `/lawyer/*`.
- `docxPath` y rutas privadas **no** se exponen en UI ni respuestas de Server Actions.

### Todavía NO existe

- Panel administrativo real para **seleccionar templates publicados** (`/admin/generate` es placeholder)
- Formulario administrativo para completar campos y generar contratos
- Render DOCX con datos del formulario
- Generación PDF
- Descarga de PDF
- Historial administrativo de documentos generados
- Reemplazo de DOCX de una versión existente desde UI
- Desarchivado de templates
- Validación por magic bytes del contenido DOCX real

## Riesgos y deuda técnica

- **Next.js 16:** convención `middleware` deprecada a favor de `proxy` — revisar antes de actualizar despliegue.
- **Build Turbopack:** advertencia por `process.cwd()` en `src/lib/storage/paths.ts` al importar módulos de storage desde Server Actions.
- **Mensaje de éxito efímero:** tras publicar o archivar, `revalidatePath` puede refrescar la página antes de que el banner del formulario cliente sea visible; el cambio de estado en BD/UI es correcto.
- **Sin `archivedAt` en schema:** la fecha de archivado queda en `AuditLog.createdAt` del evento `TEMPLATE_ARCHIVED`.
- **Datos de prueba locales:** templates y DOCX creados en desarrollo no se versionan; pueden acumularse en BD y `storage/`.
- **`MAX_LABEL_LENGTH` duplicado:** la constante (120) existe en servicios de campos y publicación; podría extraerse a módulo compartido.
- **Lista de templates:** sin paginación.
- **Validación DOCX:** por extensión, tamaño y MIME; sin verificación de magic bytes del contenido real.
- **Atomicidad upload + BD:** compensación manual si falla storage o Prisma tras crear registros.
- **Re-extracción destructiva:** campos huérfanos (ausentes en el DOCX) se eliminan de la BD con su configuración (solo en versiones `DRAFT`).
- **TemplateField:** sin columna `updatedAt`; historial de ediciones solo vía `AuditLog`.
- **Extracción OOXML:** entidades XML en `<w:t>` no se decodifican explícitamente; placeholders partidos entre archivos XML distintos no se detectan.

## Historial de cambios

### 2026-06-17 — Fase 4: publicación y archivado de templates DOCX

- Servicios `publishTemplate` y `archiveTemplate` con transacción atómica template + versión
- Server Actions `publishTemplateAction` y `archiveTemplateAction`
- UI condicional en `/lawyer/templates/[templateId]`: checklist, publicar, archivar, solo lectura
- Auditoría `TEMPLATE_PUBLISHED` y `TEMPLATE_ARCHIVED`
- Validación E2E: `DRAFT` → `PUBLISHED` → `ARCHIVED`; PostgreSQL, auditoría y HTML sin rutas privadas

### 2026-06-17 — Fase 3: extracción y configuración de campos DOCX

- Dependencia `pizzip`, `readStoredDocx` y extractor `extractPlaceholdersFromDocxBuffer`
- Orquestadores `extractTemplateFields` y `updateTemplateField`
- Página detalle `/lawyer/templates/[templateId]` con extracción manual y edición de campos
- Server Actions `extractTemplateFieldsAction` y `updateTemplateFieldAction`
- Auditoría `TEMPLATE_FIELDS_EXTRACTED` y `TEMPLATE_FIELD_UPDATED`
- Validación E2E: edición, re-extracción con preservación y política de huérfanos

### 2026-06-17 — Fase 2: templates DOCX

- Metadata de archivo en `ContractTemplateVersion` (migración `add_template_version_file_metadata`)
- Storage local privado, auditoría y orquestador `createTemplateWithDocx`
- Server Action y UI mínima en `/lawyer/templates`
- Validación E2E desde navegador con formulario real

### 2026-06-17 — Fase 1: auth y navegación

- Login/logout, roles, middleware y rutas protegidas por rol
- Dashboard contextual y placeholders de abogado/administrativo
- Seed de usuarios de prueba locales
