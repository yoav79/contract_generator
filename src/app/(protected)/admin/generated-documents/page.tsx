import Link from "next/link";
import { redirect } from "next/navigation";

import { GeneratedDocumentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canAccessPath } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { listGeneratedDocumentsForAdmin } from "@/server/documents/list-generated-documents-for-admin";

function formatGeneratedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function statusBadgeVariant(
  status: GeneratedDocumentStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case GeneratedDocumentStatus.COMPLETED:
      return "default";
    case GeneratedDocumentStatus.FAILED:
      return "destructive";
    default:
      return "secondary";
  }
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Button variant="ghost" className="w-fit" asChild>
        <Link href="/admin/generate">← Volver a generar contrato</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Documentos generados</CardTitle>
          <CardDescription>
            Últimos 50 documentos generados. La descarga disponible es solo PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col gap-4 rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay documentos generados todavía.
              </p>
              <Button className="mx-auto w-fit" asChild>
                <Link href="/admin/generate">Generar contrato</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha generación</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Generado por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      {formatGeneratedAt(document.createdAt)}
                    </TableCell>
                    <TableCell>{document.templateName}</TableCell>
                    <TableCell>{document.templateVersion}</TableCell>
                    <TableCell>{document.generatedByLabel}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(document.status)}>
                        {document.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {document.status === GeneratedDocumentStatus.COMPLETED &&
                      document.pdfAvailable ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`/admin/generated-documents/${document.id}/download`}
                          >
                            Descargar PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          PDF pendiente
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
