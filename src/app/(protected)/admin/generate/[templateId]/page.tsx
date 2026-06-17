import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { getPublishedTemplateForForm } from "@/server/templates/get-published-template-for-form";

import { ContractForm } from "./contract-form";

type AdminGenerateTemplatePageProps = {
  params: Promise<{ templateId: string }>;
};

function formatPublishedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function AdminGenerateTemplatePage({
  params,
}: AdminGenerateTemplatePageProps) {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/admin/generate")) {
    redirect("/dashboard");
  }

  const { templateId } = await params;

  if (!templateId.trim()) {
    notFound();
  }

  const template = await getPublishedTemplateForForm(templateId);

  if (!template) {
    notFound();
  }

  return (
    <main>
      <p>
        <Link href="/admin/generate">← Volver a templates publicados</Link>
      </p>

      <h1>Completar formulario</h1>

      <section>
        <h2>Template</h2>
        <p>Nombre: {template.name}</p>
        {template.description ? (
          <p>Descripción: {template.description}</p>
        ) : null}
        <p>Versión: {template.version}</p>
        <p>Publicado: {formatPublishedAt(template.publishedAt)}</p>
        <p>Campos: {template.fields.length}</p>
      </section>

      <section>
        <h2>Datos del contrato</h2>
        <ContractForm templateId={template.id} fields={template.fields} />
      </section>
    </main>
  );
}
