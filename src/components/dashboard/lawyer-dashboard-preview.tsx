import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LawyerDashboardStats } from "@/server/templates/get-lawyer-dashboard-stats";

type LawyerDashboardPreviewProps = {
  email?: string;
  stats: LawyerDashboardStats;
};

type MetricAccent = "slate" | "cyan" | "emerald" | "zinc";

const accentStyles: Record<
  MetricAccent,
  { card: string; value: string }
> = {
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-white to-slate-50/60",
    value: "text-slate-900",
  },
  cyan: {
    card: "border-cyan-100 bg-gradient-to-br from-white to-cyan-50/60",
    value: "text-cyan-600",
  },
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60",
    value: "text-emerald-600",
  },
  zinc: {
    card: "border-zinc-200 bg-gradient-to-br from-white to-zinc-50/60",
    value: "text-zinc-600",
  },
};

function templateStatusClassName(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "ARCHIVED":
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const WORKFLOW_STEPS = [
  "Subir DOCX",
  "Configurar campos",
  "Publicar template",
  "Administrativos generan PDF",
] as const;

export function LawyerDashboardPreview({
  email,
  stats,
}: LawyerDashboardPreviewProps) {
  const metricCards = [
    {
      title: "Total templates",
      value: stats.totalTemplates,
      accent: "slate" as const,
    },
    {
      title: "Borradores",
      value: stats.draftTemplates,
      accent: "cyan" as const,
    },
    {
      title: "Publicados",
      value: stats.publishedTemplates,
      accent: "emerald" as const,
    },
    {
      title: "Archivados",
      value: stats.archivedTemplates,
      accent: "zinc" as const,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Panel del abogado
        </h1>
        <p className="text-sm text-slate-600">
          Gestiona plantillas, publicaciones y configuración documental.
        </p>
        {email ? (
          <p className="text-xs text-slate-500">Sesión: {email}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const styles = accentStyles[metric.accent];

          return (
            <Card
              key={metric.title}
              className={cn("border shadow-sm", styles.card)}
            >
              <CardHeader className="gap-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  {metric.title}
                </CardTitle>
                <p
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    styles.value,
                  )}
                >
                  {metric.value}
                </p>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">Última actividad: </span>
        {stats.lastActivityAt
          ? formatDateTime(stats.lastActivityAt)
          : "Sin actividad registrada"}
      </p>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Últimos templates</CardTitle>
          <CardDescription>
            Tus plantillas más recientes por fecha de actualización.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentTemplates.length === 0 ? (
            <p className="text-sm text-slate-600">Aún no tienes templates.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200">
              {stats.recentTemplates.map((template) => (
                <li key={template.id}>
                  <Link
                    href={`/lawyer/templates/${template.id}`}
                    className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-slate-900">
                      {template.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <Badge
                        variant="outline"
                        className={templateStatusClassName(template.status)}
                      >
                        {template.status}
                      </Badge>
                      <span>{formatDateTime(template.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Acciones rápidas</CardTitle>
          <CardDescription>
            Accede a las tareas habituales de gestión documental.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
          >
            <Link href="/lawyer/templates">Ver templates</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-200"
          >
            <Link href="/lawyer/templates?create=1">Crear template</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Flujo de trabajo</CardTitle>
          <CardDescription>
            Recorrido documental desde la plantilla hasta el PDF final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-3">
            {WORKFLOW_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
