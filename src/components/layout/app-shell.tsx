import { UserRole } from "@prisma/client";

import { logoutAction } from "@/app/(protected)/actions/logout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { BrandMark } from "./brand-mark";
import { ProtectedNav } from "./protected-nav";

type AppShellProps = {
  children: React.ReactNode;
  email: string;
  role: UserRole;
};

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN_STAFF:
      return "Administrativo";
    case UserRole.LAWYER:
      return "Abogado";
    default:
      return role;
  }
}

function getRoleBadgeClassName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN_STAFF:
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case UserRole.LAWYER:
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 text-slate-700";
  }
}

export function AppShell({ children, email, role }: AppShellProps) {
  const roleLabel = getRoleLabel(role);

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 lg:flex-row">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white shadow-sm lg:w-[260px] lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 bg-gradient-to-br from-blue-50/70 via-white to-white px-4 py-5 lg:px-6 lg:py-6">
          <BrandMark />
        </div>
        <ProtectedNav role={role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <p className="text-sm font-medium text-slate-600">Área protegida</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-950">{email}</span>
              <Badge
                variant="outline"
                className={getRoleBadgeClassName(role)}
              >
                {roleLabel}
              </Badge>
            </div>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full border-slate-200 sm:w-auto"
              >
                Cerrar sesión
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 bg-slate-50 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
