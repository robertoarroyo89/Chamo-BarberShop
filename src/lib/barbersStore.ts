import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebaseAdmin";
import {
  DEFAULT_BARBERS,
  type Absence,
  type Accent,
  type Barber,
  type BarberStatus,
  slugify,
} from "@/lib/team";

/**
 * Acceso a la colección del equipo.
 *
 * Va separado de `lib/team` porque importa `firebase-admin`: si las reglas de
 * disponibilidad y el SDK de administrador viviesen en el mismo archivo, el
 * formulario de reserva —que necesita esas reglas— arrastraría todo gRPC al
 * paquete del navegador y la compilación ni terminaría.
 */

export const BARBERS = "barberos";

function fromDoc(id: string, data: Record<string, unknown>): Barber {
  return {
    id,
    name: String(data.name ?? ""),
    initials: String(data.initials ?? "??"),
    accent: (data.accent as Accent) ?? "blue",
    status: (data.status as BarberStatus) ?? "activo",
    order: Number(data.order ?? 0),
    hours: (data.hours as Barber["hours"]) ?? {},
    absences: (data.absences as Absence[]) ?? [],
  };
}

/**
 * Todo el equipo, incluidos los que están de baja.
 *
 * La primera vez que se llama con Firestore vacío, siembra la colección con el
 * equipo de `data/business.ts`: así el panel arranca con datos reales en lugar
 * de una pantalla en blanco.
 */
export async function getAllBarbers(): Promise<Barber[]> {
  const db = getDb();
  if (!db) return DEFAULT_BARBERS;

  const snapshot = await db.collection(BARBERS).get();

  if (snapshot.empty) {
    const batch = db.batch();
    for (const barber of DEFAULT_BARBERS) {
      const { id, ...rest } = barber;
      batch.set(db.collection(BARBERS).doc(id), {
        ...rest,
        createdAt: Timestamp.now(),
      });
    }
    await batch.commit();
    return DEFAULT_BARBERS;
  }

  return snapshot.docs
    .map((doc) => fromDoc(doc.id, doc.data()))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function createBarber(input: {
  name: string;
  initials: string;
  accent: Accent;
}): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "La agenda no está conectada." };

  const all = await getAllBarbers();
  const base = slugify(input.name);
  if (!base) return { ok: false, error: "El nombre no es válido." };

  // Identificador único, por si entran dos personas con el mismo nombre.
  let id = base;
  let n = 2;
  while (all.some((b) => b.id === id)) id = `${base}-${n++}`;

  await db
    .collection(BARBERS)
    .doc(id)
    .set({
      name: input.name.trim(),
      initials: input.initials.toUpperCase().slice(0, 2),
      accent: input.accent,
      status: "activo",
      order: all.length,
      hours: {},
      absences: [],
      createdAt: Timestamp.now(),
    });

  return { ok: true };
}

export async function setBarberStatus(
  id: string,
  status: BarberStatus,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.collection(BARBERS).doc(id).update({ status });
}

export async function setBarberHours(
  id: string,
  hours: Barber["hours"],
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.collection(BARBERS).doc(id).update({ hours });
}

export async function addAbsence(id: string, absence: Absence): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .collection(BARBERS)
    .doc(id)
    .update({ absences: FieldValue.arrayUnion(absence) });
}

export async function removeAbsence(id: string, index: number): Promise<void> {
  const db = getDb();
  if (!db) return;

  const ref = db.collection(BARBERS).doc(id);
  // Se lee y se reescribe porque hay que quitar por POSICIÓN, y arrayRemove
  // trabaja por valor: dos ausencias idénticas se borrarían las dos.
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const list = (snap.data()?.absences as Absence[]) ?? [];
    if (index < 0 || index >= list.length) return;
    tx.update(ref, { absences: list.filter((_, i) => i !== index) });
  });
}

/**
 * Borra a un barbero por completo.
 *
 * Solo se permite si no tiene ninguna cita: si la tiene, borrarlo dejaría
 * huérfano el historial y descuadraría las estadísticas. En ese caso lo que
 * corresponde es darle de baja, que lo retira de la web pero conserva su
 * trabajo hecho.
 */
export async function deleteBarber(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "La agenda no está conectada." };

  const citas = await db
    .collection("citas")
    .where("barberId", "==", id)
    .limit(1)
    .get();

  if (!citas.empty) {
    return {
      ok: false,
      error:
        "Tiene citas registradas, así que no se puede borrar sin perder el historial. Dale de baja: desaparece de la web y de las reservas, pero sus cortes siguen contando.",
    };
  }

  await db.collection(BARBERS).doc(id).delete();
  return { ok: true };
}
