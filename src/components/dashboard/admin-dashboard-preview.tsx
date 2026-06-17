import Link from "next/link";
import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminDashboardPreviewProps = {
  email?: string;
};

type MetricAccent = "emerald" | "cyan" | "blue" | "indigo";

type MockMetric = {
  title: string;
  value: string;
  accent: MetricAccent;
};

const MOCK_METRICS: MockMetric[] = [
  { title: "Contratos generados", value: "48", accent: "blue" },
  { title: "PDFs disponibles", value: "42", accent: "emerald" },
  { title: "Plantillas publicadas", value: "8", accent: "cyan" },
  { title: "Última descarga", value: "Hace 1 h", accent: "indigo" },
];

const WORKFLOW_STEPS = [
  "Elegir plantilla",
  "Completar formulario",
  "Generar PDF",
  "Descargar documento",
] as const;

const accentStyles: Record<
  MetricAccent,
  { card: string; value: string; badge: string }
> = {
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60",
    value: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  cyan: {
    card: "border-cyan-100 bg-gradient-to-br from-white to-cyan-50/60",
    value: "text-cyan-600",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-100",
  },
  blue: {
    card: "border-blue-100 bg-gradient-to-br from-white to-blue-50/60",
    value: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
  },
  indigo: {
    card: "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60",
    value: "text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
};

export function AdminDashboardPreview({ email }: AdminDashboardPreviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Panel administrativo
        </h1>
        <p className="text-sm text-slate-600">
          Genera contratos desde plantillas publicadas y consulta documentos PDF
          disponibles.
        </p>
        {email ? (
          <p className="text-xs text-slate-500">Sesión: {email}</p>
        ) : null}
      </div>

      <Alert className="border-blue-100 bg-blue-50/60 text-slate-700">
        <Info className="text-blue-600" aria-hidden />
        <AlertDescription className="text-slate-600">
          Vista preliminar visual. Las métricas reales se conectarán en una fase
          posterior.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_METRICS.map((metric) => {
          const styles = accentStyles[metric.accent];

          return (
            <Card
              key={metric.title}
              className={cn("border shadow-sm", styles.card)}
            >
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    {metric.title}
                  </CardTitle>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      styles.badge,
                    )}
                  >
                    Ejemplo
                  </span>
                </div>
                <p
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    styles.value,
                  )}
                >
                  {metric.value}
                </p>
                <CardDescription className="text-xs">
                  Mock visual — no representa datos reales.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Acciones rápidas</CardTitle>
          <CardDescription>
            Accede a las tareas habituales de generación y consulta documental.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Link href="/admin/generate">Generar contrato</Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-200">
            <Link href="/admin/generated-documents">Ver documentos</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Flujo administrativo</CardTitle>
          <CardDescription>
            Recorrido desde la plantilla publicada hasta la descarga del PDF.
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
