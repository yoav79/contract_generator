import { redirect } from "next/navigation";

import { AdminDashboardPreview } from "@/components/dashboard/admin-dashboard-preview";
import { LawyerDashboardPreview } from "@/components/dashboard/lawyer-dashboard-preview";
import { isAdminStaff, isLawyer } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { getLawyerDashboardStats } from "@/server/templates/get-lawyer-dashboard-stats";

export default async function DashboardPage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (isLawyer(session.role)) {
    const stats = await getLawyerDashboardStats(session.userId);

    return <LawyerDashboardPreview email={session.email} stats={stats} />;
  }

  if (isAdminStaff(session.role)) {
    return <AdminDashboardPreview email={session.email} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Bienvenido a la consola interna de Contract Generator.
        </p>
      </div>
    </div>
  );
}
