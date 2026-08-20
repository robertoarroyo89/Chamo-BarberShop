import { services } from "@/data/business";
import { barberWorksAt, type Barber } from "@/lib/team";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import { slotsForDate } from "@/lib/booking";
import { addDays, getBusinessToday } from "@/lib/hours";

/**
 * Cifras del negocio a partir de las citas guardadas.
 *
 * Todo se calcula en el servidor y se pinta con barras de CSS: no hace falta
 * una librería de gráficos de 50 kB para cinco barras y cuatro números, y menos
 * en un panel que se abre desde el móvil del mostrador.
 */

export interface StatRow {
  label: string;
  value: number;
  /** Segundo dato para la fila, ya formateado (ingresos, porcentaje…). */
  detail?: string;
  accent?: "blue" | "yellow" | "red" | "ink";
}

export interface Stats {
  /** Días que abarca el análisis. */
  windowDays: number;
  totals: {
    /** Citas atendidas o pendientes, sin contar anuladas. */
    cortes: number;
    /** Suma de los precios de esas citas. */
    ingresos: number;
    /** Citas anuladas en el periodo. */
    anuladas: number;
    /** Media de cortes por día abierto. */
    mediaPorDia: number;
    /**
     * Ocupación de los PRÓXIMOS siete días, en porcentaje.
     *
     * Mira hacia delante a propósito. La ocupación pasada tendría que
     * calcularse con la plantilla que había entonces, y aquí solo se conoce la
     * de ahora: quien entró ayer inflaría semanas de capacidad que nunca
     * existió, y quien está en pausa desaparecería del cálculo pese a haber
     * trabajado. Hacia delante la plantilla actual es exactamente la correcta,
     * y además es el dato que de verdad sirve: cuánto hueco queda por vender.
     */
    ocupacionProxima: number;
  };
  /** Cortes por barbero, de más a menos. */
  porBarbero: StatRow[];
  /** Servicios más pedidos, de más a menos. */
  porServicio: StatRow[];
  /** Cortes por semana, de la más antigua a la más reciente. */
  porSemana: StatRow[];
  /** Reparto por hora del día: dice cuándo hace falta más gente. */
  porHora: StatRow[];
}

interface Row {
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  price: number;
  status: string;
}

/** Lunes de la semana a la que pertenece una fecha. */
function weekStart(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  // getUTCDay: 0 = domingo. Se desplaza para que la semana empiece en lunes.
  const offset = (probe.getUTCDay() + 6) % 7;
  return addDays(isoDate, -offset);
}

const ACCENTS = ["blue", "yellow", "red"] as const;

/**
 * Calcula las estadísticas de los últimos `windowDays` días.
 *
 * La consulta filtra solo por fecha —un rango sobre un único campo, que
 * Firestore resuelve con su índice automático— y el resto se agrupa en memoria.
 * Así el negocio no tiene que crear índices compuestos a mano.
 */
export async function getStats(
  team: Barber[],
  windowDays = 56,
): Promise<Stats | null> {
  const db = getDb();
  if (!db) return null;

  const today = getBusinessToday();
  const from = addDays(today, -windowDays);
  /** Ventana hacia delante para la ocupación. */
  const AHEAD = 7;
  const until = addDays(today, AHEAD);

  const snapshot = await db
    .collection(APPOINTMENTS)
    .where("date", ">=", from)
    .where("date", "<=", until)
    .orderBy("date", "asc")
    .limit(4000)
    .get();

  const rows: Row[] = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      date: String(d.date),
      time: String(d.time),
      barberId: String(d.barberId),
      barberName: String(d.barberName),
      serviceId: String(d.serviceId),
      price: Number(d.price ?? 0),
      status: String(d.status),
    };
  });

  // El histórico llega hasta hoy; lo posterior solo cuenta para la ocupación.
  const past = rows.filter((r) => r.date <= today);
  const done = past.filter((r) => r.status === "confirmada");
  const cancelled = past.filter((r) => r.status === "cancelada");

  // --- Ocupación de los próximos días --------------------------------------
  // Se comparan las citas ya cogidas con los huecos que de verdad se ofrecen,
  // cruzando el horario del local con el de cada barbero y descontando
  // ausencias. Así librar o estar de vacaciones no hunde el porcentaje.
  let offeredAhead = 0;
  let bookedAhead = 0;
  const daysOpen = new Set<string>();

  for (let i = 0; i <= AHEAD; i += 1) {
    const date = addDays(today, i);
    for (const time of slotsForDate(date)) {
      offeredAhead += team.filter((b) => barberWorksAt(b, date, time)).length;
    }
  }
  for (const row of rows) {
    if (row.date >= today && row.status === "confirmada") bookedAhead += 1;
  }

  // Días con horario, para la media diaria del histórico.
  for (let i = 0; i < windowDays; i += 1) {
    const date = addDays(from, i);
    if (date > today) break;
    if (slotsForDate(date).length > 0) daysOpen.add(date);
  }

  const byBarber = new Map<
    string,
    { name: string; count: number; sum: number }
  >();
  for (const row of done) {
    const entry = byBarber.get(row.barberId) ?? {
      name: row.barberName,
      count: 0,
      sum: 0,
    };
    entry.count += 1;
    entry.sum += row.price;
    byBarber.set(row.barberId, entry);
  }

  const byService = new Map<string, number>();
  for (const row of done) {
    byService.set(row.serviceId, (byService.get(row.serviceId) ?? 0) + 1);
  }

  const byWeek = new Map<string, number>();
  for (let i = 0; i < windowDays; i += 7) {
    byWeek.set(weekStart(addDays(from, i)), 0);
  }
  for (const row of done) {
    const key = weekStart(row.date);
    if (byWeek.has(key)) byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }

  const byHour = new Map<string, number>();
  for (const row of done) {
    const hour = `${row.time.slice(0, 2)}:00`;
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
  }

  const ingresos = done.reduce((sum, row) => sum + row.price, 0);

  return {
    windowDays,
    totals: {
      cortes: done.length,
      ingresos,
      anuladas: cancelled.length,
      mediaPorDia:
        daysOpen.size > 0
          ? Math.round((done.length / daysOpen.size) * 10) / 10
          : 0,
      ocupacionProxima:
        offeredAhead > 0 ? Math.round((bookedAhead / offeredAhead) * 100) : 0,
    },

    porBarbero: [...byBarber.entries()]
      .map(([id, v], index) => ({
        label: v.name,
        value: v.count,
        detail: `${v.sum} €`,
        accent:
          team.find((b) => b.id === id)?.accent ??
          ACCENTS[index % ACCENTS.length],
      }))
      .sort((a, b) => b.value - a.value),

    porServicio: [...byService.entries()]
      .map(([id, count], index) => ({
        label: services.find((s) => s.id === id)?.name ?? id,
        value: count,
        accent: ACCENTS[index % ACCENTS.length],
      }))
      .sort((a, b) => b.value - a.value),

    porSemana: [...byWeek.entries()].map(([start, count]) => {
      const [, m, d] = start.split("-");
      return {
        label: `${Number(d)}/${Number(m)}`,
        value: count,
        accent: "ink" as const,
      };
    }),

    porHora: [...byHour.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({
        label: hour,
        value: count,
        accent: "blue" as const,
      })),
  };
}
