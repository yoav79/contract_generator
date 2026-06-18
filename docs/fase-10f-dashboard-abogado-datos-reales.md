# Fase 10f — Dashboard abogado con métricas reales y deep link de creación

## Objetivo

Reemplazar los mockups del dashboard de abogado por métricas reales filtradas por el usuario autenticado, mostrar actividad reciente y últimos templates, y conectar la acción rápida «Crear template» con el modal existente de `/lawyer/templates` mediante `?create=1`, sin cambiar Prisma, Server Actions ni permisos.

## Alcance realizado

- Servicio `getLawyerDashboardStats(lawyerId)` con consultas Prisma paralelas filtradas por `createdById`
- Métricas: total, borradores, publicados, archivados, última actividad (`max(updatedAt)`) y últimos 5 templates por `updatedAt`
- `dashboard/page.tsx` (Server Component): para `LAWYER` carga stats y las pasa a `LawyerDashboardPreview`
- `LawyerDashboardPreview`: eliminados `MOCK_METRICS`, badge «Ejemplo», alert de vista preliminar y copy mock; cards reales, última actividad, lista de últimos templates con links
- Quick actions: «Ver templates» → `/lawyer/templates`; «Crear template» → `/lawyer/templates?create=1`
- `lawyer/templates/page.tsx`: `searchParams.create === "1"` abre `TemplateCreateDialog` con `defaultOpen` y `key` para remount
- `template-create-dialog.tsx`: prop `defaultOpen`; al cerrar con deep link activo limpia URL con `router.replace("/lawyer/templates")`; un solo `TemplateCreateForm` dentro del modal
- Dashboard administrativo (`AdminDashboardPreview`) sin cambios

## Cambios principales

| Área | Detalle |
|------|---------|
| `get-lawyer-dashboard-stats.ts` | Nuevo servicio de agregación; DTO seguro sin paths ni hashes |
| `dashboard/page.tsx` | `getLawyerDashboardStats(session.userId)` solo para abogado |
| `lawyer-dashboard-preview.tsx` | UI real: 4 cards, última actividad, últimos templates, quick actions |
| `lawyer/templates/page.tsx` | Soporte `?create=1` para auto-apertura del modal |
| `template-create-dialog.tsx` | `defaultOpen` + limpieza de query al cerrar |

## Archivos relevantes

- `src/server/templates/get-lawyer-dashboard-stats.ts`
- `src/app/(protected)/dashboard/page.tsx`
- `src/components/dashboard/lawyer-dashboard-preview.tsx`
- `src/app/(protected)/lawyer/templates/page.tsx`
- `src/app/(protected)/lawyer/templates/template-create-dialog.tsx`

**Sin cambios:** `template-create-form.tsx`, `actions.ts`, `templates-list-panel.tsx`, Prisma, permisos admin/lawyer.

## Riesgos o deuda técnica pendiente

- Dashboard **administrativo** sigue con métricas mock (Fase 10b); pendiente fase equivalente para `ADMIN_STAFF`
- Deep link `?create=1` depende de remount por `key` en la page (sin `useEffect` en el dialog por regla de lint)
- Templates de prueba E2E pueden acumularse en BD local tras validación
- Listado `/lawyer/templates` sigue sin paginación; conteos del dashboard reflejan el total del abogado, no solo los visibles en búsqueda

## Resultado

- Commit técnico: `523dc0e` — `feat(phase-10f): lawyer dashboard with real stats and create modal deep link`
- `npm run lint` y `npm run build` OK
- Validación E2E Playwright: sin mocks en HTML, métricas vs lista por estado, quick actions, modal auto-open, URL limpia al cerrar, creación con DOCX real, redirect a detalle, dashboard actualizado (+1 total/borrador), admin sin regresión y bloqueado en `/lawyer/templates?create=1`, HTML sin `docxPath`/`pdfPath`/`storage/` ni SHA-256 completo

## Próximos pasos

1. Dashboard administrativo con métricas reales (documentos generados, templates publicados, etc.)
2. Documentación de fase y cierre visual Fase 10 (admin mock restante)
3. Opcional: limpiar fixtures/templates E2E en entorno local
