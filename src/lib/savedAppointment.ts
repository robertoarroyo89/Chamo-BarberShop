import { getBusinessToday } from "@/lib/hours";

export interface SavedAppointment {
  /** Identificador del documento en Firestore. */
  id: string;
  /** Llave que autoriza cambiar o anular ESTA cita. */
  manageToken: string;
  date: string;
  dateLabel: string;
  time: string;
  barberName: string;
  serviceName: string;
  serviceId: string;
  price: number;
}

const KEY = "el-chamo-cita";

/**
 * La cita del visitante, guardada en su propio navegador.
 *
 * Por qué así y no con cuentas: para pedir hora en una barbería de barrio nadie
 * quiere registrarse. Guardando aquí el identificador y la llave, quien reserva
 * puede volver otro día, ver su cita y anularla o cambiarla, sin contraseñas y
 * sin que la barbería gestione usuarios.
 *
 * Solo se guarda lo necesario para mostrarla y gestionarla. Y como es un
 * almacén externo consumido con `useSyncExternalStore`, no hay `setState`
 * dentro de efectos ni desajustes de hidratación.
 */

const listeners = new Set<() => void>();

/**
 * Instantánea memorizada.
 *
 * `useSyncExternalStore` exige que dos lecturas seguidas devuelvan la MISMA
 * referencia mientras nada cambie; devolver un objeto recién parseado en cada
 * lectura provocaría un bucle infinito de renders.
 */
let cache: { raw: string | null; value: SavedAppointment | null } = {
  raw: null,
  value: null,
};

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    // Modo privado o almacenamiento bloqueado: se trabaja sin memoria.
    return null;
  }
}

export function getSnapshot(): SavedAppointment | null {
  const raw = read();
  if (raw === cache.raw) return cache.value;

  let value: SavedAppointment | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SavedAppointment;
      // Se descarta lo que ya no sirve: citas pasadas o registros incompletos.
      // La fecha de referencia es la del negocio (Europe/Madrid), la misma que
      // usa el resto del cálculo de horarios; con la UTC, de madrugada se
      // compararía contra el día anterior.
      const today = getBusinessToday();
      const usable =
        parsed?.id &&
        parsed?.manageToken &&
        parsed?.date &&
        parsed.date >= today;
      value = usable ? parsed : null;
    } catch {
      value = null;
    }
  }

  cache = { raw, value };
  return value;
}

export function getServerSnapshot(): null {
  return null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Si se reserva o se anula en otra pestaña, esta se pone al día.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function save(appointment: SavedAppointment): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(appointment));
  } catch {
    // Sin almacenamiento, la cita sigue viva en el servidor: solo se pierde el
    // atajo para gestionarla desde este navegador.
  }
  notify();
}

export function clear(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nada que hacer */
  }
  notify();
}
