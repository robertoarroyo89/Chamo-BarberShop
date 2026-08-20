import type { DaySchedule, TimeRange, WeekDay } from "@/data/business";

/**
 * Utilidades de horario.
 *
 * Todo se calcula en la zona horaria del negocio (Europe/Madrid), no en la del
 * visitante: alguien consultando la web desde Londres o Bogotá debe ver el
 * estado real de la barbería. Se usa Intl con `timeZone` para no depender de
 * la configuración del dispositivo ni de librerías externas.
 *
 * El estado "abierto ahora" se calcula únicamente en el cliente tras el
 * montaje (ver components/ui/OpenStatus.tsx), de modo que el HTML del servidor
 * y el del cliente coinciden siempre y no hay avisos de hidratación.
 */

export const BUSINESS_TIME_ZONE = "Europe/Madrid";

/** Minutos transcurridos desde medianoche para un "HH:MM". */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "09:30" → "9:30"; "16:00" → "16:00". Formato español, sin cero inicial. */
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  return `${Number(h)}:${m}`;
}

export function formatRange(range: TimeRange): string {
  return `${formatTime(range.from)} – ${formatTime(range.to)}`;
}

const WEEKDAY_INDEX: Record<string, WeekDay> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface BusinessNow {
  day: WeekDay;
  /** Minutos desde medianoche en Europe/Madrid. */
  minutes: number;
}

/** Día y hora actuales en la zona horaria del negocio. */
export function getBusinessNow(date: Date = new Date()): BusinessNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  // Con hour12:false, Intl puede devolver "24" a medianoche en algunos motores.
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));

  return {
    day: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: hour * 60 + minute,
  };
}

export type OpenStatus =
  | {
      state: "open";
      /** Hora de cierre del tramo en curso, "HH:MM". */
      until: string;
      /** true si tras este tramo aún queda otro el mismo día. */
      reopensLater: boolean;
    }
  | {
      state: "closed";
      /** Próxima apertura, "HH:MM". */
      nextFrom: string;
      /** Etiqueta del día de la próxima apertura. */
      nextDayLabel: string;
      /** true si la próxima apertura es hoy mismo. */
      isToday: boolean;
      /** true si la próxima apertura es mañana. */
      isTomorrow: boolean;
    };

function scheduleFor(
  schedule: DaySchedule[],
  day: WeekDay,
): DaySchedule | undefined {
  return schedule.find((d) => d.day === day);
}

/**
 * Calcula si el negocio está abierto y, si no, cuándo vuelve a abrir.
 * Recorre como máximo los 7 días siguientes; si no encontrase ninguna
 * apertura devuelve null (horario completamente vacío).
 */
export function getOpenStatus(
  schedule: DaySchedule[],
  now: BusinessNow = getBusinessNow(),
): OpenStatus | null {
  const today = scheduleFor(schedule, now.day);

  if (today) {
    const ranges = [...today.ranges].sort(
      (a, b) => toMinutes(a.from) - toMinutes(b.from),
    );

    for (let i = 0; i < ranges.length; i += 1) {
      const from = toMinutes(ranges[i].from);
      const to = toMinutes(ranges[i].to);

      if (now.minutes >= from && now.minutes < to) {
        return {
          state: "open",
          until: ranges[i].to,
          reopensLater: i < ranges.length - 1,
        };
      }

      // Aún no ha abierto este tramo: es la próxima apertura del día.
      if (now.minutes < from) {
        return {
          state: "closed",
          nextFrom: ranges[i].from,
          nextDayLabel: today.label,
          isToday: true,
          isTomorrow: false,
        };
      }
    }
  }

  // Buscar el próximo día con apertura.
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = ((((now.day + offset) % 7) + 7) % 7) as WeekDay;
    const next = scheduleFor(schedule, day);
    if (!next || next.ranges.length === 0) continue;

    const first = [...next.ranges].sort(
      (a, b) => toMinutes(a.from) - toMinutes(b.from),
    )[0];
    return {
      state: "closed",
      nextFrom: first.from,
      nextDayLabel: next.label,
      isToday: false,
      isTomorrow: offset === 1,
    };
  }

  return null;
}

export interface ScheduleGroup {
  /** "Lunes — Viernes" o "Sábado". */
  label: string;
  ranges: TimeRange[];
  /** Días incluidos, para datos estructurados. */
  days: WeekDay[];
}

/**
 * Agrupa días consecutivos con el mismo horario, para no repetir cinco filas
 * idénticas en la interfaz. Recorre el horario en orden de presentación
 * (lunes → domingo), tal y como está declarado en business.ts.
 */
export function groupSchedule(schedule: DaySchedule[]): ScheduleGroup[] {
  const signature = (ranges: TimeRange[]) =>
    ranges.map((r) => `${r.from}-${r.to}`).join("|") || "closed";

  const groups: ScheduleGroup[] = [];
  let run: DaySchedule[] = [];

  const flush = () => {
    if (run.length === 0) return;
    const first = run[0];
    const last = run[run.length - 1];
    groups.push({
      label: run.length === 1 ? first.label : `${first.label} — ${last.label}`,
      ranges: first.ranges as TimeRange[],
      days: run.map((d) => d.day),
    });
    run = [];
  };

  for (const day of schedule) {
    if (run.length > 0 && signature(run[0].ranges) !== signature(day.ranges)) {
      flush();
    }
    run.push(day);
  }
  flush();

  return groups;
}

/** Resumen de una línea para el pie de página. */
export function scheduleSummary(schedule: DaySchedule[]): string {
  return groupSchedule(schedule)
    .map((group) => {
      const when =
        group.ranges.length === 0
          ? "Cerrado"
          : group.ranges.map(formatRange).join(" / ");
      return `${group.label}: ${when}`;
    })
    .join(" · ");
}

// ---------------------------------------------------------------------------
// FECHAS DE CALENDARIO
//
// Las fechas se manejan como cadenas "YYYY-MM-DD" que representan un día del
// calendario en Madrid, no instantes. Así se evita el error clásico de las
// agendas: construir un Date en la zona del navegador y acabar reservando el
// día anterior o siguiente según desde dónde se mire.
// ---------------------------------------------------------------------------

/** Fecha de hoy en el negocio, como "YYYY-MM-DD". */
export function getBusinessToday(date: Date = new Date()): string {
  // "en-CA" da directamente el formato ISO aaaa-mm-dd.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Día de la semana de una fecha de calendario.
 *
 * Se interpreta a mediodía UTC a propósito: así ningún desplazamiento de zona
 * ni cambio de hora puede empujar la fecha al día vecino.
 */
export function weekDayOf(isoDate: string): WeekDay {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() as WeekDay;
}

/** Suma días a una fecha de calendario y devuelve "YYYY-MM-DD". */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d, 12));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** true si la cadena tiene forma de fecha de calendario válida. */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

const DAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** "2026-08-21" → { weekday: "vie", day: "21", month: "ago" } */
export function describeDate(isoDate: string) {
  const [, m, d] = isoDate.split("-").map(Number);
  return {
    weekday: DAY_SHORT[weekDayOf(isoDate)],
    day: String(d),
    month: MONTH_SHORT[m - 1],
  };
}

/** Etiqueta larga para confirmaciones: "viernes 21 de agosto". */
export function longDateLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  const long = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${long[weekDayOf(isoDate)]} ${d} de ${months[m - 1]}`;
}
