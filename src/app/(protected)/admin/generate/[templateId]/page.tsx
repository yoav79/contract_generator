import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" className="w-fit" asChild>
        <Link href="/admin/generate">← Volver a templates publicados</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">Completar formulario</CardTitle>
            <Badge variant="secondary">v{template.version}</Badge>
          </div>
          <CardDescription>{template.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {template.description ? (
            <p>Descripción: {template.description}</p>
          ) : null}
          <p>Publicado: {formatPublishedAt(template.publishedAt)}</p>
          <p>Campos: {template.fields.length}</p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Datos del contrato</h2>
        <ContractForm templateId={template.id} fields={template.fields} />
      </section>
    </div>
  );
}
