# Fase 10e — Detalle de template abogado (10e.1 + 10e.2)

## Objetivo

Mejorar la experiencia visual y el flujo operativo en `/lawyer/templates/[templateId]` para el abogado: reorganizar el detalle en cards, corregir la secuencia DRAFT (extraer → configurar → publicar), clarificar el copy y reforzar las acciones principales con botones azules, sin cambiar backend ni Server Actions.

## Alcance realizado

### 10e.1 — Reorganización visual del detalle

- Header con nombre, descripción y badges de estado + versión (`vN`)
- Avisos contextuales por `DRAFT`, `PUBLISHED` y `ARCHIVED`
- Cards: Resumen, Documento, Flujo de trabajo (4 pasos)
- Sección de campos detectados en card contenedora
- Zona de peligro con `ArchiveTemplateForm` solo en `PUBLISHED`
- Lógica intacta: `isDraft`, `isPublished`, `isArchived`, `canPublish`, mismos forms y acciones

### 10e.2 — Flujo DRAFT y acciones principales

- Orden corregido en DRAFT: Extraer placeholders → Campos detectados → Publicar template
- Copy orientativo: extracción previa a configuración; guardado individual por campo
- Empty state en DRAFT sin campos orienta a extraer primero
- Botones principales azules: Extraer, Guardar campo, Publicar (cuando habilitado)
- `ArchiveTemplateForm` sin cambios (destructive)

## Cambios principales

| Área | Detalle |
|------|---------|
| `page.tsx` | Reorden de secciones DRAFT; copy de flujo; publicación en sección propia |
| `extract-fields-form.tsx` | Botón «Extraer placeholders» con clases azules explícitas |
| `template-field-edit-form.tsx` | Botón «Guardar campo» azul |
| `publish-template-form.tsx` | Botón «Publicar template» azul cuando no está disabled |

## Archivos relevantes

- `src/app/(protected)/lawyer/templates/[templateId]/page.tsx`
- `src/app/(protected)/lawyer/templates/[templateId]/extract-fields-form.tsx`
- `src/app/(protected)/lawyer/templates/[templateId]/template-field-edit-form.tsx`
- `src/app/(protected)/lawyer/templates/[templateId]/publish-template-form.tsx`
- `src/app/(protected)/lawyer/templates/[templateId]/archive-template-form.tsx` (sin cambios en 10e.2)

## Riesgos o deuda técnica pendiente

- Un formulario/card por campo en DRAFT sigue siendo denso con muchos placeholders
- «Campos detectados» aparece también en el card Resumen (metadata), además de la sección principal
- Fixture `Contrato prueba Fase 2` tiene DOCX sin placeholders válidos; no sirve para demo de extracción con campos nuevos
- Mensaje inline de publicación puede perderse visualmente tras `revalidatePath` rápido

## Resultado

- Commit técnico: `b87eec5` — `feat(phase-10e): improve template detail workflow`
- `npm run lint` y `npm run build` OK
- Validación Playwright: orden visual DRAFT/PUBLISHED/ARCHIVED, mobile sin overflow, HTML sin rutas privadas
- POST real «Guardar campo»: persistencia tras refresh confirmada
- Publicación en fixture E2E: estado `PUBLISHED` y UI readonly confirmados

## Próximos pasos

1. **Fase 10e.3:** lista o tabla compacta de campos en DRAFT (sin guardado masivo)
2. Conectar métricas reales en dashboards (deuda 10b)
3. Documentar o reemplazar fixtures E2E consumidos en validación (p. ej. template publicado en pruebas)
