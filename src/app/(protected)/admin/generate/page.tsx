import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { listPublishedTemplates } from "@/server/templates/list-published-templates";

function formatPublishedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function AdminGeneratePage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/admin/generate")) {
    redirect("/dashboard");
  }

  const templates = await listPublishedTemplates();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Generar contrato</CardTitle>
          <CardDescription>
            Solo aparecen templates publicados por un abogado y listos para
            completar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-fit" asChild>
            <Link href="/admin/generated-documents">
              Ver documentos generados
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Templates disponibles</h2>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6">
              <p className="text-sm text-muted-foreground">
                No hay templates publicados disponibles.
              </p>
              <p className="text-sm text-muted-foreground">
                Un abogado debe publicar un template antes de que pueda
                completarse aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {templates.map((template) => (
              <li key={template.id}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary">
                        v{template.version}
                      </Badge>
                    </div>
                    {template.description ? (
                      <CardDescription>{template.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Publicado: {formatPublishedAt(template.publishedAt)}
                    </p>
                    <p>Campos: {template.fieldCount}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <Link href={`/admin/generate/${template.id}`}>
                        Completar formulario
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
