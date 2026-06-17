"use client";

import { useActionState } from "react";

import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form action={formAction}>
        {state.error ? <p role="alert">{state.error}</p> : null}
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
