import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  return (
    <AppShell email={session.email} role={session.role}>
      {children}
    </AppShell>
  );
}
