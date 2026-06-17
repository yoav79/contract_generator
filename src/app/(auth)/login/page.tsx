"use client";

import { useActionState } from "react";
import { FileText } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { loginAction } from "./actions";

const BENEFITS = [
  {
    number: "01",
    accent: "blue" as const,
    title: "Control legal",
    description: "Plantillas publicadas por abogados",
  },
  {
    number: "02",
    accent: "cyan" as const,
    title: "Captura guiada",
    description: "Formularios simples para administrativos",
  },
  {
    number: "03",
    accent: "emerald" as const,
    title: "PDF seguro",
    description: "Descarga final sin exponer DOCX editable",
  },
  {
    number: "04",
    accent: "indigo" as const,
    title: "Trazabilidad",
    description: "Auditoría de generación y descarga",
  },
] as const;

const LOGIN_FEATURES = [
  "Templates aprobados",
  "PDF seguro",
  "Auditoría activa",
] as const;

const benefitStyles = {
  blue: {
    card: "border-blue-100/80 bg-gradient-to-b from-white to-blue-50/70",
    icon: "bg-blue-600",
  },
  cyan: {
    card: "border-cyan-100/80 bg-gradient-to-b from-white to-cyan-50/70",
    icon: "bg-cyan-500",
  },
  emerald: {
    card: "border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/70",
    icon: "bg-emerald-500",
  },
  indigo: {
    card: "border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/70",
    icon: "bg-indigo-500",
  },
} as const;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30 p-6">
      <div
        className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-52 w-52 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 md:p-9 lg:p-10">
          <span className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Plataforma interna de contratos
          </span>

          <h1 className="mt-5 max-w-xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl md:leading-tight">
            Contratos legales listos para generar, revisar y descargar
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
            Centraliza plantillas DOCX aprobadas, formularios guiados, PDF seguro
            y auditoría operativa en un flujo interno.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {BENEFITS.map((benefit) => {
              const styles = benefitStyles[benefit.accent];

              return (
                <article
                  key={benefit.number}
                  className={cn(
                    "flex min-h-[7.5rem] flex-col gap-2.5 rounded-xl border p-4",
                    styles.card,
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white",
                      styles.icon,
                    )}
                    aria-hidden
                  >
                    {benefit.number}
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {benefit.title}
                  </h2>
                  <p className="text-sm leading-snug text-slate-600">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Última actualización
            </p>
            <p className="mt-1 text-sm text-slate-800">
              Fase 10 — interfaz visual renovada
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-md rounded-2xl border-slate-200/80 bg-white shadow-xl shadow-slate-900/8">
            <CardHeader className="gap-4 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-950">
                  Iniciar sesión
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  Accede a Contract Generator con tu cuenta interna.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <form action={formAction} className="space-y-4">
                {state.error ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isPending ? "Entrando…" : "Entrar"}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-500">
                Acceso restringido a usuarios internos autorizados.
              </p>

              <div className="border-t border-slate-200 pt-4">
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {LOGIN_FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className="relative pl-3.5 text-xs text-slate-500 before:absolute before:left-0 before:top-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-600"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
