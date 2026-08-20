import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { AgendaLogin } from "./agenda-login";
import { cancelFromDashboard } from "./actions";
import { NotConfigured, NotConnected, Shell } from "@/components/agenda/Shell";
import { Button } from "@/components/ui/Button";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { booking } from "@/data/business";
import { getAllBarbers } from "@/lib/barbersStore";
import { isAway, type Barber } from "@/lib/team";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import {
  addDays,
  formatTime,
  getBusinessToday,
  longDateLabel,
} from "@/lib/hours";
import { panelState } from "@/lib/panelGuard";
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

const FILL = { blue: "bg-blue", yellow: "bg-yellow", red: "bg-red" };

/**
 * Citas desde hoy hasta el final del horizonte de reservas.
 *
 * La consulta filtra SOLO por fecha y ordena por fecha, que es un caso que
 * Firestore resuelve con su índice automático. El estado y el orden por hora se
 * afinan en memoria a propósito: así el negocio no tiene que crear ningún
 * índice compuesto a mano.
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

  const [appointments, team] = await Promise.all([
    loadAppointments(),
    getAllBarbers(),
  ]);

  if (appointments === null) {
    return (
      <Shell authed active="/agenda">
        <NotConnected />
      </Shell>
    );
  }

  const byId = new Map(team.map((b) => [b.id, b]));
  const today = getBusinessToday();

  // Agrupadas por día, en el orden en que llegan (ya ordenadas).
  const days = new Map<string, Appointment[]>();
  for (const row of appointments) {
    const list = days.get(row.date) ?? [];
    list.push(row);
    days.set(row.date, list);
  }

  return (
    <Shell authed active="/agenda">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-poster text-[clamp(2rem,6vw,3rem)]">Citas</h1>
          <p className="text-ink-soft mt-2 text-sm">
            {appointments.length === 0
              ? "No hay citas pendientes."
              : `${appointments.length} ${appointments.length === 1 ? "cita" : "citas"} de aquí a ${booking.horizonDays} días.`}
          </p>
        </div>
      </div>

      {/* Avisos útiles al abrir: quién está ausente hoy. */}
      <TodayNotices team={team} today={today} />

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
                {list.map((row) => {
                  const barber = byId.get(row.barberId);
                  return (
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
                          FILL[barber?.accent ?? "blue"],
                        )}
                      >
                        {barber?.initials ??
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
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}

/** Quién no está disponible hoy, para no llevarse sorpresas en el mostrador. */
function TodayNotices({ team, today }: { team: Barber[]; today: string }) {
  const away = team.filter(
    (b) => b.status !== "baja" && (b.status === "pausa" || isAway(b, today)),
  );
  if (away.length === 0) return null;

  return (
    <div className="keyline bg-yellow text-on-color mt-6 p-4">
      <p className="eyebrow">Hoy no cogen citas</p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        {away.map((b) => {
          const absence = (b.absences ?? []).find(
            (a) => today >= a.from && today <= a.to,
          );
          return (
            <li key={b.id}>
              {b.name}
              <span className="font-normal">
                {" · "}
                {absence?.reason ??
                  (b.status === "pausa" ? "en pausa" : "ausente")}
                {absence
                  ? ` hasta el ${absence.to.split("-").reverse().slice(0, 2).join("/")}`
                  : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
