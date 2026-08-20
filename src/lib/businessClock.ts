import { openingHours, type WeekDay } from "@/data/business";
import { getBusinessNow, getOpenStatus, type OpenStatus } from "@/lib/hours";

/**
 * Reloj del negocio como almacén externo.
 *
 * Por qué así y no con `useState` + `useEffect`: el día y el estado de apertura
 * son datos que el servidor no puede conocer. Un almacén externo consumido con
 * `useSyncExternalStore` es la vía prevista por React para exactamente esto —
 * durante la hidratación se usa la instantánea del servidor (null) y después se
 * pasa a la del cliente, sin desajustes y sin renders en cascada.
 *
 * Como beneficio adicional, hay UN solo temporizador para toda la página en vez
 * de uno por componente, y la instantánea se reutiliza mientras no cambie nada
 * observable.
 */

export interface ClockSnapshot {
  day: WeekDay;
  status: OpenStatus | null;
}

/** Clave de comparación: si no cambia, no se notifica a nadie. */
function fingerprint(snapshot: ClockSnapshot): string {
  const { day, status } = snapshot;
  if (!status) return `${day}|none`;
  return status.state === "open"
    ? `${day}|open|${status.until}|${status.reopensLater}`
    : `${day}|closed|${status.nextFrom}|${status.nextDayLabel}|${status.isToday}|${status.isTomorrow}`;
}

function compute(): ClockSnapshot {
  const now = getBusinessNow();
  return { day: now.day, status: getOpenStatus(openingHours, now) };
}

let cached: ClockSnapshot | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function refresh(notify: boolean) {
  const next = compute();
  if (cached && fingerprint(cached) === fingerprint(next)) return;
  cached = next;
  if (notify) listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    // Se actualiza sin notificar: React lee la instantánea justo después de
    // suscribirse y se encarga de repintar si ha cambiado.
    refresh(false);
    // Los tramos empiezan y acaban en :00 o :30, así que medio minuto de
    // granularidad basta de sobra.
    timer = setInterval(() => refresh(true), 30_000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Instantánea del cliente. Estable: se devuelve la misma referencia. */
export function getSnapshot(): ClockSnapshot {
  if (!cached) cached = compute();
  return cached;
}

/**
 * Instantánea del servidor: deliberadamente vacía. El HTML se sirve sin estado
 * horario y la interfaz reserva el hueco, de modo que al llegar el dato real no
 * se desplace nada.
 */
export function getServerSnapshot(): null {
  return null;
}
