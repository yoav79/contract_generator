import { redirect } from "next/navigation";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

export default async function AdminGeneratePage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/admin/generate")) {
    redirect("/dashboard");
  }

  return (
    <main>
      <h1>Generar contrato (Administrativo)</h1>
      <p>Email: {session.email}</p>
      <p>Rol: {session.role}</p>
    </main>
  );
}
