"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  FilePlus2,
  Files,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { isAdminStaff, isLawyer } from "@/lib/auth/authorization";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Generar contrato", href: "/admin/generate", icon: FilePlus2 },
  {
    label: "Documentos generados",
    href: "/admin/generated-documents",
    icon: Files,
  },
];

const LAWYER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Templates", href: "/lawyer/templates", icon: FileText },
];

function getNavItems(role: UserRole): NavItem[] {
  if (isAdminStaff(role)) {
    return ADMIN_NAV;
  }

  if (isLawyer(role)) {
    return LAWYER_NAV;
  }

  return [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }];
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
      className="flex flex-col gap-1 p-3 lg:px-3 lg:pb-6"
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-blue-600" : "text-slate-400",
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
