"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import {
  addAbsence,
  createBarber,
  deleteBarber,
  getAllBarbers,
  removeAbsence,
  setBarberHours,
  setBarberStatus,
} from "@/lib/barbersStore";
import {
  nextAccent,
  suggestInitials,
  type Barber,
  type BarberStatus,
} from "@/lib/team";
import {
  checkPassword,
  endSession,
  hasSession,
  startSession,
} from "@/lib/adminAuth";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import { isValidIsoDate } from "@/lib/hours";
import type { TimeRange, WeekDay } from "@/data/business";

/**
 * Acciones del panel interno.
 *
 * Se usan Server Actions y no rutas de API porque Next ya les añade protección
 * contra CSRF y porque así el panel funciona sin JavaScript en el cliente: son
 * formularios de toda la vida.
 *
 * TODAS las que modifican datos comprueban la sesión antes de tocar nada. Que
 * el botón solo se pinte estando dentro no es una defensa: cualquiera puede
 * invocar la acción por su cuenta.
 */

/** Refresca el panel y la web pública, que muestra el equipo. */
function refresh() {
  revalidatePath("/agenda");
  revalidatePath("/agenda/equipo");
  revalidatePath("/agenda/resumen");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// SESIÓN
// ---------------------------------------------------------------------------

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!checkPassword(formData.get("password"))) {
    // Mensaje único a propósito: no se dice si el panel existe ni si la
    // contraseña es corta. Cuanta menos pista, mejor.
    return { error: "Contraseña incorrecta." };
  }

  await startSession();
  refresh();
  return {};
}

export async function logout(): Promise<void> {
  await endSession();
  revalidatePath("/agenda");
}

// ---------------------------------------------------------------------------
// CITAS
// ---------------------------------------------------------------------------

/**
 * Anula una cita desde el panel.
 *
 * Aquí manda la sesión de la barbería, no la llave del cliente: el barbero
 * puede anular cualquier cita. La cita no se borra, se marca — así queda
 * constancia y el hueco vuelve a ofrecerse.
 */
export async function cancelFromDashboard(formData: FormData): Promise<void> {
  if (!(await hasSession())) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const db = getDb();
  if (!db) return;

  await db.collection(APPOINTMENTS).doc(id).update({
    status: "cancelada",
    cancelledAt: Timestamp.now(),
    cancelledBy: "barberia",
  });

  refresh();
}

// ---------------------------------------------------------------------------
// EQUIPO
// ---------------------------------------------------------------------------

export interface TeamState {
  error?: string;
  ok?: string;
}

export async function addBarber(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!(await hasSession())) return { error: "Sesión caducada." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) {
    return { error: "Escribe un nombre de entre 2 y 40 caracteres." };
  }

  const all = await getAllBarbers();
  if (all.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
    return { error: `Ya hay alguien llamado ${name} en el equipo.` };
  }

  const rawInitials = String(formData.get("initials") ?? "").trim();
  const initials = (rawInitials || suggestInitials(name, all))
    .toUpperCase()
    .slice(0, 2);

  if (all.some((b) => b.initials === initials)) {
    return {
      error: `Las iniciales ${initials} ya están cogidas. Pon otras para poder distinguirlos en la agenda.`,
    };
  }

  const result = await createBarber({
    name,
    initials,
    accent: nextAccent(all),
  });
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: `${name} ya puede coger citas.` };
}

export async function changeStatus(formData: FormData): Promise<void> {
  if (!(await hasSession())) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BarberStatus;
  if (!id || !["activo", "pausa", "baja"].includes(status)) return;

  await setBarberStatus(id, status);
  refresh();
}

export async function removeBarber(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!(await hasSession())) return { error: "Sesión caducada." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta indicar a quién." };

  const result = await deleteBarber(id);
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: "Eliminado del equipo." };
}

/**
 * Guarda el horario semanal de un barbero.
 *
 * Por cada día llegan tres cosas: el modo (local / libra / propio) y, si es
 * propio, hasta dos tramos. Dos tramos cubren la jornada partida de toda la
 * vida, que es como trabaja el local.
 */
export async function saveHours(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!(await hasSession())) return { error: "Sesión caducada." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta indicar a quién." };

  const hours: Barber["hours"] = {};

  for (const day of [1, 2, 3, 4, 5, 6, 0] as WeekDay[]) {
    const mode = String(formData.get(`mode-${day}`) ?? "local");

    if (mode === "local") {
      hours[day] = null; // sigue el horario del local
      continue;
    }
    if (mode === "libra") {
      hours[day] = [];
      continue;
    }

    const ranges: TimeRange[] = [];
    for (const slot of [1, 2]) {
      const from = String(formData.get(`from-${day}-${slot}`) ?? "");
      const to = String(formData.get(`to-${day}-${slot}`) ?? "");
      if (!from || !to) continue;

      if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) {
        return { error: "Alguna hora no tiene un formato válido." };
      }
      if (from >= to) {
        return {
          error: "En algún tramo la hora de fin no es posterior al inicio.",
        };
      }
      ranges.push({ from, to });
    }

    // "Propio" sin ningún tramo equivale a librar; se guarda así para que no
    // quede un día en un estado ambiguo.
    hours[day] = ranges;
  }

  await setBarberHours(id, hours);
  refresh();
  return { ok: "Horario guardado." };
}

export async function createAbsence(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  if (!(await hasSession())) return { error: "Sesión caducada." };

  const id = String(formData.get("id") ?? "");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const reason = String(formData.get("reason") ?? "")
    .trim()
    .slice(0, 60);

  if (!id) return { error: "Falta indicar a quién." };
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return { error: "Revisa las fechas." };
  }
  if (to < from) {
    return {
      error: "La fecha de vuelta no puede ser anterior a la de salida.",
    };
  }

  await addAbsence(id, { from, to, ...(reason ? { reason } : {}) });
  refresh();
  return { ok: "Ausencia anotada. Esos días no se ofrecerán citas." };
}

export async function deleteAbsence(formData: FormData): Promise<void> {
  if (!(await hasSession())) return;

  const id = String(formData.get("id") ?? "");
  const index = Number(formData.get("index"));
  if (!id || !Number.isInteger(index)) return;

  await removeAbsence(id, index);
  refresh();
}
