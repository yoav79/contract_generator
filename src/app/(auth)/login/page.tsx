"use client";

import "bootstrap/dist/css/bootstrap.min.css";

import { useActionState } from "react";

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

function DocumentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <main className="auth-page">
      <div className="auth-blob auth-blob--blue" aria-hidden />
      <div className="auth-blob auth-blob--cyan" aria-hidden />
      <div className="auth-blob auth-blob--emerald" aria-hidden />

      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-badge">Plataforma interna de contratos</span>

          <h1 className="auth-hero-title">
            Contratos legales listos para generar, revisar y descargar
          </h1>
          <p className="auth-hero-subtitle">
            Centraliza plantillas DOCX aprobadas, formularios guiados, PDF seguro
            y auditoría operativa en un flujo interno.
          </p>

          <div className="auth-benefits">
            {BENEFITS.map((benefit) => (
              <article
                key={benefit.number}
                className={`auth-benefit auth-benefit--${benefit.accent}`}
              >
                <span
                  className={`auth-benefit-icon auth-benefit-icon--${benefit.accent}`}
                  aria-hidden
                >
                  {benefit.number}
                </span>
                <h2 className="auth-benefit-title">{benefit.title}</h2>
                <p className="auth-benefit-desc">{benefit.description}</p>
              </article>
            ))}
          </div>

          <div className="auth-update">
            <p className="auth-update-label">Última actualización</p>
            <p className="auth-update-text">
              Fase 10 — interfaz visual renovada
            </p>
          </div>
        </section>

        <section className="auth-login-wrap">
          <div className="auth-card">
            <div className="auth-icon">
              <DocumentIcon />
            </div>

            <h2 className="auth-title">Iniciar sesión</h2>
            <p className="auth-subtitle">
              Accede a Contract Generator con tu cuenta interna.
            </p>

            <form action={formAction}>
              {state.error ? (
                <div className="alert alert-danger py-2" role="alert">
                  {state.error}
                </div>
              ) : null}

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-auth w-100"
                disabled={isPending}
              >
                {isPending ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <p className="auth-note">
              Acceso restringido a usuarios internos autorizados.
            </p>

            <div className="auth-features">
              <ul>
                {LOGIN_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
