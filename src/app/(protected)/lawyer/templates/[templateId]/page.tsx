import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { ExtractFieldsForm } from "./extract-fields-form";
import { TemplateFieldEditForm } from "./template-field-edit-form";

type TemplateDetailPageProps = {
  params: Promise<{ templateId: string }>;
};

function formatFileSizeKb(bytes: number | null | undefined): string {
  if (bytes == null) {
    return "—";
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatPartialSha256(sha256: string | null | undefined): string {
  if (!sha256) {
    return "—";
  }

  return `${sha256.slice(0, 12)}…`;
}

function formatCreatedAt(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/lawyer/templates")) {
    redirect("/dashboard");
  }

  const { templateId } = await params;

  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: {
          fields: {
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!template || template.createdById !== session.userId) {
    notFound();
  }

  const version = template.versions[0];
  const fields = version?.fields ?? [];

  return (
    <main>
      <p>
        <Link href="/lawyer/templates">← Volver a templates</Link>
      </p>

      <h1>{template.name}</h1>
      <p>Email: {session.email}</p>

      <section>
        <h2>Metadata del template</h2>
        <p>Descripción: {template.description ?? "—"}</p>
        <p>Estado del template: {template.status}</p>
        <p>Versión actual: {version?.version ?? "—"}</p>
        <p>Estado de la versión: {version?.status ?? "—"}</p>
        <p>Archivo original: {version?.originalFileName ?? "—"}</p>
        <p>Tamaño: {formatFileSizeKb(version?.fileSizeBytes)}</p>
        <p>SHA-256: {formatPartialSha256(version?.docxSha256)}</p>
        <p>Creado: {formatCreatedAt(template.createdAt)}</p>
      </section>

      <section>
        <h2>Extracción de placeholders</h2>
        <ExtractFieldsForm templateId={template.id} />
      </section>

      <section>
        <h2>Campos detectados</h2>
        {fields.length === 0 ? (
          <p>Aún no hay placeholders extraídos.</p>
        ) : (
          <ul>
            {fields.map((field) => (
              <li key={field.id}>
                <TemplateFieldEditForm
                  templateId={template.id}
                  field={{
                    id: field.id,
                    key: field.key,
                    label: field.label,
                    fieldType: field.fieldType,
                    required: field.required,
                    displayOrder: field.displayOrder,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
