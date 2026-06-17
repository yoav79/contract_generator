import { redirect } from "next/navigation";

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
    <main>
      <h1>Templates (Abogado)</h1>
      <p>Email: {session.email}</p>

      <section>
        <h2>Crear template</h2>
        <TemplateCreateForm />
      </section>

      <section>
        <h2>Mis templates</h2>
        {templates.length === 0 ? (
          <p>No hay templates todavía.</p>
        ) : (
          <ul>
            {templates.map((template) => {
              const version = template.versions[0];

              return (
                <li key={template.id}>
                  <h3>{template.name}</h3>
                  <p>Descripción: {template.description ?? "—"}</p>
                  <p>Estado del template: {template.status}</p>
                  <p>Versión: {version?.version ?? "—"}</p>
                  <p>Estado de la versión: {version?.status ?? "—"}</p>
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
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
