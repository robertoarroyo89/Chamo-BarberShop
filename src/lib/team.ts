import {
  barbers as SEED_BARBERS,
  openingHours,
  type TimeRange,
  type WeekDay,
} from "@/data/business";
import { toMinutes, weekDayOf } from "@/lib/hours";

/**
 * El equipo: tipos y reglas de disponibilidad.
 *
 * Este módulo es PURO a propósito — no importa `firebase-admin` ni toca la red.
 * Es lo que permite que `lib/booking` lo use y que el formulario de reserva del
 * navegador comparta exactamente las mismas reglas que el servidor, sin
 * arrastrar el SDK de administrador al paquete del cliente.
 *
 * El acceso a la base de datos vive aparte, en `lib/barbersStore`.
 *
 * ---------------------------------------------------------------------------
 * El equipo, como dato editable.
 *
 * Antes la plantilla vivía escrita en `data/business.ts`. Eso obligaba a tocar
 * el código y volver a despegar cada vez que alguien entra, se va, coge
 * vacaciones o cambia de turno — justo lo que pasa en verano. Ahora vive en
 * Firestore y se gestiona desde el panel.
 *
 * `data/business.ts` sigue siendo la semilla: es lo que se carga la primera vez
 * y lo que se usa si el proyecto todavía no tiene Firebase configurado, de modo
 * que la web nunca se queda sin equipo que mostrar.
 */

export const BARBERS = "barberos";

export type BarberStatus =
  /** Coge citas con normalidad. */
  | "activo"
  /** Sigue en la casa pero no coge citas: baja, vacaciones, permiso. */
  | "pausa"
  /** Ya no trabaja aquí. Se conserva su historial, pero no aparece. */
  | "baja";

export type Accent = "blue" | "yellow" | "red";

export interface Absence {
  /** "YYYY-MM-DD", ambos días incluidos. */
  from: string;
  to: string;
  reason?: string;
}

export interface Barber {
  id: string;
  name: string;
  initials: string;
  accent: Accent;
  status: BarberStatus;
  order: number;
  /**
   * Horario propio por día de la semana.
   *
   * `null` = sigue el horario del local (lo normal).
   * `[]`   = ese día no trabaja.
   * lista  = sus tramos, para turnos partidos o jornadas reducidas.
   */
  hours: Partial<Record<WeekDay, TimeRange[] | null>>;
  /** Ausencias con fechas: vacaciones, baja médica, un día suelto. */
  absences: Absence[];
}

/** Equipo de partida, tomado de la configuración del proyecto. */
export const DEFAULT_BARBERS: Barber[] = SEED_BARBERS.map((b, index) => ({
  id: b.id,
  name: b.name,
  initials: b.initials,
  accent: b.accent,
  status: "activo",
  order: index,
  hours: {},
  absences: [],
}));

const ACCENT_CYCLE: Accent[] = ["blue", "yellow", "red"];

/** Color para un miembro nuevo, alternando para que no se repitan seguidos. */
export function nextAccent(existing: Barber[]): Accent {
  const counts = ACCENT_CYCLE.map(
    (accent) => existing.filter((b) => b.accent === accent).length,
  );
  const min = Math.min(...counts);
  return ACCENT_CYCLE[counts.indexOf(min)];
}

/** Iniciales sugeridas, evitando que dos personas compartan las mismas. */
export function suggestInitials(name: string, existing: Barber[]): string {
  const clean = name
    .trim()
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÑ ]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";

  const taken = new Set(existing.map((b) => b.initials));

  // Primero, iniciales de nombre y apellido: "Juan Pérez" → "JP".
  if (words.length > 1) {
    const pair = words[0][0] + words[1][0];
    if (!taken.has(pair)) return pair;
  }

  // Si no, primera letra combinada con las siguientes del nombre: JU, JA, JN…
  const first = words[0];
  for (let i = 1; i < first.length; i += 1) {
    const candidate = first[0] + first[i];
    if (!taken.has(candidate)) return candidate;
  }

  return first.slice(0, 2).padEnd(2, "X");
}

/** Solo quienes se muestran en la web: excluye a los que ya no trabajan aquí. */
export function visibleBarbers(all: Barber[]): Barber[] {
  return all.filter((b) => b.status !== "baja");
}

/** Solo quienes cogen citas ahora mismo. */
export function bookableBarbers(all: Barber[]): Barber[] {
  return all.filter((b) => b.status === "activo");
}

// ---------------------------------------------------------------------------
// DISPONIBILIDAD
// ---------------------------------------------------------------------------

/** Tramos del local para un día de la semana. */
function shopRanges(day: WeekDay): TimeRange[] {
  return openingHours.find((d) => d.day === day)?.ranges ?? [];
}

/** Tramos efectivos de un barbero ese día: los suyos o los del local. */
export function effectiveRanges(barber: Barber, day: WeekDay): TimeRange[] {
  const own = barber.hours?.[day];
  if (own === undefined || own === null) return shopRanges(day);
  return own;
}

/** true si la fecha cae dentro de alguna ausencia declarada. */
export function isAway(barber: Barber, isoDate: string): boolean {
  return (barber.absences ?? []).some(
    (absence) => isoDate >= absence.from && isoDate <= absence.to,
  );
}

/**
 * ¿Puede este barbero coger una cita a esta hora?
 *
 * Se comprueba, en este orden: que esté activo, que no esté ausente ese día y
 * que la hora caiga dentro de sus tramos. El cruce con las citas ya existentes
 * se hace aparte, en lib/booking.
 */
export function barberWorksAt(
  barber: Barber,
  isoDate: string,
  time: string,
): boolean {
  if (barber.status !== "activo") return false;
  if (isAway(barber, isoDate)) return false;

  const minutes = toMinutes(time);
  return effectiveRanges(barber, weekDayOf(isoDate)).some(
    (range) =>
      minutes >= toMinutes(range.from) && minutes < toMinutes(range.to),
  );
}

// ---------------------------------------------------------------------------

/** Convierte un nombre en un identificador estable y legible. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
