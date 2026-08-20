import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reservas/cancelar — anula una cita.
 *
 * La autoriza la llave que se entregó al reservar, no una sesión: así el
 * cliente puede anular sin registrarse, y a la vez nadie puede cancelar citas
 * ajenas conociendo solo el día y la hora.
 *
 * La cita no se borra: se marca como cancelada. Queda el registro para la
 * barbería y, como la disponibilidad solo cuenta las confirmadas, el hueco
 * vuelve a ofrecerse al momento.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "La agenda online no está activa." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Petición mal formada." },
      { status: 400 },
    );
  }

  const { id, token } = (payload ?? {}) as { id?: unknown; token?: unknown };
  if (typeof id !== "string" || typeof token !== "string" || !id || !token) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos para anular la cita." },
      { status: 400 },
    );
  }

  try {
    const ref = db.collection(APPOINTMENTS).doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { ok: false, error: "Esa cita ya no existe." },
        { status: 404 },
      );
    }

    const data = snapshot.data();

    // Comparación estricta de la llave. Un identificador acertado no basta.
    if (data?.manageToken !== token) {
      return NextResponse.json(
        { ok: false, error: "No hemos podido comprobar que la cita sea tuya." },
        { status: 403 },
      );
    }

    if (data?.status === "cancelada") {
      // Ya estaba anulada: se responde bien, que es lo que el cliente espera.
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }

    await ref.update({ status: "cancelada", cancelledAt: Timestamp.now() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cancelar] Fallo al anular la cita:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No hemos podido anular la cita. Llámanos y lo vemos.",
      },
      { status: 503 },
    );
  }
}
