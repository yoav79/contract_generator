import Link from "next/link";
import { redirect } from "next/navigation";

import { GeneratedDocumentStatus } from "@prisma/client";

import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { listGeneratedDocumentsForAdmin } from "@/server/documents/list-generated-documents-for-admin";

function formatGeneratedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function AdminGeneratedDocumentsPage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  if (!canAccessPath(session.role, "/admin/generated-documents")) {
    redirect("/dashboard");
  }

  const documents = await listGeneratedDocumentsForAdmin();

  return (
    <main>
      <p>
        <Link href="/admin/generate">← Volver a generar contrato</Link>
      </p>

      <h1>Documentos generados</h1>
      <p>Últimos 50 documentos generados. La descarga disponible es solo PDF.</p>

      {documents.length === 0 ? (
        <div>
          <p>No hay documentos generados todavía.</p>
          <p>
            <Link href="/admin/generate">Generar contrato</Link>
          </p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha generación</th>
              <th>Template</th>
              <th>Versión</th>
              <th>Generado por</th>
              <th>Estado</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td>{formatGeneratedAt(document.createdAt)}</td>
                <td>{document.templateName}</td>
                <td>{document.templateVersion}</td>
                <td>{document.generatedByLabel}</td>
                <td>{document.status}</td>
                <td>
                  {document.status === GeneratedDocumentStatus.COMPLETED &&
                  document.pdfAvailable ? (
                    <a
                      href={`/admin/generated-documents/${document.id}/download`}
                    >
                      Descargar PDF
                    </a>
                  ) : (
                    "PDF pendiente"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
