import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TemplateStatus, TemplateVersionStatus } from "@prisma/client";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { ArchiveTemplateForm } from "./archive-template-form";
import { ExtractFieldsForm } from "./extract-fields-form";
import { PublishTemplateForm } from "./publish-template-form";
import { TemplateFieldEditForm } from "./template-field-edit-form";
import { TemplateFieldReadonly } from "./template-field-readonly";

type TemplateDetailPageProps = {
  params: Promise<{ templateId: string }>;
};

const MAX_LABEL_LENGTH = 120;

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

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function areFieldLabelsValid(
  fields: Array<{ label: string }>,
): boolean {
  return fields.every((field) => {
    const trimmedLabel = field.label.trim();

    return trimmedLabel.length > 0 && trimmedLabel.length <= MAX_LABEL_LENGTH;
  });
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

  const isDraft = template.status === TemplateStatus.DRAFT;
  const isPublished = template.status === TemplateStatus.PUBLISHED;
  const isArchived = template.status === TemplateStatus.ARCHIVED;

  const hasDocx = Boolean(version?.docxPath);
  const fieldCount = fields.length;
  const labelsValid = areFieldLabelsValid(fields);
  const versionIsDraft = version?.status === TemplateVersionStatus.DRAFT;
  const canPublish =
    isDraft &&
    versionIsDraft &&
    hasDocx &&
    fieldCount >= 1 &&
    labelsValid;

  return (
    <main>
      <p>
        <Link href="/lawyer/templates">← Volver a templates</Link>
      </p>

      <h1>{template.name}</h1>
      <p>Email: {session.email}</p>

      {isArchived ? (
        <p role="status">Template archivado. No se pueden realizar cambios.</p>
      ) : null}

      <section>
        <h2>Metadata del template</h2>
        <p>Descripción: {template.description ?? "—"}</p>
        <p>Estado del template: {template.status}</p>
        <p>Versión actual: {version?.version ?? "—"}</p>
        <p>Estado de la versión: {version?.status ?? "—"}</p>
        {version?.publishedAt ? (
          <p>Publicado: {formatDateTime(version.publishedAt)}</p>
        ) : null}
        <p>Archivo original: {version?.originalFileName ?? "—"}</p>
        <p>Tamaño: {formatFileSizeKb(version?.fileSizeBytes)}</p>
        <p>SHA-256: {formatPartialSha256(version?.docxSha256)}</p>
        <p>Creado: {formatDateTime(template.createdAt)}</p>
      </section>

      {isDraft ? (
        <section>
          <h2>Extracción de placeholders</h2>
          <ExtractFieldsForm templateId={template.id} />
        </section>
      ) : null}

      <section>
        <h2>Campos detectados</h2>
        {fields.length === 0 ? (
          <p>Aún no hay placeholders extraídos.</p>
        ) : (
          <ul>
            {fields.map((field) => (
              <li key={field.id}>
                {isDraft ? (
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
                ) : (
                  <TemplateFieldReadonly
                    field={{
                      key: field.key,
                      label: field.label,
                      fieldType: field.fieldType,
                      required: field.required,
                      displayOrder: field.displayOrder,
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isDraft ? (
        <section>
          <h2>Publicar template</h2>
          <ul>
            <li>DOCX asociado: {hasDocx ? "Sí" : "No"}</li>
            <li>Campos detectados: {fieldCount}</li>
            <li>Labels válidos: {labelsValid ? "Sí" : "No"}</li>
            <li>
              Estado versión: {version?.status ?? "—"}
            </li>
          </ul>
          <PublishTemplateForm
            templateId={template.id}
            disabled={!canPublish}
          />
        </section>
      ) : null}

      {isPublished ? (
        <section>
          <h2>Archivar template</h2>
          <p>
            Este template está publicado
            {version?.publishedAt
              ? ` desde ${formatDateTime(version.publishedAt)}`
              : ""}
            . Puedes archivarlo para impedir su uso futuro por personal
            administrativo.
          </p>
          <ArchiveTemplateForm templateId={template.id} />
        </section>
      ) : null}
    </main>
  );
}
