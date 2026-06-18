import { redirect } from "next/navigation";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { TemplateCreateDialog } from "./template-create-dialog";
import {
  TemplatesListPanel,
  type LawyerTemplateListItem,
} from "./templates-list-panel";

type LawyerTemplatesPageProps = {
  searchParams: Promise<{ create?: string }>;
};

export default async function LawyerTemplatesPage({
  searchParams,
}: LawyerTemplatesPageProps) {
  const session = await getSession();
  const { create } = await searchParams;
  const openCreateDialog = create === "1";

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/lawyer/templates")) {
    redirect("/dashboard");
  }

  const templates = await db.contractTemplate.findMany({
    where: { createdById: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  const templateItems: LawyerTemplateListItem[] = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    status: template.status,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    latestVersion: template.versions[0]
      ? {
          version: template.versions[0].version,
          status: template.versions[0].status,
        }
      : null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Templates de contrato
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Gestiona plantillas DOCX, estados de publicación y configuración de
            campos para generación documental.
          </p>
        </div>
        <TemplateCreateDialog
          key={openCreateDialog ? "create-open" : "create-closed"}
          defaultOpen={openCreateDialog}
        />
      </header>

      <TemplatesListPanel templates={templateItems} />
    </div>
  );
}
