import { UserRole } from "@prisma/client";

import {
  ADMIN_STAFF_ROUTE_PREFIXES,
  LAWYER_ROUTE_PREFIXES,
  POST_LOGIN_REDIRECT,
  PROTECTED_ROUTE_PREFIXES,
} from "./constants";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  const path = normalizePath(pathname);

  return path === prefix || path.startsWith(`${prefix}/`);
}

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isLawyer(role: UserRole): boolean {
  return role === UserRole.LAWYER;
}

export function isAdminStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN_STAFF;
}

export function isProtectedPath(pathname: string): boolean {
  return matchesAnyPrefix(pathname, PROTECTED_ROUTE_PREFIXES);
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const path = normalizePath(pathname);

  if (path === POST_LOGIN_REDIRECT || path.startsWith(`${POST_LOGIN_REDIRECT}/`)) {
    return true;
  }

  if (matchesAnyPrefix(path, LAWYER_ROUTE_PREFIXES)) {
    return isLawyer(role);
  }

  if (matchesAnyPrefix(path, ADMIN_STAFF_ROUTE_PREFIXES)) {
    return isAdminStaff(role);
  }

  if (isProtectedPath(path)) {
    return false;
  }

  return true;
}

export function getDefaultRedirectForRole(role: UserRole): string {
  void role;
  return POST_LOGIN_REDIRECT;
}
