import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminStaff, isLawyer } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

import { logoutAction } from "../actions/logout";

export default async function DashboardPage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Email: {session.email}</p>
      <p>Rol: {session.role}</p>
      <nav>
        {isLawyer(session.role) ? (
          <p>
            <Link href="/lawyer/templates">Gestionar templates</Link>
          </p>
        ) : null}
        {isAdminStaff(session.role) ? (
          <p>
            <Link href="/admin/generate">Generar contrato</Link>
          </p>
        ) : null}
      </nav>
      <form action={logoutAction}>
        <button type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
