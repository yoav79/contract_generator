# Fase 10 — Interfaz visual y consola interna (checkpoint)

## Objetivo

Renovar la experiencia visual del producto con Tailwind/shadcn, mantener Bootstrap aislado al login y disponer de una consola protegida persistente (sidebar, topbar, logout) sin alterar backend, rutas, permisos ni Server Actions.

## Alcance realizado (checkpoint)

- Tailwind CSS v4 + shadcn/ui (componentes base: button, card, input, label, textarea, table, badge, alert)
- Login rediseñado con paleta clara, Bootstrap importado solo en `/login` y estilos `.auth-*` scoped en `globals.css`
- Consola protegida: `(protected)/layout.tsx`, `AppShell`, `ProtectedNav`
- Dashboard como punto de entrada con cards por rol
- Refactor visual de pantallas admin y lawyer (presentación; lógica intacta)
- Integración de páginas internas al shell: wrappers `main` → `div`, sin doble padding ni `min-h-svh` redundante
- Checkpoint Git: `feat(phase-10): introduce UI shell and refreshed login experience`

## Cambios principales

| Área | Detalle |
|------|---------|
| Login | Dos columnas, hero vendible, card de acceso, `useActionState` + `loginAction` sin cambios |
| Shell | Sidebar por rol, topbar con email/rol/logout, contenido en área principal |
| Admin nav | Dashboard, Generar contrato, Documentos generados |
| Lawyer nav | Dashboard, Templates |
| Dependencias | `bootstrap` (solo login), `tailwindcss`, shadcn, `lucide-react`, etc. |

## Archivos relevantes

- `src/app/(protected)/layout.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/protected-nav.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/globals.css`
- `src/components/ui/*`
- Páginas refactorizadas en `(protected)/dashboard`, `admin/*`, `lawyer/*`

## Riesgos o deuda técnica pendiente

- Fase 10 **no cerrada** como entrega final: faltan ajustes visuales menores y validación E2E manual completa documentada
- Bootstrap puede permanecer en DOM tras navegación SPA desde login hasta reload (cosmético)
- `--primary` shadcn es neutro; acentos azules del login aplicados con clases Tailwind explícitas en shell/login
- Dos sistemas UI: Bootstrap (login) + shadcn/Tailwind (resto) hasta posible unificación futura
- `storage/` local con artefactos E2E; ignorado por Git

## Resultado

Checkpoint estable en `main` con lint/build OK. Funcionalidad de negocio (auth, templates, generación, PDF, historial) preservada.

**Fase 10b** (`7d01a89`) en `origin/main`: consola con branding, nav vertical y dashboards por rol con mockups temporales claramente marcados como ejemplos visuales.

## Fase 10b — Navegación vertical y dashboards por rol

**Commit:** `7d01a89` — `feat(phase-10b): improve console navigation and role dashboards`

### Alcance

- **BrandMark** en sidebar: icono `FileText` (lucide-react), título Contract Generator, badge «Plataforma legal», fondo con gradiente sutil
- **ProtectedNav** vertical en todos los breakpoints (sin chips horizontales en mobile)
- Iconos por ítem de navegación (`LayoutDashboard`, `FileText`, `FilePlus2`, `Files`)
- Estado activo reforzado: borde izquierdo `border-blue-600`, fondo `bg-blue-50`, anillo y sombra
- Badges de rol con color en topbar: abogado (`blue`), administrativo (`indigo`)
- **LawyerDashboardPreview**: panel visual con métricas mock, acciones rápidas y flujo de trabajo
- **AdminDashboardPreview**: panel visual equivalente para personal administrativo
- `dashboard/page.tsx` orquesta por rol: `LAWYER` → preview abogado; `ADMIN_STAFF` → preview admin

**Sin cambios de backend:** no Prisma, no Server Actions, no queries nuevas, no rutas nuevas, no permisos nuevos. Bootstrap sigue aislado al login.

> **Aclaración obligatoria:** los valores mostrados en los dashboards (p. ej. «12 templates activos», «48 contratos generados») son **ejemplos visuales** etiquetados como «Ejemplo» / «Mock visual». **No representan datos reales** y se conectarán a métricas reales en una fase posterior.

### Archivos principales

| Archivo | Rol |
|---------|-----|
| `src/components/layout/brand-mark.tsx` | Bloque de marca en sidebar |
| `src/components/layout/app-shell.tsx` | Shell con gradiente, badges de rol, topbar «Área protegida» |
| `src/components/layout/protected-nav.tsx` | Navegación vertical con iconos y estado activo |
| `src/components/dashboard/lawyer-dashboard-preview.tsx` | Dashboard visual abogado (presentacional) |
| `src/components/dashboard/admin-dashboard-preview.tsx` | Dashboard visual admin (presentacional) |
| `src/app/(protected)/dashboard/page.tsx` | Ramificación por rol |

### Decisiones visuales

- Paleta alineada al login: `blue-600`, `cyan-500`, `emerald-500`, `indigo-500`, `slate-50`, `white`
- Clases Tailwind explícitas en shell/dashboards; sin Bootstrap ni `.auth-*` fuera de login
- `lucide-react` (ya en dependencias) para iconos de nav y branding
- Disclaimer global en cada dashboard: *«Vista preliminar visual. Las métricas reales se conectarán en una fase posterior.»*
- Mobile MVP: nav apilada verticalmente, sin drawer ni hamburger

### Validaciones realizadas

| Validación | Resultado |
|------------|-----------|
| `npm run lint` | OK |
| `npm run build` | OK |
| Admin desktop/mobile | Branding, nav vertical, 4 cards mock, acciones y flujo administrativo |
| Lawyer desktop/mobile | Panel abogado, disclaimer, cards mock, acciones y flujo de trabajo |
| Bootstrap solo en `/login` | Confirmado |
| `.auth-*` solo en login | Confirmado |
| HTML sin `docxPath` / `pdfPath` / rutas `storage/` | Confirmado |
| Logout único en topbar | Confirmado |
| Sin overflow horizontal en mobile (375px) | Confirmado |

### Limitaciones conocidas y deuda técnica

- **Métricas mock temporales:** dashboards no consultan BD; cada card lleva badge «Ejemplo» y texto «Mock visual»
- **Conectar métricas reales:** pendiente para fase futura con servicios/backend dedicados
- **Duplicación estructural:** `LawyerDashboardPreview` y `AdminDashboardPreview` comparten patrón; posible extracción de componentes compartidos más adelante
- **Topbar genérica:** texto «Área protegida»; sin breadcrumb o título dinámico por página
- **Bootstrap residual en SPA:** al navegar desde login sin reload, Bootstrap puede permanecer en DOM (deuda cosmética conocida desde checkpoint)
- **`--primary` shadcn neutro:** acentos con clases Tailwind explícitas, no tokens shadcn de color

## Próximos pasos

1. Conectar métricas reales de dashboards cuando exista backend/servicios
2. Extraer componentes compartidos entre previews si la duplicación crece
3. Mejorar topbar (breadcrumb o contexto de página)
4. Validación E2E automatizada documentada de la consola visual
