import type { Metadata } from "next";
import { AgendaLogin } from "../agenda-login";
import { AddBarber } from "@/components/agenda/AddBarber";
import { BarberCard } from "@/components/agenda/BarberCard";
import { NotConfigured, NotConnected, Shell } from "@/components/agenda/Shell";
import { getAllBarbers } from "@/lib/barbersStore";
import { isBookingConfigured } from "@/lib/firebaseAdmin";
import { panelState } from "@/lib/panelGuard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Equipo",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EquipoPage() {
  const state = await panelState();

  if (state === "sin-configurar") {
    return (
      <Shell authed={false}>
        <NotConfigured />
      </Shell>
    );
  }
  if (state === "anonimo") {
    return (
      <Shell authed={false}>
        <div className="mx-auto max-w-sm">
          <AgendaLogin />
        </div>
      </Shell>
    );
  }

  const connected = isBookingConfigured();

  // Sin base de datos no se puede gestionar nada: se explica qué falta en vez
  // de mostrar una plantilla de mentira que no se puede guardar.
  if (!connected) {
    return (
      <Shell authed active="/agenda/equipo">
        <NotConnected />
      </Shell>
    );
  }

  const team = await getAllBarbers();

  const active = team.filter((b) => b.status === "activo");
  const paused = team.filter((b) => b.status === "pausa");
  const gone = team.filter((b) => b.status === "baja");

  return (
    <Shell authed active="/agenda/equipo">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-poster text-[clamp(2rem,6vw,3rem)]">Equipo</h1>
          <p className="text-ink-soft mt-2 text-sm">
            {active.length} cogiendo citas
            {paused.length > 0 ? ` · ${paused.length} en pausa` : ""}
            {gone.length > 0 ? ` · ${gone.length} de baja` : ""}
          </p>
        </div>
      </div>

      <div className="mt-7">
        <AddBarber />
      </div>

      <div className="mt-8 space-y-5">
        {[...active, ...paused, ...gone].map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>

      <div className="keyline bg-paper-raised mt-10 p-5">
        <h2 className="font-display text-base">Cómo funciona cada estado</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-semibold">Coge citas</dt>
            <dd className="text-ink-soft">
              Aparece en la web y en el selector de reservas.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">En pausa</dt>
            <dd className="text-ink-soft">
              Sigue en la web pero no se le pueden pedir citas. Para una baja
              larga o un permiso sin fecha de vuelta.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Ya no trabaja aquí</dt>
            <dd className="text-ink-soft">
              Desaparece de la web y de las reservas, pero sus cortes siguen
              contando en el resumen.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Ausencias</dt>
            <dd className="text-ink-soft">
              Para vacaciones o días sueltos con fecha de vuelta. Es lo mejor
              para los turnos de verano.
            </dd>
          </div>
        </dl>
      </div>
    </Shell>
  );
}
