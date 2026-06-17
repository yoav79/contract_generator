# Contract Generator

Aplicación para generación controlada de contratos legales.

Los abogados gestionan templates DOCX con placeholders. El personal administrativo completa formularios dinámicos sobre templates publicados y genera documentos DOCX privados. La conversión a PDF y la descarga quedan para fases posteriores.

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

## Probar panel administrativo (Fase 5)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Como abogado, crea y **publica** un template con campos `TEXT`, `DATE`, `NUMBER` y `BOOLEAN` (ver Fases 3–4).
3. Inicia sesión como `admin@local.dev`.
4. Entra a [http://localhost:3000/admin/generate](http://localhost:3000/admin/generate).
5. Confirma que solo aparecen templates `PUBLISHED` (no `DRAFT` ni `ARCHIVED`).
6. Pulsa **Completar formulario** en un template publicado.
7. Completa el formulario dinámico y pulsa **Validar datos** (prevalidación sin persistencia; ver Fase 6 para generación DOCX).

**Nota:** Desde Fase 6 el botón principal del formulario es **Generar documento** (ver sección Fase 6).

**Seguridad esperada:**

- Solo `ADMIN_STAFF` accede a `/admin/*`; `LAWYER` es redirigido a `/dashboard`.
- `docxPath`, rutas de `storage/` y contenido DOCX/XML **no** aparecen en el HTML.
- Template archivado durante el flujo devuelve error claro al enviar el formulario.

**Validación E2E realizada:** listado admin, exclusión `DRAFT`/`ARCHIVED`, formulario dinámico, prevalidación exitosa, validaciones negativas, `BOOLEAN` sin marcar como `false`, template archivado durante flujo, seguridad `LAWYER`, HTML sin rutas privadas; `npm run lint` y `npm run build` OK.

## Probar generación DOCX (Fase 6)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Como abogado, crea y **publica** un template con placeholders `{{nombre_cliente}}`, `{{fecha_inicio}}`, `{{monto_total}}`, `{{acepta_terminos}}` y campos configurados (`TEXT`, `DATE`, `NUMBER`, `BOOLEAN` requeridos).
3. Inicia sesión como `admin@local.dev`.
4. Entra a [http://localhost:3000/admin/generate](http://localhost:3000/admin/generate).
5. Pulsa **Completar formulario** en un template `PUBLISHED`.
6. Completa el formulario y pulsa **Generar documento**.
7. Confirma:
   - Mensaje: *Documento generado correctamente. La conversión a PDF y descarga se implementarán en una fase posterior.*
   - `generatedDocumentId` visible en la UI
   - Sin botón de descarga, sin PDF y sin rutas privadas en el HTML

**Verificación en PostgreSQL** (`npm run db:studio`):

- `GeneratedDocument` con `status === COMPLETED`
- `docxPath` relativo bajo `storage/generated/{generatedDocumentId}/document.docx`
- `pdfPath === null`
- `formData` con valores normalizados del formulario
- `AuditLog` con `action === GENERATED_DOCUMENT_CREATED` y metadata sin PII

**Verificación en storage:**

- Archivo `storage/generated/{generatedDocumentId}/document.docx` con tamaño > 0
- Placeholders del template reemplazados en el DOCX generado (sin exponer contenido completo en UI)

**Seguridad esperada:**

- Solo `ADMIN_STAFF` accede a `/admin/*`; `LAWYER` redirigido a `/dashboard`.
- La UI **no** expone `docxPath`, rutas `storage/` ni contenido DOCX.
- La auditoría de generación **no** incluye `formData`, rutas ni valores de campos.

**Validación E2E realizada:** generación exitosa como `ADMIN_STAFF`, `GeneratedDocument` `COMPLETED`, `pdfPath` null, DOCX en `storage/generated/`, audit log `GENERATED_DOCUMENT_CREATED` sin PII, validaciones negativas (TEXT vacío, NUMBER inválido vía validador), template archivado bloquea generación, `LAWYER` bloqueado en rutas admin, HTML sin rutas privadas; `npm run lint` y `npm run build` OK.

## Storage local privado

Los archivos DOCX de templates se guardan en desarrollo bajo:

```text
storage/templates/{templateId}/v1/source.docx
```

Los DOCX generados por el personal administrativo se guardan bajo:

```text
storage/generated/{generatedDocumentId}/document.docx
```

- La carpeta `storage/` está **ignorada por Git** (salvo `storage/.gitkeep`).
- Los DOCX reales **no deben versionarse** en el repositorio.
- No se sirven archivos desde `public/`.

Ruta prevista sin uso completo en MVP: `storage/temp/`.

## Estructura base

```text
src/
  app/                          # App Router (Next.js)
    (auth)/login/               # Login
    (protected)/                # Rutas protegidas por rol
      lawyer/templates/         # Gestión de templates DOCX (abogado)
        [templateId]/           # Detalle, extracción, edición, publicación y archivado
      admin/generate/           # Panel administrativo: listado, formulario y generación DOCX
        [templateId]/           # Formulario dinámico y botón Generar documento
  lib/
    auth/                       # Sesión, roles, autorización
    forms/                      # Validación y normalización de datos para DOCX
    storage/                    # Rutas y guardado privado de DOCX (templates y generados)
    audit/                      # Registro de auditoría
    db.ts                       # Cliente Prisma compartido
  server/
    templates/                  # Creación, extracción, campos, publicación, archivado y consulta publicada
    documents/                  # Render DOCX, orquestador de generación; PDF pendiente
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

### Fase 5 — completada

Panel administrativo para templates publicados y prevalidación de formulario dinámico.

**Rutas:**

- `/admin/generate` — listado de templates `PUBLISHED`
- `/admin/generate/[templateId]` — detalle seguro y formulario dinámico

**Comportamiento:**

- Solo `ADMIN_STAFF` accede a las rutas admin.
- El listado muestra únicamente `ContractTemplate.status === PUBLISHED`; templates `DRAFT` y `ARCHIVED` no aparecen.
- Cada ítem usa la última `ContractTemplateVersion` con `status === PUBLISHED`.
- El detalle carga datos con `getPublishedTemplateForForm`; template inexistente o no publicado → `404` (`notFound`).
- El formulario se construye dinámicamente desde `TemplateField` (`label`, `fieldType`, `required`, `displayOrder`).
- `validateContractFormAction` **re-lee** el template publicado desde BD antes de validar (no confía en campos enviados por el cliente).
- La prevalidación exitosa muestra mensaje informativo; **no** genera documento ni persiste datos.

**Servicios y componentes:**

- `listPublishedTemplates` — DTO seguro para listado admin
- `getPublishedTemplateForForm` — DTO seguro con campos ordenados
- `validateTemplateFormData` — validador puro reutilizable (`src/lib/forms/validate-template-form-data.ts`)
- `validateContractFormAction` — Server Action de prevalidación
- `ContractForm` — formulario dinámico con `useActionState`

**Validaciones (server-side):**

| Tipo | Regla |
|------|-------|
| `TEXT` requerido | `trim` no vacío |
| `TEXT` | máximo 2000 caracteres (`MAX_TEXT_FIELD_LENGTH`) |
| `DATE` | solo `YYYY-MM-DD` con fecha real |
| `NUMBER` | número finito; rechaza `NaN`, `Infinity` y strings no numéricos |
| `BOOLEAN` | `true`/`false`; si falta en el envío → `false`; `required` no exige `true` |
| General | keys desconocidas → `formError`; keys duplicadas en configuración → `formError` |

**Seguridad:**

- Solo `ADMIN_STAFF`; `LAWYER` bloqueado en `/admin/*` (middleware + guards).
- No se expone `docxPath`, `storage/templates`, rutas absolutas ni contenido DOCX/XML.
- DTOs admin excluyen metadata de archivo (`originalFileName`, `docxSha256`, `fileSizeBytes`, `mimeType`, `createdById`).

**Alcance explícito (fuera de Fase 5):**

- No genera DOCX
- No genera PDF
- No crea `GeneratedDocument`
- No audita la prevalidación
- No descarga archivos

**Validación E2E realizada:** listado admin, exclusión `DRAFT`/`ARCHIVED`, formulario dinámico por tipo, prevalidación exitosa sin `GeneratedDocument` ni `AuditLog` nuevo, validaciones negativas, `BOOLEAN` sin marcar válido como `false`, error al enviar tras archivar template, redirección de `LAWYER` en rutas admin, HTML sin rutas privadas.

### Fase 6 — completada

Generación privada de DOCX desde templates publicados para personal administrativo.

**Alcance:**

- Generación privada de DOCX desde templates `PUBLISHED`
- Creación y actualización de `GeneratedDocument` (`PENDING` → `COMPLETED` / `FAILED`)
- Storage privado en `storage/generated/{generatedDocumentId}/document.docx`
- Auditoría `GENERATED_DOCUMENT_CREATED` sin PII

**Dependencia:** [docxtemplater](https://docxtemplater.com/) `^3.68.7` — render de placeholders `{{snake_case}}` sobre DOCX (con `pizzip` ya presente desde Fase 3).

**Migración:** `20260617162657_add_generated_document_docx_path` — columna `GeneratedDocument.docxPath` (`docx_path`).

**Flujo admin:**

1. `/admin/generate` — listado de templates publicados
2. Seleccionar template → `/admin/generate/[templateId]`
3. Completar formulario dinámico (`TEXT`, `DATE`, `NUMBER`, `BOOLEAN`)
4. Pulsar **Generar documento**
5. Mensaje de éxito con `generatedDocumentId` (sin rutas ni descarga)

**Pipeline server-side:**

| Paso | Módulo |
|------|--------|
| Cargar template publicado (con `docxPath` interno) | `getPublishedTemplateForGeneration` |
| Validar formulario | `validateTemplateFormData` |
| Normalizar valores para DOCX | `mapValuesForDocxRender` |
| Leer template fuente | `readStoredDocx` |
| Renderizar DOCX | `renderDocx` |
| Guardar DOCX generado | `saveGeneratedDocx` |
| Orquestar BD + storage + auditoría | `generateContractDocument` |
| Conectar UI | `generateContractDocumentAction` + `ContractForm` |

**Seguridad:**

- `docxPath` **no** se expone en UI ni en respuestas de Server Actions al cliente
- Rutas `storage/` y contenido DOCX **no** se devuelven al navegador
- Auditoría `GENERATED_DOCUMENT_CREATED`: metadata con `templateId`, `versionId`, `generatedDocumentId`, `fieldCount` — **sin** `formData`, rutas ni valores de campos

**Fuera de alcance (Fase 6):**

- PDF
- Descarga de documentos
- Historial administrativo de documentos generados
- Endpoint de archivo / serving de DOCX

**Validación E2E realizada:**

- `GeneratedDocument` `COMPLETED` con `pdfPath` null
- Archivo DOCX generado en `storage/generated/` con placeholders reemplazados
- `AuditLog` `GENERATED_DOCUMENT_CREATED` sin PII
- `LAWYER` bloqueado en `/admin/generate` y `/admin/generate/[templateId]`
- Validaciones negativas sin nuevos `GeneratedDocument` (TEXT vacío; NUMBER inválido vía validador server-side)
- Template archivado durante flujo: error seguro sin generación

**Riesgos y deuda (Fase 6):**

- Template E2E usado en pruebas quedó `ARCHIVED` — republicar o crear otro template para repetir pruebas manuales
- `renderDocx` sin modo strict de placeholders (placeholders sin valor pueden quedar sin reemplazar según docxtemplater)
- Compensación filesystem/BD best-effort si falla tras escribir el DOCX generado
- Doble validación en action y orquestador (`validateTemplateFormData` en ambos)
- NUMBER inválido limitado en UI por `<input type="number">` del navegador

### Todavía NO existe

- Conversión PDF
- Descarga de PDF o DOCX
- Historial administrativo de documentos generados
- Endpoint de archivo para servir documentos generados
- Auditoría de descarga
- Reintentos o workflow de generación con UI
- Reemplazo de DOCX de una versión existente desde UI
- Desarchivado de templates
- Validación por magic bytes del contenido DOCX real

## Riesgos y deuda técnica

- **Next.js 16:** convención `middleware` deprecada a favor de `proxy` — revisar antes de actualizar despliegue.
- **Build Turbopack:** advertencia por `process.cwd()` en `src/lib/storage/paths.ts` al importar módulos de storage desde Server Actions.
- **Mensajes de éxito efímeros:** tras publicar, archivar o prevalidar, `revalidatePath` puede refrescar la página antes de que el banner del formulario cliente sea visible; el cambio de estado o la validación en BD es correcta.
- **Inputs nativos y validación server-side:** `<input type="date">` y `<input type="number">` bloquean algunos valores inválidos en el navegador antes de llegar al servidor; la validación server-side cubre esos casos si los datos llegan.
- **Sin reset del formulario admin:** tras prevalidación exitosa, el formulario conserva los valores ingresados.
- **DATE en formulario admin:** formato `YYYY-MM-DD` (input HTML `type="date"`).
- **NUMBER en formulario admin:** formato HTML estándar (`type="number"`, `step="any"`); sin formato local (ej. separador de miles).
- **Sin `archivedAt` en schema:** la fecha de archivado queda en `AuditLog.createdAt` del evento `TEMPLATE_ARCHIVED`.
- **Datos de prueba y E2E locales:** templates, DOCX y resultados de pruebas E2E no se versionan; pueden acumularse en BD y `storage/`.
- **`MAX_LABEL_LENGTH` duplicado:** la constante (120) existe en servicios de campos y publicación; podría extraerse a módulo compartido.
- **Listas de templates:** sin paginación ni búsqueda (abogado y admin).
- **Validación DOCX:** por extensión, tamaño y MIME; sin verificación de magic bytes del contenido real.
- **Atomicidad upload + BD:** compensación manual si falla storage o Prisma tras crear registros.
- **Re-extracción destructiva:** campos huérfanos (ausentes en el DOCX) se eliminan de la BD con su configuración (solo en versiones `DRAFT`).
- **TemplateField:** sin columna `updatedAt`; historial de ediciones solo vía `AuditLog`.
- **Extracción OOXML:** entidades XML en `<w:t>` no se decodifican explícitamente; placeholders partidos entre archivos XML distintos no se detectan.
- **Fase 6 — template E2E archivado:** el template usado en validación E2E de generación puede quedar en `ARCHIVED`; crear o republicar uno para pruebas manuales repetidas.
- **Fase 6 — render sin strict:** `renderDocx` no fuerza error si quedan placeholders sin reemplazar en el DOCX generado.
- **Fase 6 — compensación storage/BD:** si el archivo se escribe pero falla la actualización en BD, se intenta eliminar el DOCX y marcar `FAILED` (best-effort).
- **Fase 6 — doble validación:** `validateTemplateFormData` corre en la Server Action y en el orquestador.
- **Fase 6 — NUMBER en UI:** `<input type="number">` impide enviar strings no numéricos desde el navegador; la validación server-side cubre el caso si los datos llegan.

## Historial de cambios

### 2026-06-17 — Fase 6: generación privada de DOCX

- Dependencia `docxtemplater` y migración `GeneratedDocument.docxPath`
- `renderDocx`, `mapValuesForDocxRender`, `saveGeneratedDocx` / `removeGeneratedDocx`
- `getPublishedTemplateForGeneration` y orquestador `generateContractDocument`
- Server Action `generateContractDocumentAction` y botón **Generar documento** en admin
- Auditoría `GENERATED_DOCUMENT_CREATED` sin PII
- Validación E2E: `COMPLETED`, storage `generated/`, audit log, seguridad `LAWYER`, sin PDF ni descarga

### 2026-06-17 — Fase 5: panel administrativo y prevalidación de formulario

- Servicios `listPublishedTemplates` y `getPublishedTemplateForForm` con DTOs seguros
- Listado admin en `/admin/generate` y formulario dinámico en `/admin/generate/[templateId]`
- Validador `validateTemplateFormData` y Server Action `validateContractFormAction`
- Prevalidación server-side sin `GeneratedDocument`, sin DOCX/PDF y sin auditoría
- Validación E2E: listado, formulario, validaciones positivas/negativas, archivado en flujo y seguridad por rol

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
