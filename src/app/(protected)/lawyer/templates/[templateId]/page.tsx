import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { TemplateStatus, TemplateVersionStatus } from "@prisma/client";
import { Check } from "lucide-react";

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
import { cn } from "@/lib/utils";

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

function templateStatusClassName(status: TemplateStatus): string {
  switch (status) {
    case TemplateStatus.PUBLISHED:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case TemplateStatus.ARCHIVED:
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge variant="outline" className={templateStatusClassName(status)}>
      {status}
    </Badge>
  );
}

type WorkflowStepProps = {
  step: number;
  label: string;
  done: boolean;
  isLast?: boolean;
};

function WorkflowStep({ step, label, done, isLast = false }: WorkflowStepProps) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
            done
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-500",
          )}
        >
          {done ? <Check className="size-4" aria-hidden /> : step}
        </div>
        {!isLast ? (
          <div
            className={cn(
              "mt-1 w-px flex-1 min-h-6",
              done ? "bg-blue-200" : "bg-slate-200",
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <div className={cn(isLast ? "pt-1" : "pb-6 pt-1")}>
        <p
          className={cn(
            "text-sm font-medium",
            done ? "text-slate-900" : "text-slate-600",
          )}
        >
          {label}
        </p>
      </div>
    </li>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
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
  const hasOriginalFile = Boolean(version?.originalFileName);
  const fieldCount = fields.length;
  const labelsValid = areFieldLabelsValid(fields);
  const versionIsDraft = version?.status === TemplateVersionStatus.DRAFT;
  const canPublish =
    isDraft &&
    versionIsDraft &&
    hasDocx &&
    fieldCount >= 1 &&
    labelsValid;

  const fieldsConfigured = fieldCount > 0 && labelsValid;
  const workflowFinalLabel = isArchived
    ? "Archivado"
    : isPublished
      ? "Publicado"
      : "Publicación pendiente";
  const workflowFinalDone = isPublished || isArchived;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" className="w-fit text-slate-600" asChild>
        <Link href="/lawyer/templates">← Volver a templates</Link>
      </Button>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {template.name}
          </h1>
          <TemplateStatusBadge status={template.status} />
          {version ? (
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-700"
            >
              v{version.version}
            </Badge>
          ) : null}
        </div>
        {template.description ? (
          <p className="max-w-3xl text-sm text-slate-600">
            {template.description}
          </p>
        ) : null}
      </header>

      {isDraft ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Borrador editable. Extrae placeholders, configura campos y publica cuando
          esté listo.
        </p>
      ) : null}

      {isPublished ? (
        <div role="status">
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <AlertDescription>
              Template publicado. La configuración está en modo solo lectura;
              puedes archivarlo si ya no debe usarse para generar contratos.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isArchived ? (
        <div role="status">
          <Alert className="border-zinc-200 bg-zinc-50 text-zinc-800">
            <AlertDescription>
              Template archivado. No se pueden realizar cambios.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3">
              <SummaryRow label="Estado">
                <TemplateStatusBadge status={template.status} />
              </SummaryRow>
              <SummaryRow label="Versión">
                {version ? `v${version.version}` : "—"}
              </SummaryRow>
              <SummaryRow label="Campos detectados">
                {fieldCount}
              </SummaryRow>
              <SummaryRow label="Modo">
                {isDraft ? "Editable" : "Solo lectura"}
              </SummaryRow>
              <SummaryRow label="Creado">
                {formatDateTime(template.createdAt)}
              </SummaryRow>
              {version?.publishedAt ? (
                <SummaryRow label="Publicado desde">
                  {formatDateTime(version.publishedAt)}
                </SummaryRow>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Documento</CardTitle>
            <CardDescription className="text-slate-600">
              Archivo DOCX asociado a esta versión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Archivo original: </span>
              <span className="font-medium text-slate-900">
                {version?.originalFileName ?? "—"}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Tamaño: </span>
              <span className="text-slate-900">
                {formatFileSizeKb(version?.fileSizeBytes)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">SHA-256: </span>
              <span className="font-mono text-slate-900">
                {formatPartialSha256(version?.docxSha256)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">
              Flujo de trabajo
            </CardTitle>
            <CardDescription className="text-slate-600">
              Progreso de configuración del template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col">
              <WorkflowStep
                step={1}
                label="DOCX cargado"
                done={hasOriginalFile}
              />
              <WorkflowStep
                step={2}
                label="Campos extraídos"
                done={fieldCount > 0}
              />
              <WorkflowStep
                step={3}
                label="Campos configurados"
                done={fieldsConfigured}
              />
              <WorkflowStep
                step={4}
                label={workflowFinalLabel}
                done={workflowFinalDone}
                isLast
              />
            </ol>
          </CardContent>
        </Card>
      </div>

      {isDraft ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium text-slate-900">
              Extraer placeholders
            </h2>
            <p className="text-sm text-slate-600">
              Extrae los placeholders del DOCX antes de configurar los campos.
            </p>
          </div>
          <ExtractFieldsForm templateId={template.id} />
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base text-slate-900">
                Campos detectados
              </CardTitle>
              <CardDescription className="text-slate-600">
                {fieldCount} campo{fieldCount === 1 ? "" : "s"}
              </CardDescription>
            </div>
            {isDraft ? (
              <p className="text-sm text-slate-600">
                Cada campo se guarda individualmente.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  {isDraft
                    ? "Todavía no hay campos detectados."
                    : "No hay campos configurados."}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {isDraft
                    ? "Primero extrae los placeholders del DOCX."
                    : "Este template no tiene campos configurados."}
                </p>
              </div>
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
                      <Card className="border-slate-200 bg-slate-50/50 shadow-none">
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
          </CardContent>
        </Card>
      </section>

      {isDraft ? (
        <section className="flex flex-col gap-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">
                Publicar template
              </CardTitle>
              <CardDescription className="text-slate-600">
                Requisitos para habilitar la publicación
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="space-y-1 text-sm text-slate-600">
                <li>DOCX asociado: {hasDocx ? "Sí" : "No"}</li>
                <li>Campos detectados: {fieldCount}</li>
                <li>Labels válidos: {labelsValid ? "Sí" : "No"}</li>
              </ul>
              <PublishTemplateForm
                templateId={template.id}
                disabled={!canPublish}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {isPublished ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium text-red-900">
              Zona de peligro
            </h2>
            <p className="text-sm text-slate-600">
              Archivar un template publicado impide su uso futuro por personal
              administrativo. Esta acción no se puede deshacer desde la interfaz.
            </p>
          </div>
          <ArchiveTemplateForm templateId={template.id} />
        </section>
      ) : null}
    </div>
  );
}
