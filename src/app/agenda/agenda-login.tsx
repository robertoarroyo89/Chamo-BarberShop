"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { login, type LoginState } from "./actions";

/**
 * Entrada al panel.
 *
 * Es un formulario normal enlazado a una Server Action: funciona igual con
 * JavaScript que sin él, y Next se encarga de la protección contra CSRF.
 */
export function AgendaLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form
      action={action}
      className="keyline bg-paper-raised p-6 shadow-hard-lg"
    >
      <h1 className="text-3xl">Agenda</h1>
      <p className="text-ink-soft mt-2 text-sm">
        Panel interno de la barbería.
      </p>

      <div className="mt-6">
        <label htmlFor="password" className="eyebrow text-ink-soft block">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-describedby={state.error ? "password-error" : undefined}
          className="keyline bg-paper text-ink mt-2 w-full px-3.5 py-3 text-base focus:outline-none"
        />
      </div>

      {state.error ? (
        <p
          id="password-error"
          role="alert"
          className="keyline bg-red text-on-color mt-4 px-3 py-2 text-sm font-semibold"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" tone="blue" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </div>
    </form>
  );
}
