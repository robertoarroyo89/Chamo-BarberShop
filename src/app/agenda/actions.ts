"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import {
  checkPassword,
  endSession,
  hasSession,
  startSession,
} from "@/lib/adminAuth";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";

/**
 * Acciones del panel interno.
 *
 * Se usan Server Actions y no rutas de API porque Next ya les añade protección
 * contra CSRF y porque así el panel funciona sin JavaScript en el cliente: son
 * formularios de toda la vida.
 */

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");

  if (!checkPassword(password)) {
    // Mensaje único a propósito: no se dice si el panel existe o si la
    // contraseña es corta. Cuanta menos pista, mejor.
    return { error: "Contraseña incorrecta." };
  }

  await startSession();
  revalidatePath("/agenda");
  return {};
}

export async function logout(): Promise<void> {
  await endSession();
  revalidatePath("/agenda");
}

/**
 * Anula una cita desde el panel.
 *
 * Aquí manda la sesión de la barbería, no la llave del cliente: el barbero
 * puede anular cualquier cita. La cita no se borra, se marca — así queda
 * constancia de quién falló y el hueco vuelve a ofrecerse.
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

  revalidatePath("/agenda");
}
