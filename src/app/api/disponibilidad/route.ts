import { NextResponse } from "next/server";
import { availableSlots, bookableDates } from "@/lib/booking";
import { getAllBarbers } from "@/lib/barbersStore";
import { bookableBarbers } from "@/lib/team";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import { isValidIsoDate } from "@/lib/hours";

/** firebase-admin necesita Node, no el entorno de borde. */
export const runtime = "nodejs";
/** La disponibilidad cambia a cada reserva: nunca se cachea. */
export const dynamic = "force-dynamic";

/**
 * GET /api/disponibilidad
 *   · sin parámetros  → días que se pueden reservar
 *   · ?date=AAAA-MM-DD → huecos libres de ese día
 *
 * Solo se devuelve la hora y cuántos barberos quedan libres. Nunca salen de
 * aquí nombres ni teléfonos de otros clientes.
 */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  const db = getDb();

  if (!db) {
    // Sin Firebase configurado la interfaz ofrece WhatsApp.
    return NextResponse.json({ configured: false, dates: [], slots: [] });
  }

  if (!date) {
    return NextResponse.json({ configured: true, dates: bookableDates() });
  }

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { configured: true, error: "Fecha no válida." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await db
      .collection(APPOINTMENTS)
      .where("date", "==", date)
      .where("status", "==", "confirmada")
      .get();

    const taken = new Set<string>();
    snapshot.forEach((doc) => {
      const { time, barberId } = doc.data() as {
        time: string;
        barberId: string;
      };
      taken.add(`${time}__${barberId}`);
    });

    // El equipo se lee en cada consulta: si alguien acaba de coger vacaciones o
    // de entrar en plantilla, la disponibilidad lo refleja al momento.
    const team = bookableBarbers(await getAllBarbers());

    return NextResponse.json({
      configured: true,
      date,
      slots: availableSlots(date, taken, team),
      // El selector del formulario se pinta con esta lista, no con una escrita
      // en el código.
      barbers: team.map(({ id, name, initials, accent }) => ({
        id,
        name,
        initials,
        accent,
      })),
    });
  } catch (error) {
    console.error("[disponibilidad] Fallo al consultar Firestore:", error);
    return NextResponse.json(
      { configured: true, error: "No hemos podido consultar la agenda." },
      { status: 503 },
    );
  }
}
