"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";

import { cn } from "@/lib/utils";
import { isAdminStaff, isLawyer } from "@/lib/auth/authorization";

type NavItem = {
  label: string;
  href: string;
};

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Generar contrato", href: "/admin/generate" },
  { label: "Documentos generados", href: "/admin/generated-documents" },
];

const LAWYER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Templates", href: "/lawyer/templates" },
];

function getNavItems(role: UserRole): NavItem[] {
  if (isAdminStaff(role)) {
    return ADMIN_NAV;
  }

  if (isLawyer(role)) {
    return LAWYER_NAV;
  }

  return [{ label: "Dashboard", href: "/dashboard" }];
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type ProtectedNavProps = {
  role: UserRole;
};

export function ProtectedNav({ role }: ProtectedNavProps) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <nav
      aria-label="Navegación principal"
      className="flex flex-row flex-wrap gap-1 p-3 lg:flex-col lg:gap-0.5 lg:px-3 lg:pb-6"
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
