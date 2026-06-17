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

Checkpoint estable en `main` local con lint/build OK. Funcionalidad de negocio (auth, templates, generación, PDF, historial) preservada.

## Próximos pasos

1. Validación visual manual final en desktop/mobile
2. Ajustes cosméticos menores si surgen en revisión
3. Push a `origin/main` y cierre documental definitivo de Fase 10 cuando se apruebe
