import { logout } from "@/app/agenda/actions";
import { diagnoseFirebase } from "@/lib/firebaseAdmin";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/agenda", label: "Citas" },
  { href: "/agenda/equipo", label: "Equipo" },
  { href: "/agenda/resumen", label: "Resumen" },
];

/**
 * Marco del panel interno.
 *
 * La navegación y el botón de salir solo se pintan con sesión abierta. Cada
 * página comprueba la sesión por su cuenta antes de consultar nada: esconder la
 * pestaña no es una defensa.
 */
export function Shell({
  authed,
  active,
  children,
}: {
  authed: boolean;
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-paper min-h-svh">
      <header className="keyline-b bg-paper sticky top-0 z-20">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wordmark compact />
            <span className="keyline bg-yellow text-on-color px-2 py-0.5 text-[0.5625rem] font-bold tracking-[0.16em] uppercase">
              Interno
            </span>
          </div>

          {authed ? (
            <form action={logout}>
              <Button type="submit" tone="paper" size="sm">
                Salir
              </Button>
            </form>
          ) : null}
        </div>

        {authed ? (
          <nav aria-label="Secciones del panel" className="keyline-t">
            <ul className="container-page flex gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const isActive = active === tab.href;
                return (
                  <li key={tab.href}>
                    <a
                      href={tab.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "font-display -mb-0.5 block border-b-4 px-4 py-3 text-sm tracking-[0.06em] whitespace-nowrap uppercase transition-colors",
                        isActive
                          ? "border-blue text-ink"
                          : "text-ink-soft hover:text-ink border-transparent",
                      )}
                    >
                      {tab.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>

      <div className="container-page py-8">{children}</div>
    </div>
  );
}

/** Aviso cuando el panel no está habilitado en este despliegue. */
export function NotConfigured() {
  return (
    <div className="keyline bg-paper-raised p-6 shadow-hard">
      <h1 className="text-2xl">Panel no configurado</h1>
      <p className="text-ink-soft mt-3 max-w-md text-sm leading-relaxed">
        Falta la variable <code>ADMIN_PASSWORD</code> (mínimo 8 caracteres). Ver
        README.md → «Panel de la barbería».
      </p>
    </div>
  );
}

const VAR_LABEL = {
  projectId: "FIREBASE_PROJECT_ID",
  clientEmail: "FIREBASE_CLIENT_EMAIL",
  privateKey: "FIREBASE_PRIVATE_KEY",
} as const;

const STATE_TEXT = {
  ok: "correcta",
  falta: "no llega al servidor",
  formato: "llega, pero con un formato que no vale",
} as const;

/**
 * Aviso cuando falta Firebase, con el detalle de qué variable falla.
 *
 * Va aquí, detrás de la contraseña del panel, y solo dice si cada variable
 * está y si tiene la forma esperada: nunca su valor. Sin esto, un despliegue
 * mal configurado se limita a "no funciona", que es lo más costoso de depurar.
 */
export function NotConnected() {
  const diagnosis = diagnoseFirebase();
  const entries = ["projectId", "clientEmail", "privateKey"] as const;
  const quotedKey = diagnosis.privateKey === "formato";

  return (
    <div className="keyline bg-paper-raised p-6 shadow-hard">
      <h1 className="text-2xl">Agenda sin conectar</h1>
      <p className="text-ink-soft mt-3 max-w-lg text-sm leading-relaxed">
        Faltan credenciales de Firebase en este despliegue, así que no hay citas
        que mostrar y el formulario de la web ofrece WhatsApp.
      </p>

      <ul className="keyline-t mt-5">
        {entries.map((key) => {
          const state = diagnosis[key];
          return (
            <li
              key={key}
              className="keyline-b flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <code className="text-sm font-semibold">{VAR_LABEL[key]}</code>
              <span
                className={cn(
                  "keyline px-2 py-0.5 text-xs font-bold uppercase",
                  state === "ok"
                    ? "bg-blue text-on-color"
                    : "bg-red text-on-color",
                )}
              >
                {STATE_TEXT[state]}
              </span>
            </li>
          );
        })}
      </ul>

      {quotedKey ? (
        <p className="keyline bg-yellow text-on-color mt-4 p-3 text-sm leading-relaxed">
          La clave está pero no se reconoce. Lo habitual: en el panel de Vercel
          el valor va <strong>sin comillas</strong>, y tiene que incluir las
          líneas <code>-----BEGIN PRIVATE KEY-----</code> y{" "}
          <code>-----END PRIVATE KEY-----</code>.
        </p>
      ) : null}

      {diagnosis.initError ? (
        <p className="keyline bg-red text-on-color mt-4 p-3 text-sm leading-relaxed">
          Las tres variables llegan, pero Firebase las rechaza:{" "}
          <span className="font-semibold">{diagnosis.initError}</span>
        </p>
      ) : null}

      <p className="text-ink-soft mt-5 text-sm leading-relaxed">
        Después de añadirlas o corregirlas en Vercel hay que{" "}
        <strong>volver a desplegar</strong>: las variables se leen al construir
        y al arrancar, no en cada visita. Ver README.md → «Reservas».
      </p>
    </div>
  );
}
