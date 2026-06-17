import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main>
      <h1>Generar contrato</h1>
      <p>
        Solo aparecen templates publicados por un abogado y listos para
        completar.
      </p>
      <p>
        <Link href="/admin/generated-documents">Ver documentos generados</Link>
      </p>

      <section>
        <h2>Templates disponibles</h2>
        {templates.length === 0 ? (
          <div>
            <p>No hay templates publicados disponibles.</p>
            <p>
              Un abogado debe publicar un template antes de que pueda
              completarse aquí.
            </p>
          </div>
        ) : (
          <ul>
            {templates.map((template) => (
              <li key={template.id}>
                <h3>{template.name}</h3>
                {template.description ? (
                  <p>Descripción: {template.description}</p>
                ) : null}
                <p>Versión: {template.version}</p>
                <p>
                  Publicado: {formatPublishedAt(template.publishedAt)}
                </p>
                <p>Campos: {template.fieldCount}</p>
                <p>
                  <Link href={`/admin/generate/${template.id}`}>
                    Completar formulario
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
