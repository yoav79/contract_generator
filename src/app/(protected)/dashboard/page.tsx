import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminStaff, isLawyer } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN_STAFF:
      return "Administrativo";
    case UserRole.LAWYER:
      return "Abogado";
    default:
      return role;
  }
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  const roleLabel = getRoleLabel(session.role);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Bienvenido a la consola interna de Contract Generator.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu sesión</CardTitle>
          <CardDescription>
            Acceso autorizado a la plataforma interna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="text-slate-950">{session.email}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Rol:</span>{" "}
            <span className="text-slate-950">{roleLabel}</span>
          </p>
        </CardContent>
      </Card>

      {isAdminStaff(session.role) ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generar contrato</CardTitle>
              <CardDescription>
                Completa formularios guiados a partir de templates publicados
                por abogados.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link href="/admin/generate">Ir a generar contrato</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos generados</CardTitle>
              <CardDescription>
                Consulta el historial de documentos generados y descarga PDFs
                disponibles.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/admin/generated-documents">
                  Ver documentos generados
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}

      {isLawyer(session.role) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gestionar templates</CardTitle>
            <CardDescription>
              Sube plantillas DOCX, configura campos y publica versiones para
              uso administrativo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              asChild
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/lawyer/templates">Ir a templates</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
