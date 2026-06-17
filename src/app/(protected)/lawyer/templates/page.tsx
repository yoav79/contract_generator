import Link from "next/link";
import { redirect } from "next/navigation";

import { TemplateStatus, TemplateVersionStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { TemplateCreateForm } from "./template-create-form";

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

export default async function LawyerTemplatesPage() {
  const session = await getSession();

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">
          Templates de contrato
        </h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Crear template</h2>
        <TemplateCreateForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Mis templates</h2>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No hay templates todavía.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {templates.map((template) => {
              const version = template.versions[0];

              return (
                <li key={template.id}>
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                        {version ? (
                          <Badge variant="secondary">v{version.version}</Badge>
                        ) : null}
                        <Badge variant={templateStatusVariant(template.status)}>
                          {template.status}
                        </Badge>
                        {version ? (
                          <Badge
                            variant={versionStatusVariant(version.status)}
                          >
                            {version.status}
                          </Badge>
                        ) : null}
                      </div>
                      <CardDescription>
                        Descripción: {template.description ?? "—"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Archivo original: {version?.originalFileName ?? "—"}
                      </p>
                      <p>
                        Tamaño: {formatFileSizeKb(version?.fileSizeBytes)}
                      </p>
                      <p>
                        SHA-256: {formatPartialSha256(version?.docxSha256)}
                      </p>
                      <p>Creado: {formatCreatedAt(template.createdAt)}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" asChild>
                        <Link href={`/lawyer/templates/${template.id}`}>
                          Ver detalle
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
