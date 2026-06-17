import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TemplateStatus, TemplateVersionStatus } from "@prisma/client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function templateStatusVariant(
  status: TemplateStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case TemplateStatus.PUBLISHED:
      return "default";
    case TemplateStatus.ARCHIVED:
      return "secondary";
    default:
      return "outline";
  }
}

function versionStatusVariant(
  status: TemplateVersionStatus,
): "default" | "secondary" | "outline" {
  switch (status) {
    case TemplateVersionStatus.PUBLISHED:
      return "default";
    default:
      return "outline";
  }
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" className="w-fit" asChild>
        <Link href="/lawyer/templates">← Volver a templates</Link>
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium tracking-tight">
            {template.name}
          </h1>
          {version ? (
            <Badge variant="secondary">v{version.version}</Badge>
          ) : null}
          <Badge variant={templateStatusVariant(template.status)}>
            {template.status}
          </Badge>
          {version ? (
            <Badge variant={versionStatusVariant(version.status)}>
              {version.status}
            </Badge>
          ) : null}
        </div>
      </div>

      {isArchived ? (
        <div role="status">
          <Alert>
            <AlertDescription>
              Template archivado. No se pueden realizar cambios.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata del template</CardTitle>
          <CardDescription>
            Descripción: {template.description ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {version?.publishedAt ? (
            <p>Publicado: {formatDateTime(version.publishedAt)}</p>
          ) : null}
          <p>Archivo original: {version?.originalFileName ?? "—"}</p>
          <p>Tamaño: {formatFileSizeKb(version?.fileSizeBytes)}</p>
          <p>SHA-256: {formatPartialSha256(version?.docxSha256)}</p>
          <p>Creado: {formatDateTime(template.createdAt)}</p>
        </CardContent>
      </Card>

      {isDraft ? <ExtractFieldsForm templateId={template.id} /> : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Campos detectados</h2>
        {fields.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Aún no hay placeholders extraídos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
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
                  <Card>
                    <CardContent className="pt-6">
                      <TemplateFieldReadonly
                        field={{
                          key: field.key,
                          label: field.label,
                          fieldType: field.fieldType,
                          required: field.required,
                          displayOrder: field.displayOrder,
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isDraft ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publicar template</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>DOCX asociado: {hasDocx ? "Sí" : "No"}</li>
              <li>Campos detectados: {fieldCount}</li>
              <li>Labels válidos: {labelsValid ? "Sí" : "No"}</li>
              <li>Estado versión: {version?.status ?? "—"}</li>
            </ul>
            <PublishTemplateForm
              templateId={template.id}
              disabled={!canPublish}
            />
          </CardContent>
        </Card>
      ) : null}

      {isPublished ? (
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
