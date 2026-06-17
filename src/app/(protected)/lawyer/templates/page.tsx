import { redirect } from "next/navigation";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

export default async function LawyerTemplatesPage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/lawyer/templates")) {
    redirect("/dashboard");
  }

  return (
    <main>
      <h1>Templates (Abogado)</h1>
      <p>Email: {session.email}</p>
      <p>Rol: {session.role}</p>
    </main>
  );
}
