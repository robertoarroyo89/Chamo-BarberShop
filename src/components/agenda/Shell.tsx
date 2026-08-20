import { logout } from "@/app/agenda/actions";
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

/** Aviso cuando falta Firebase y por tanto no hay agenda que mostrar. */
export function NotConnected() {
  return (
    <div className="keyline bg-paper-raised p-6 shadow-hard">
      <h1 className="text-2xl">Agenda sin conectar</h1>
      <p className="text-ink-soft mt-3 max-w-md text-sm leading-relaxed">
        No hay credenciales de Firebase en este despliegue, así que no hay citas
        que mostrar. Ver README.md → «Reservas».
      </p>
    </div>
  );
}
