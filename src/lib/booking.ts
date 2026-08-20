import {
  ANY_BARBER,
  barbers,
  booking as bookingConfig,
  openingHours,
  services,
} from "@/data/business";
import {
  addDays,
  getBusinessNow,
  getBusinessToday,
  isValidIsoDate,
  toMinutes,
  weekDayOf,
} from "@/lib/hours";

/**
 * Lógica de la agenda. Es código puro y compartido: el servidor la usa para
 * calcular y validar, y el cliente para pintar. Al no haber dos
 * implementaciones, no pueden discrepar.
 */

export interface Slot {
  /** "HH:MM" */
  time: string;
  /** Barberos libres a esa hora. */
  freeBarberIds: string[];
}

/** Identificador del documento en Firestore. Determinista a propósito. */
export function slotKey(date: string, time: string, barberId: string): string {
  return `${date}_${time.replace(":", "")}_${barberId}`;
}

/** Todos los huecos teóricos de un día, sin mirar ocupación. */
export function slotsForDate(isoDate: string): string[] {
  const day = weekDayOf(isoDate);
  const schedule = openingHours.find((d) => d.day === day);
  if (!schedule || schedule.ranges.length === 0) return [];

  const step = bookingConfig.slotMinutes;
  const times: string[] = [];

  for (const range of schedule.ranges) {
    const from = toMinutes(range.from);
    const to = toMinutes(range.to);
    // El último hueco tiene que caber entero antes de cerrar.
    for (let m = from; m + step <= to; m += step) {
      times.push(
        `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
      );
    }
  }

  return times;
}

/**
 * ¿Se puede aún reservar este hueco?
 *
 * Se descartan los días pasados y, en el día de hoy, los huecos que caen
 * dentro del margen mínimo de aviso: nadie quiere una cita que entra dentro de
 * cinco minutos.
 */
export function isSlotBookable(
  isoDate: string,
  time: string,
  now = new Date(),
): boolean {
  const today = getBusinessToday(now);
  if (isoDate < today) return false;
  if (isoDate > today) return true;

  const { minutes } = getBusinessNow(now);
  return toMinutes(time) >= minutes + bookingConfig.minNoticeMinutes;
}

/** Días que se ofrecen para elegir, saltando los que la barbería cierra. */
export function bookableDates(now = new Date()): string[] {
  const today = getBusinessToday(now);
  const dates: string[] = [];

  for (let offset = 0; offset < bookingConfig.horizonDays; offset += 1) {
    const date = addDays(today, offset);
    if (slotsForDate(date).length === 0) continue;
    // Si hoy ya no queda ningún hueco reservable, no se ofrece el día.
    if (
      date === today &&
      !slotsForDate(date).some((time) => isSlotBookable(date, time, now))
    ) {
      continue;
    }
    dates.push(date);
  }

  return dates;
}

/**
 * Cruza los huecos teóricos con lo ya reservado.
 *
 * `taken` son claves "HH:MM__barberId" de las citas existentes de ese día.
 * Un hueco se ofrece mientras quede al menos un barbero libre.
 */
export function availableSlots(
  isoDate: string,
  taken: Set<string>,
  now = new Date(),
): Slot[] {
  return slotsForDate(isoDate)
    .filter((time) => isSlotBookable(isoDate, time, now))
    .map((time) => ({
      time,
      freeBarberIds: barbers
        .filter((barber) => !taken.has(`${time}__${barber.id}`))
        .map((barber) => barber.id),
    }))
    .filter((slot) => slot.freeBarberIds.length > 0);
}

// ---------------------------------------------------------------------------
// VALIDACIÓN DE LA SOLICITUD
// ---------------------------------------------------------------------------

export interface BookingRequest {
  date: string;
  time: string;
  serviceId: string;
  /** Id de barbero, o el de ANY_BARBER para dejarlo a la barbería. */
  barberId: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export interface ValidationResult {
  ok: boolean;
  /** Mensaje pensado para mostrarse tal cual al cliente. */
  error?: string;
  data?: BookingRequest;
}

/** Teléfonos españoles: 9 dígitos, admitiendo prefijo +34 y separadores. */
const PHONE_PATTERN = /^(?:\+?34[\s.-]?)?[6789]\d{2}(?:[\s.-]?\d{2}){3}$/;

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  const bare = digits.replace(/^\+?34/, "");
  return `+34${bare}`;
}

/**
 * Valida y normaliza lo que llega del formulario.
 *
 * Se ejecuta también en el servidor: nunca se confía en la validación del
 * navegador, porque cualquiera puede saltársela.
 */
export function validateBooking(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "No hemos recibido los datos de la reserva." };
  }

  const raw = input as Record<string, unknown>;
  const str = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string).trim() : "";

  const date = str("date");
  const time = str("time");
  const serviceId = str("serviceId");
  const barberId = str("barberId");
  const customerName = str("customerName");
  const customerPhone = str("customerPhone");
  const notes = str("notes");

  if (!isValidIsoDate(date)) {
    return { ok: false, error: "La fecha no es válida." };
  }

  if (!/^\d{2}:\d{2}$/.test(time) || !slotsForDate(date).includes(time)) {
    return {
      ok: false,
      error: "Esa hora no está dentro del horario de la barbería.",
    };
  }

  if (!isSlotBookable(date, time)) {
    return {
      ok: false,
      error: "Esa hora ya ha pasado. Elige otra, por favor.",
    };
  }

  if (!services.some((service) => service.id === serviceId)) {
    return { ok: false, error: "Elige un servicio de la lista." };
  }

  const barberIsValid =
    barberId === ANY_BARBER.id ||
    barbers.some((barber) => barber.id === barberId);
  if (!barberIsValid) {
    return { ok: false, error: "Elige un barbero de la lista." };
  }

  if (customerName.length < 2 || customerName.length > 70) {
    return {
      ok: false,
      error: "Escribe tu nombre para que sepamos quién viene.",
    };
  }

  if (!PHONE_PATTERN.test(customerPhone)) {
    return {
      ok: false,
      error: "Revisa el teléfono: necesitamos un móvil español de 9 dígitos.",
    };
  }

  if (notes.length > 300) {
    return {
      ok: false,
      error: "El comentario es demasiado largo (máximo 300 caracteres).",
    };
  }

  return {
    ok: true,
    data: {
      date,
      time,
      serviceId,
      barberId,
      customerName,
      customerPhone: normalisePhone(customerPhone),
      notes: notes || undefined,
    },
  };
}
