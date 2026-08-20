import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { AgendaLogin } from "./agenda-login";
import { cancelFromDashboard, logout } from "./actions";
import { Button } from "@/components/ui/Button";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { barbers, booking, business } from "@/data/business";
import { hasSession, isAdminConfigured } from "@/lib/adminAuth";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import {
  addDays,
  formatTime,
  getBusinessToday,
  longDateLabel,
} from "@/lib/hours";
import { cn, formatPrice } from "@/lib/utils";

/** Datos de clientes: nunca se cachea ni se indexa. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false, nocache: true },
};

interface Appointment {
  id: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  price: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
}

/**
 * Color e iniciales por barbero, tomados de la configuración.
 *
 * Las iniciales NO se sacan cortando el nombre: "Andre" y "Antonio" darían las
 * dos "AN" y en el panel no se distinguiría de quién es la cita.
 */
const BARBER_CHIP: Record<string, { accent: string; initials: string }> =
  Object.fromEntries(
    barbers.map((b) => [
      b.id,
      {
        accent:
          b.accent === "blue"
            ? "bg-blue"
            : b.accent === "yellow"
              ? "bg-yellow"
              : "bg-red",
        initials: b.initials,
      },
    ]),
  );

/**
 * Citas desde hoy hasta el final del horizonte de reservas.
 *
 * La consulta filtra SOLO por fecha y ordena por fecha, que es un caso que
 * Firestore resuelve con su índice automático. El estado y el orden por hora se
 * afinan en memoria a propósito: así el negocio no tiene que crear ningún
 * índice compuesto a mano para que el panel funcione.
 */
async function loadAppointments(): Promise<Appointment[] | null> {
  const db = getDb();
  if (!db) return null;

  const today = getBusinessToday();
  const until = addDays(today, booking.horizonDays);

  const snapshot = await db
    .collection(APPOINTMENTS)
    .where("date", ">=", today)
    .where("date", "<=", until)
    .orderBy("date", "asc")
    .limit(600)
    .get();

  return snapshot.docs
    .filter((doc) => doc.data().status === "confirmada")
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date as string,
        time: data.time as string,
        barberId: data.barberId as string,
        barberName: data.barberName as string,
        serviceName: data.serviceName as string,
        price: data.price as number,
        customerName: data.customerName as string,
        customerPhone: data.customerPhone as string,
        notes: (data.notes as string | null) ?? null,
      };
    })
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
}

export default async function AgendaPage() {
  if (!isAdminConfigured()) {
    return (
      <Shell>
        <div className="keyline bg-paper-raised p-6 shadow-hard">
          <h1 className="text-2xl">Panel no configurado</h1>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            Falta la variable <code>ADMIN_PASSWORD</code> (mínimo 8 caracteres).
            Ver README.md → «Panel de la barbería».
          </p>
        </div>
      </Shell>
    );
  }

  if (!(await hasSession())) {
    return (
      <Shell>
        <div className="mx-auto max-w-sm">
          <AgendaLogin />
        </div>
      </Shell>
    );
  }

  const appointments = await loadAppointments();

  if (appointments === null) {
    return (
      <Shell>
        <div className="keyline bg-paper-raised p-6 shadow-hard">
          <h1 className="text-2xl">Agenda sin conectar</h1>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">
            No hay credenciales de Firebase en este despliegue, así que no hay
            citas que mostrar. Ver README.md → «Reservas».
          </p>
        </div>
      </Shell>
    );
  }

  // Agrupadas por día, en el orden en que llegan (ya ordenadas).
  const days = new Map<string, Appointment[]>();
  for (const row of appointments) {
    const list = days.get(row.date) ?? [];
    list.push(row);
    days.set(row.date, list);
  }

  const today = getBusinessToday();

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-poster text-[clamp(2.25rem,7vw,3.5rem)]">
            Agenda
          </h1>
          <p className="text-ink-soft mt-2 text-sm">
            {appointments.length === 0
              ? "No hay citas pendientes."
              : `${appointments.length} ${appointments.length === 1 ? "cita" : "citas"} de aquí a ${booking.horizonDays} días.`}
          </p>
        </div>

        <form action={logout}>
          <Button type="submit" tone="paper" size="sm">
            Salir
          </Button>
        </form>
      </div>

      {days.size === 0 ? (
        <div className="keyline bg-paper-raised mt-8 p-6">
          <p className="text-ink-soft text-sm">
            Cuando alguien reserve, la cita aparecerá aquí con su teléfono para
            poder avisarle.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {[...days.entries()].map(([date, list]) => (
            <section key={date}>
              <h2 className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-xl">
                  {date === today ? "Hoy" : longDateLabel(date)}
                </span>
                <span className="text-ink-faint text-xs font-semibold">
                  {list.length} {list.length === 1 ? "cita" : "citas"}
                </span>
              </h2>

              <ul className="keyline-t mt-3">
                {list.map((row) => (
                  <li
                    key={row.id}
                    className="keyline-b flex flex-wrap items-center gap-x-5 gap-y-3 py-4"
                  >
                    <span className="font-display w-16 shrink-0 text-2xl leading-none tabular-nums">
                      {formatTime(row.time)}
                    </span>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "keyline font-display text-on-color grid size-8 shrink-0 place-items-center text-xs leading-none",
                        BARBER_CHIP[row.barberId]?.accent ?? "bg-blue",
                      )}
                    >
                      {BARBER_CHIP[row.barberId]?.initials ??
                        row.barberName.slice(0, 2).toUpperCase()}
                    </span>

                    <span className="min-w-40 flex-1">
                      <span className="font-display block text-base leading-tight">
                        {row.customerName}
                      </span>
                      <span className="text-ink-soft block text-sm">
                        {row.serviceName} · {formatPrice(row.price)} ·{" "}
                        {row.barberName}
                      </span>
                      {row.notes ? (
                        <span className="text-ink-faint mt-1 block text-sm italic">
                          «{row.notes}»
                        </span>
                      ) : null}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <a
                        href={`tel:${row.customerPhone}`}
                        aria-label={`Llamar a ${row.customerName} al ${row.customerPhone}`}
                        className="keyline bg-paper-raised grid size-10 place-items-center"
                      >
                        <Phone aria-hidden="true" size={16} />
                      </a>
                      <a
                        href={`https://wa.me/${row.customerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escribir a ${row.customerName} por WhatsApp`}
                        className="keyline bg-paper-raised grid size-10 place-items-center"
                      >
                        <WhatsAppGlyph size={17} />
                      </a>
                      <form action={cancelFromDashboard}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button
                          type="submit"
                          tone="paper"
                          size="sm"
                          ariaLabel={`Anular la cita de ${row.customerName} del ${longDateLabel(row.date)} a las ${formatTime(row.time)}`}
                        >
                          Anular
                        </Button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper min-h-svh py-10">
      <div className="container-page">
        <p className="eyebrow text-ink-faint mb-6">
          {business.shortName} · interno
        </p>
        {children}
      </div>
    </div>
  );
}
