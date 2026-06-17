# Contract Generator

Aplicación para generación controlada de contratos legales.

Los abogados gestionan templates DOCX con placeholders. El personal administrativo completa formularios dinámicos sobre templates publicados, genera documentos DOCX y PDF privados, descarga el PDF de forma segura (solo PDF, nunca DOCX editable) y consulta un historial de los últimos documentos generados.

## Requisitos

- Node.js 20+
- npm
- PostgreSQL instalado localmente
- **LibreOffice** (`soffice` en `PATH`) — requerido para conversión DOCX → PDF (Fase 7)

Verifica la instalación:

```bash
which soffice
soffice --version
```

Versión validada localmente: **LibreOffice 24.2.7.2**. En Ubuntu/Debian suele instalarse con `libreoffice-writer` o el metapaquete `libreoffice-common`.

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

**Nota:** Desde Fase 7, el mismo botón **Generar documento** encadena conversión a PDF (ver sección Fase 7).

## Probar generación PDF (Fase 7)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Confirma que `soffice` está disponible (`which soffice`, `soffice --version`).
3. Como abogado, crea y **publica** un template con placeholders `{{nombre_cliente}}`, `{{fecha_inicio}}`, `{{monto_total}}`, `{{acepta_terminos}}` y campos configurados (`TEXT`, `DATE`, `NUMBER`, `BOOLEAN` requeridos). Si no hay templates `PUBLISHED` en dev, republica uno existente o crea uno nuevo.
4. Inicia sesión como `admin@local.dev`.
5. Entra a [http://localhost:3000/admin/generate](http://localhost:3000/admin/generate).
6. Pulsa **Completar formulario** en un template `PUBLISHED`.
7. Completa el formulario y pulsa **Generar documento**.
8. Confirma en la UI:
   - Mensaje: *Documento generado correctamente. El PDF fue creado y la descarga se implementará en una fase posterior.* (si la conversión PDF fue exitosa)
   - `generatedDocumentId` visible
   - **Estado PDF:** `PDF creado` (o `PDF pendiente` si falló solo la conversión)
   - Sin botón de descarga, sin enlace a archivo, sin PDF embebido
   - Sin `docxPath`, `pdfPath`, rutas `storage/` ni rutas absolutas en el HTML

**Verificación en PostgreSQL** (`npm run db:studio`):

- `GeneratedDocument` con `status === COMPLETED`
- `docxPath` no nulo
- `pdfPath` no nulo (si PDF creado)
- `formData` con valores normalizados del formulario
- `AuditLog` con `GENERATED_DOCUMENT_CREATED` y, si PDF exitoso, `GENERATED_DOCUMENT_PDF_CREATED` — metadata sin PII ni rutas

**Verificación en storage:**

- `storage/generated/{generatedDocumentId}/document.docx` con tamaño > 0
- `storage/generated/{generatedDocumentId}/document.pdf` con tamaño > 0 y magic bytes `%PDF-` (si PDF exitoso)

**Seguridad esperada:**

- Solo `ADMIN_STAFF` accede a `/admin/*`; `LAWYER` redirigido a `/dashboard`.
- La UI **no** expone `docxPath`, `pdfPath`, rutas `storage/` ni contenido DOCX/PDF.
- La auditoría PDF **no** incluye `formData`, rutas ni valores de campos.

**Validación E2E realizada:** generación desde UI como `ADMIN_STAFF`, `GeneratedDocument` `COMPLETED`, `docxPath` y `pdfPath` no nulos, `document.docx` y `document.pdf` en storage privado, PDF válido (`%PDF-`), auditorías `GENERATED_DOCUMENT_CREATED` y `GENERATED_DOCUMENT_PDF_CREATED` sin PII, TEXT vacío bloquea antes de nuevo `GeneratedDocument`, reintento PDF sobre documento existente rechazado sin sobrescritura, `LAWYER` bloqueado en rutas admin, HTML sin rutas privadas; `npm run lint` y `npm run build` OK.

**Nota:** Desde Fase 8, si el PDF fue creado, la UI muestra el botón **Descargar PDF** (ver sección Fase 8).

## Probar descarga PDF (Fase 8)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Confirma que `soffice` está disponible (`which soffice`, `soffice --version`).
3. Como abogado, crea y **publica** un template con placeholders `{{nombre_cliente}}`, `{{fecha_inicio}}`, `{{monto_total}}`, `{{acepta_terminos}}` y campos configurados (`TEXT`, `DATE`, `NUMBER`, `BOOLEAN` requeridos). Si no hay templates `PUBLISHED` en dev, republica uno existente o crea uno nuevo.
4. Inicia sesión como `admin@local.dev`.
5. Entra a [http://localhost:3000/admin/generate](http://localhost:3000/admin/generate).
6. Pulsa **Completar formulario** en un template `PUBLISHED`.
7. Completa el formulario y pulsa **Generar documento**.
8. Confirma en la UI:
   - Mensaje: *Documento generado correctamente. El PDF está listo para descarga.* (si la conversión PDF fue exitosa)
   - `generatedDocumentId` visible
   - **Estado PDF:** `PDF creado` (o `PDF pendiente` si falló solo la conversión)
   - Botón **Descargar PDF** visible solo si `PDF creado`; enlace a `/admin/generated-documents/{generatedDocumentId}/download`
   - Sin `docxPath`, `pdfPath`, rutas `storage/` ni rutas absolutas en el HTML
   - Sin preview inline ni PDF embebido
9. Pulsa **Descargar PDF** y confirma que el archivo descargado es un PDF válido.

**Verificación HTTP de descarga:**

- `GET /admin/generated-documents/{generatedDocumentId}/download` con sesión `ADMIN_STAFF`
- Status `200`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="documento-{generatedDocumentId}.pdf"`
- `Cache-Control: no-store, private`
- `Pragma: no-cache`
- Archivo con tamaño > 0 y magic bytes `%PDF-`

**Verificación en PostgreSQL** (`npm run db:studio`):

- `GeneratedDocument` con `status === COMPLETED`
- `docxPath` y `pdfPath` no nulos (si PDF creado)
- `formData` con valores normalizados del formulario
- `AuditLog` con `GENERATED_DOCUMENT_CREATED`, `GENERATED_DOCUMENT_PDF_CREATED` y `GENERATED_DOCUMENT_DOWNLOADED` — metadata sin PII ni rutas

**Verificación en storage:**

- `storage/generated/{generatedDocumentId}/document.docx` con tamaño > 0
- `storage/generated/{generatedDocumentId}/document.pdf` con tamaño > 0 y magic bytes `%PDF-` (si PDF creado)

**Seguridad esperada:**

- Solo `ADMIN_STAFF` accede a `/admin/*` y al endpoint de descarga; `LAWYER` redirigido a `/dashboard`
- La UI y las respuestas **no** exponen `docxPath`, `pdfPath`, rutas `storage/` ni contenido DOCX/PDF en JSON/HTML
- No se acepta ruta de archivo por query ni body; la descarga usa solo `generatedDocumentId`
- No hay endpoint ni enlace para descargar DOCX editable
- Documento inexistente o no descargable → `404` con mensaje genérico
- Auditoría de descarga **no** incluye `formData`, rutas ni valores de campos

**Validación E2E realizada:** admin generó documento, PDF creado, botón **Descargar PDF** visible con `href` por `generatedDocumentId`, descarga HTTP `200`, magic bytes `%PDF-`, headers correctos, `GeneratedDocument` `COMPLETED` con `docxPath` y `pdfPath` no nulos, auditorías `GENERATED_DOCUMENT_CREATED`, `GENERATED_DOCUMENT_PDF_CREATED` y `GENERATED_DOCUMENT_DOWNLOADED`, `LAWYER` bloqueado/redirigido, ID inexistente devuelve `404`, endpoints DOCX alternativos devuelven `404`, HTML sin `docxPath`/`pdfPath`/`storage/`; `npm run lint` y `npm run build` OK.

**Nota:** Desde Fase 9, los documentos generados también aparecen en el historial administrativo (ver sección Fase 9).

## Probar historial de documentos generados (Fase 9)

1. Ejecuta migraciones y seed (ver secciones anteriores).
2. Asegúrate de tener al menos un `GeneratedDocument` con `status === COMPLETED` y PDF creado (ver Fases 6–8 si hace falta generar uno).
3. Inicia sesión como `admin@local.dev`.
4. Entra a [http://localhost:3000/admin/generate](http://localhost:3000/admin/generate) y confirma el enlace **Ver documentos generados**, o abre directamente [http://localhost:3000/admin/generated-documents](http://localhost:3000/admin/generated-documents).
5. Confirma en la UI:
   - Título: *Documentos generados*
   - Texto: *Últimos 50 documentos generados. La descarga disponible es solo PDF.*
   - Enlace **← Volver a generar contrato** hacia `/admin/generate`
   - Tabla con columnas: Fecha generación, Template, Versión, Generado por, Estado, PDF
   - Al menos un documento visible
   - En filas `COMPLETED` con PDF: enlace **Descargar PDF** hacia `/admin/generated-documents/{generatedDocumentId}/download`
   - En otras filas: texto *PDF pendiente*
   - Sin `formData`, valores de campos, `docxPath`, `pdfPath`, rutas `storage/` ni contenido DOCX/PDF en el HTML
6. Pulsa **Descargar PDF** en un documento con PDF disponible y confirma descarga válida (`%PDF-`).

**Verificación HTTP de descarga desde historial:**

- `GET /admin/generated-documents/{generatedDocumentId}/download` con sesión `ADMIN_STAFF`
- Status `200`, `Content-Type: application/pdf`, `Content-Disposition: attachment`
- `Cache-Control: no-store, private` y `Pragma: no-cache`
- Archivo con tamaño > 0 y magic bytes `%PDF-`

**Verificación en PostgreSQL** (`npm run db:studio`):

- `AuditLog` con `GENERATED_DOCUMENT_DOWNLOADED` tras descargar desde el listado
- Metadata con `generatedDocumentId`, `templateId`, `versionId` — sin PII ni rutas

**Seguridad esperada:**

- Solo `ADMIN_STAFF` accede a `/admin/generated-documents`; `LAWYER` redirigido a `/dashboard`
- El listado **no** expone `formData`, `docxPath`, `pdfPath` ni rutas `storage/`
- No hay enlace ni endpoint para descargar DOCX editable
- Visualizar el listado **no** genera auditoría en MVP; la descarga sí audita `GENERATED_DOCUMENT_DOWNLOADED`

**Validación E2E realizada:** admin abrió `/admin/generated-documents`, tabla visible con documentos y columnas correctas, HTML sin datos privados ni rutas, descarga PDF desde historial con HTTP `200` y headers correctos, magic bytes `%PDF-`, auditoría `GENERATED_DOCUMENT_DOWNLOADED` sin PII, `LAWYER` bloqueado en listado y descarga directa, enlace **Ver documentos generados** desde `/admin/generate` validado; `npm run lint` y `npm run build` OK.

## Storage local privado

Los archivos DOCX de templates se guardan en desarrollo bajo:

```text
storage/templates/{templateId}/v1/source.docx
```

Los documentos generados por el personal administrativo se guardan bajo:

```text
storage/generated/{generatedDocumentId}/document.docx
storage/generated/{generatedDocumentId}/document.pdf
```

- La carpeta `storage/` está **ignorada por Git** (salvo `storage/.gitkeep`).
- Los DOCX y PDF reales **no deben versionarse** en el repositorio.
- No se sirven archivos desde `public/`.
- La descarga de PDF se sirve solo vía Route Handler autenticado (`/admin/generated-documents/[generatedDocumentId]/download`); el cliente nunca recibe la ruta relativa almacenada en BD.

`storage/temp/` — directorios temporales únicos para conversión DOCX → PDF (LibreOffice); se limpian tras cada conversión.

## Estructura base

```text
src/
  app/                          # App Router (Next.js)
    (auth)/login/               # Login (Bootstrap aislado a esta ruta)
    (protected)/                # Rutas protegidas por rol (layout con consola)
      layout.tsx                # AppShell persistente: sidebar, topbar, logout
      dashboard/                # Entrada a la consola por rol
      lawyer/templates/         # Gestión de templates DOCX (abogado)
        [templateId]/           # Detalle, extracción, edición, publicación y archivado
      admin/generate/           # Panel administrativo: listado templates, formulario y generación DOCX+PDF
        [templateId]/           # Formulario dinámico, botón Generar documento, estado PDF y descarga
      admin/generated-documents/  # Historial admin y descarga segura de PDF
        page.tsx                # Listado últimos 50 documentos generados
        [generatedDocumentId]/
          download/             # GET — attachment application/pdf
  components/
    ui/                         # Primitivos shadcn/Tailwind
    layout/                     # AppShell y ProtectedNav
  lib/
    auth/                       # Sesión, roles, autorización
    utils.ts                    # Utilidad cn() para clases Tailwind
    forms/                      # Validación y normalización de datos para DOCX
    storage/                    # Rutas y guardado/lectura privado DOCX/PDF (templates y generados)
    audit/                      # Registro de auditoría
    db.ts                       # Cliente Prisma compartido
  server/
    templates/                  # Creación, extracción, campos, publicación, archivado y consulta publicada
    documents/                  # Render DOCX, conversión PDF, generación, listado admin y descarga segura
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

### Fase 7 — completada

Conversión privada DOCX → PDF desde templates publicados para personal administrativo.

**Alcance:**

- Conversión privada DOCX → PDF tras generación DOCX exitosa
- Uso de LibreOffice/`soffice` headless vía `child_process` (`execFile`, sin shell)
- Storage privado en `storage/generated/{generatedDocumentId}/document.pdf`
- Actualización de `GeneratedDocument.pdfPath` (columna existente desde migración inicial; sin nueva migración)
- Auditoría `GENERATED_DOCUMENT_PDF_CREATED` sin PII
- Encadenamiento automático en **Generar documento** (un solo submit)

**Prerrequisito de sistema:**

- `soffice` disponible en `PATH`
- Versión validada localmente: LibreOffice **24.2.7.2**
- Verificación: `which soffice` y `soffice --version`

**Flujo admin:**

1. `/admin/generate` — listado de templates publicados
2. Seleccionar template → `/admin/generate/[templateId]`
3. Completar formulario dinámico
4. Pulsar **Generar documento**
5. Mensaje según resultado PDF; `generatedDocumentId` visible
6. **Estado PDF:** `PDF creado` o `PDF pendiente` (sin rutas ni descarga)

**Pipeline server-side (PDF):**

| Paso | Módulo |
|------|--------|
| Leer DOCX generado | `readStoredDocx` |
| Convertir a PDF | `convertDocxToPdf` (`soffice --headless`) |
| Guardar PDF generado | `saveGeneratedPdf` / `removeGeneratedPdf` |
| Orquestar BD + storage + auditoría PDF | `generatePdfForDocument` |
| Encadenar tras DOCX | `generateContractDocument` |
| Conectar UI | `generateContractDocumentAction` + `ContractForm` |

**Política si falla solo el PDF:**

- La generación DOCX **no** se invalida: `status` permanece `COMPLETED`, `docxPath` intacto, `pdfPath` null
- No se marca `FAILED`; no se borra el DOCX
- UI muestra éxito parcial con **Estado PDF:** `PDF pendiente`

**Política si `pdfPath` ya existe:**

- `generatePdfForDocument` rechaza con error seguro (sin sobrescritura silenciosa)

**Seguridad:**

- `docxPath` y `pdfPath` **no** se exponen en UI ni en respuestas de Server Actions
- Rutas `storage/` y contenido DOCX/PDF **no** se devuelven al navegador
- Auditoría `GENERATED_DOCUMENT_PDF_CREATED`: metadata con `templateId`, `versionId`, `generatedDocumentId` — **sin** `formData`, rutas ni valores de campos

**Fuera de alcance (Fase 7):**

- Descarga de PDF
- Endpoint de archivo / serving de documentos
- Historial administrativo de documentos generados
- Auditoría de descarga
- Entrega de DOCX editable al cliente
- Reintento manual de PDF desde UI
- Cola async o control de concurrencia para LibreOffice

**Validación E2E realizada:**

- `GeneratedDocument` `COMPLETED` con `docxPath` y `pdfPath` no nulos
- `document.docx` y `document.pdf` en storage privado; PDF válido (`%PDF-`)
- `AuditLog` `GENERATED_DOCUMENT_CREATED` y `GENERATED_DOCUMENT_PDF_CREATED` sin PII
- `LAWYER` bloqueado en rutas admin; HTML sin `docxPath`/`pdfPath`/`storage/`
- TEXT requerido vacío bloquea antes de nuevo `GeneratedDocument`
- Reintento PDF sobre documento con `pdfPath` existente: rechazado sin sobrescritura

**Riesgos y deuda (Fase 7):**

- `soffice` debe existir en producción (mismo binario que en desarrollo)
- Calidad del PDF depende de fuentes y paquetes del SO
- Conversión síncrona añade latencia al submit **Generar documento**
- PDF fallido queda como **PDF pendiente** sin reintento en UI
- Sin cola ni control de concurrencia para procesos LibreOffice
- Templates dev pueden requerir republicación manual para pruebas repetidas

### Fase 8 — completada

Descarga segura solo PDF para documentos generados por personal administrativo.

**Alcance:**

- Descarga segura **solo PDF** (nunca DOCX editable)
- Route Handler `GET /admin/generated-documents/[generatedDocumentId]/download`
- Descarga basada en `generatedDocumentId`, no en rutas de archivo
- Lectura interna de `pdfPath` desde BD y filesystem privado (`readStoredPdf`)
- Auditoría `GENERATED_DOCUMENT_DOWNLOADED` sin PII
- Sin nueva migración Prisma (schema existente suficiente)

**Flujo admin:**

1. `/admin/generate` — listado de templates publicados
2. Seleccionar template → `/admin/generate/[templateId]`
3. Completar formulario dinámico
4. Pulsar **Generar documento**
5. Si PDF creado: mensaje de éxito, `generatedDocumentId` visible, **Estado PDF:** `PDF creado`
6. Pulsar **Descargar PDF** → descarga como `attachment`

**Pipeline server-side (descarga):**

| Paso | Módulo |
|------|--------|
| Validar sesión y rol | Route Handler + `downloadGeneratedPdf` |
| Cargar `GeneratedDocument` y validar `COMPLETED` + `pdfPath` | `downloadGeneratedPdf` |
| Leer PDF privado | `readStoredPdf` |
| Auditar descarga | `AUDIT_ACTIONS.GENERATED_DOCUMENT_DOWNLOADED` |
| Responder binario | Route Handler `GET` |

**Headers de descarga:**

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="documento-{generatedDocumentId}.pdf"`
- `Cache-Control: no-store, private`
- `Pragma: no-cache`

**Seguridad:**

- Solo `ADMIN_STAFF`; cualquier admin puede descargar cualquier documento `COMPLETED` con PDF
- `LAWYER` bloqueado/redirigido por middleware al intentar `/admin/*`
- `pdfPath`, `docxPath` y rutas `storage/` **no** se exponen en UI, JSON ni mensajes de error
- No se devuelve contenido PDF en JSON/HTML; solo binario en respuesta HTTP del Route Handler
- No se acepta path por query ni body
- No se sirve DOCX editable; no hay endpoint DOCX equivalente
- Documento inexistente, no `COMPLETED`, sin `pdfPath` o archivo ausente → `404` genérico

**Auditoría:**

- `GENERATED_DOCUMENT_DOWNLOADED` por cada descarga exitosa (`GET` con respuesta `200`)
- Metadata permitida: `generatedDocumentId`, `templateId`, `versionId`
- Metadata prohibida: `formData`, valores de campos, `docxPath`, `pdfPath`, `storage/generated`, rutas absolutas, contenido DOCX/PDF

**Fuera de alcance (Fase 8):**

- Descarga DOCX
- Preview inline de PDF
- Historial/listado administrativo de documentos generados
- Búsqueda/paginación
- Reintento PDF desde UI
- Enlaces firmados o expiración
- Storage externo
- Envío por email

**Validación E2E realizada:**

- Admin generó documento; PDF creado; botón **Descargar PDF** visible
- Descarga HTTP `200`; magic bytes `%PDF-`; headers correctos
- `GeneratedDocument` `COMPLETED` con `docxPath` y `pdfPath` no nulos
- Auditorías `GENERATED_DOCUMENT_CREATED`, `GENERATED_DOCUMENT_PDF_CREATED` y `GENERATED_DOCUMENT_DOWNLOADED`
- `LAWYER` bloqueado/redirigido; ID inexistente devuelve `404`
- Endpoints DOCX alternativos devuelven `404`; HTML sin rutas privadas

**Riesgos y deuda (Fase 8):**

- Cada `GET` exitoso genera una auditoría de descarga (descargas repetidas = múltiples logs)
- Caso `pdfPath` null no probado empíricamente por falta de registro `COMPLETED` sin PDF en BD local
- El PDF contiene PII del formulario; headers `no-store` son obligatorios
- Posible desincronización BD/storage produce `404` genérico sin revelar la causa
- Sin historial/listado: solo descarga inmediata tras generar en la misma sesión de formulario

### Fase 10 — checkpoint UIX (no cierre final)

Renovación visual y consola interna persistente. Ver `docs/fase-10-interfaz-visual-y-consola.md`.

**Alcance del checkpoint:**

- Tailwind v4 + shadcn/ui; componentes en `src/components/ui/`
- Login rediseñado; Bootstrap solo en `/login`; estilos `.auth-*` scoped
- `(protected)/layout.tsx` con sidebar, topbar, logout y navegación por rol
- Refactor visual de dashboard, admin y lawyer sin cambiar Server Actions ni permisos
- Páginas internas integradas al shell (sin `<main>` anidado ni doble padding)

**Pendiente antes de cierre final:** conectar métricas reales en dashboards (ver Fase 10b).

### Fase 10b — Consola visual y dashboards por rol

Rediseño de navegación y dashboards por rol con mockups temporales. Ver `docs/fase-10-interfaz-visual-y-consola.md` (subsección Fase 10b). Commit: `7d01a89`.

**Alcance:**

- Sidebar con **BrandMark** e iconos (lucide-react); badge «Plataforma legal»
- **Navegación vertical** en desktop y mobile (sin chips horizontales)
- Estado activo reforzado; badges de rol con color (abogado / administrativo)
- **Dashboard abogado** (`LawyerDashboardPreview`): panel visual con métricas mock, acciones rápidas y flujo de trabajo
- **Dashboard administrativo** (`AdminDashboardPreview`): panel visual equivalente
- Mockups marcados como **«Ejemplo»** / **«Mock visual»**; disclaimer de vista preliminar
- Sin backend nuevo, sin cambios Prisma, sin cambios Server Actions
- Bootstrap sigue aislado al login

> Los valores de los dashboards son ejemplos visuales y **no datos reales**.

### Fase 9 — completada

Historial/listado administrativo de documentos generados para personal administrativo.

**Alcance:**

- Página `/admin/generated-documents` con los **últimos 50** documentos generados
- Orden `createdAt` descendente; tabla simple sin búsqueda, filtros ni paginación
- Servicio `listGeneratedDocumentsForAdmin` con DTO seguro
- Descarga PDF desde el historial reutilizando el endpoint seguro de Fase 8
- Enlace **Ver documentos generados** desde `/admin/generate`
- Sin nueva migración Prisma

**Flujo admin:**

1. `/admin/generate` → **Ver documentos generados**
2. `/admin/generated-documents` — tabla de documentos
3. Si `status === COMPLETED` y PDF disponible → **Descargar PDF**
4. Si no → *PDF pendiente*

**Columnas del listado:**

| Columna | Fuente DTO |
|---------|------------|
| Fecha generación | `createdAt` |
| Template | `templateName` |
| Versión | `templateVersion` |
| Generado por | `generatedByLabel` |
| Estado | `status` |
| PDF | Enlace descarga o *PDF pendiente* |

**Servicio y DTO:**

`listGeneratedDocumentsForAdmin()` → `GeneratedDocumentListItem`:

- `id`, `templateName`, `templateVersion`, `generatedByLabel`, `status`, `pdfAvailable`, `createdAt`, `updatedAt`
- `pdfAvailable` derivado de `pdfPath !== null` en servidor (sin exponer `pdfPath`)
- `generatedByLabel`: `name` trim si existe; si no, `email`

**Seguridad:**

- Solo `ADMIN_STAFF`; cualquier admin ve todos los documentos (coherente con descarga Fase 8)
- `LAWYER` bloqueado/redirigido por middleware
- No se expone `formData`, valores de campos, `docxPath`, `pdfPath`, `storage/generated` ni rutas absolutas
- No se embebe contenido DOCX/PDF en el listado
- No hay enlace DOCX

**Auditoría:**

- Visualizar el listado **no** se audita en MVP
- Descargar PDF audita `GENERATED_DOCUMENT_DOWNLOADED` (Fase 8); cada descarga exitosa genera un log

**Fuera de alcance (Fase 9):**

- Búsqueda, filtros y paginación avanzada
- Preview inline de PDF
- Descarga DOCX, eliminación, regeneración PDF desde listado
- Edición de `formData`, export CSV, métricas
- Auditoría de visualización del listado

**Validación E2E realizada:**

- Admin abrió `/admin/generated-documents`; tabla visible; columnas verificadas
- HTML sin datos privados ni rutas
- Descarga PDF desde historial: HTTP `200`, headers correctos, `%PDF-`
- Auditoría `GENERATED_DOCUMENT_DOWNLOADED` sin PII
- `LAWYER` bloqueado en listado y descarga directa
- Enlace desde `/admin/generate` validado

**Riesgos y deuda (Fase 9):**

- Límite fijo de 50 documentos; los más antiguos no aparecen
- Sin búsqueda ni paginación
- `templateName` refleja el nombre actual en BD (no snapshot histórico)
- Cada descarga genera auditoría (heredado de Fase 8)
- Registros `FAILED`/`PENDING` aparecen como *PDF pendiente*
- `generatedByLabel` puede mostrar email del admin si no tiene `name`

### Todavía NO existe

- Descarga de DOCX editable
- Preview inline de PDF
- Reintento manual de PDF desde UI
- Búsqueda/filtros/paginación avanzada de documentos generados
- Enlaces firmados o expiración de descarga
- Storage externo o envío por email
- Eliminación de documentos generados
- Regeneración PDF desde listado
- Edición de `formData` desde UI admin
- Export CSV o métricas de documentos
- Auditoría de visualización del listado
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
- **Fase 7 — LibreOffice en producción:** el host de despliegue debe tener `soffice` instalado y accesible en `PATH`.
- **Fase 7 — conversión síncrona:** DOCX y PDF se generan en serie en el mismo request; puede aumentar tiempo de respuesta del formulario admin.
- **Fase 7 — PDF pendiente sin reintento UI:** si falla solo la conversión, el DOCX queda válido pero no hay botón para reintentar PDF.
- **Fase 7 — concurrencia LibreOffice:** múltiples conversiones paralelas pueden competir por el mismo motor headless.
- **Fase 7 — templates dev:** puede no haber templates `PUBLISHED`; republicar o crear uno para pruebas manuales.
- **Fase 8 — auditoría por descarga:** cada `GET` exitoso al endpoint de descarga registra `GENERATED_DOCUMENT_DOWNLOADED`.
- **Fase 8 — PDF con PII:** el PDF generado contiene datos del formulario; la respuesta usa `Cache-Control: no-store, private`.
- **Fase 8 — desincronización BD/storage:** si `pdfPath` existe en BD pero el archivo fue eliminado, la descarga devuelve `404` genérico.
- **Fase 8 — pdfPath null sin prueba E2E:** no había registro `COMPLETED` sin PDF en BD local al validar el caso negativo.
- **Fase 9 — límite 50:** el historial admin muestra solo los últimos 50 `GeneratedDocument` por `createdAt`.
- **Fase 9 — sin búsqueda ni paginación:** documentos antiguos quedan fuera del listado MVP.
- **Fase 9 — nombre de template actual:** si el template se renombró tras la generación, el listado muestra el nombre vigente en BD.
- **Fase 9 — generatedByLabel:** puede exponer email interno del admin si `User.name` está vacío.

## Historial de cambios

### 2026-06-17 — Fase 10b: consola visual y dashboards por rol

- BrandMark en sidebar; navegación vertical con iconos y estado activo reforzado
- `LawyerDashboardPreview` y `AdminDashboardPreview` con mockups temporales etiquetados como «Ejemplo»
- Disclaimer de vista preliminar; sin backend, Prisma ni Server Actions nuevos
- Validación lint/build; admin y lawyer desktop/mobile; Bootstrap aislado al login
- Commit: `feat(phase-10b): improve console navigation and role dashboards` (`7d01a89`)

### 2026-06-17 — Fase 10 (checkpoint): consola interna y login renovado

- Tailwind/shadcn base; primitivos UI y `src/lib/utils.ts`
- Login con paleta clara; Bootstrap aislado a `/login`
- AppShell + ProtectedNav; layout protegido persistente
- Dashboard con cards por rol; refactors visuales admin/lawyer
- Integración al shell: sin wrappers `main` redundantes ni doble padding
- Checkpoint: `feat(phase-10): introduce UI shell and refreshed login experience`

### 2026-06-17 — Fase 9: historial administrativo de documentos generados

- Servicio `listGeneratedDocumentsForAdmin` con DTO seguro
- Página `/admin/generated-documents` con tabla de últimos 50 documentos
- Enlace **Ver documentos generados** desde `/admin/generate`
- Descarga PDF desde historial vía endpoint Fase 8; sin auditoría de visualización del listado
- Validación E2E: listado admin, HTML sin PII/rutas, descarga desde historial, bloqueo `LAWYER`, enlace desde generate

### 2026-06-17 — Fase 8: descarga segura solo PDF

- `readStoredPdf` y orquestador `downloadGeneratedPdf`
- Route Handler `GET /admin/generated-documents/[generatedDocumentId]/download`
- UI con botón **Descargar PDF** condicionado a `pdfCreated`
- Headers seguros (`application/pdf`, `attachment`, `no-store`, `private`)
- Auditoría `GENERATED_DOCUMENT_DOWNLOADED` sin PII
- Validación E2E: generación, descarga HTTP, PostgreSQL, storage, auditorías, bloqueo `LAWYER`, `404` en ID inexistente, sin DOCX ni rutas en HTML

### 2026-06-17 — Fase 7: conversión privada DOCX → PDF

- `convertDocxToPdf` con `soffice` headless (`execFile`, temporales en `storage/temp/`)
- `saveGeneratedPdf` / `removeGeneratedPdf` y orquestador `generatePdfForDocument`
- Encadenamiento PDF en `generateContractDocument`; UI con **Estado PDF** (`PDF creado` / `PDF pendiente`)
- Auditoría `GENERATED_DOCUMENT_PDF_CREATED` sin PII
- Prerrequisito de sistema: LibreOffice `soffice` en `PATH` (validado: 24.2.7.2)
- Validación E2E: UI admin, PostgreSQL, storage, PDF `%PDF-`, auditorías, seguridad `LAWYER`, sin descarga

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
