import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { ANY_BARBER, services } from "@/data/business";
import { getAllBarbers } from "@/lib/barbersStore";
import { barberWorksAt, bookableBarbers } from "@/lib/team";
import { slotKey, validateBooking } from "@/lib/booking";
import { APPOINTMENTS, getDb } from "@/lib/firebaseAdmin";
import { longDateLabel } from "@/lib/hours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Freno básico contra bucles de peticiones.
 *
 * Vive en memoria, así que solo cubre la instancia que atiende la petición: en
 * un entorno sin servidor no es una defensa real. Está para frenar lo obvio.
 * Para producción, ver README.md → "Reservas: protección contra abuso".
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
/*
 * Una reserva normal es UNA petición. El umbral se deja alto a propósito: la
 * comprobación va ANTES de validar, así que también cuentan los envíos con
 * datos mal puestos, y no se trata de castigar a quien se equivoca al teclear
 * el teléfono. Veinte por minuto no los alcanza una persona; un bucle
 * automático, sí.
 */
const MAX_PER_WINDOW = 20;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);

  // Poda para que el mapa no crezca sin control.
  if (recent.size > 500) {
    for (const [k, v] of recent) {
      if (v.every((t) => now - t >= WINDOW_MS)) recent.delete(k);
    }
  }

  return hits.length > MAX_PER_WINDOW;
}

/** Error propio para distinguir "hueco pillado" de un fallo de verdad. */
class SlotTaken extends Error {}

/**
 * POST /api/reservas — crea una cita.
 *
 * El identificador del documento es determinista: fecha + hora + barbero. Al
 * comprobar dentro de una transacción que ese documento no existe antes de
 * crearlo, dos personas que pulsen "confirmar" en el mismo segundo no pueden
 * quedarse las dos con el hueco: la segunda recibe un 409 y elige otra hora.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "La reserva online no está activa todavía. Escríbenos por WhatsApp.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "desconocida";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos seguidos. Espera un momento." },
      { status: 429 },
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

  // El equipo válido se consulta en el momento de reservar, no se da por
  // sabido: alguien pudo darse de baja mientras el cliente rellenaba el
  // formulario.
  const team = bookableBarbers(await getAllBarbers());
  const check = validateBooking(payload, team);
  if (!check.ok || !check.data) {
    return NextResponse.json(
      { ok: false, error: check.error },
      { status: 400 },
    );
  }

  const booking = check.data;
  const service = services.find((s) => s.id === booking.serviceId)!;

  // Con "el primero que quede libre" se prueban todos por orden; con un barbero
  // concreto, solo ese.
  const candidates = (
    booking.barberId === ANY_BARBER.id
      ? team
      : team.filter((barber) => barber.id === booking.barberId)
  ).filter((barber) => barberWorksAt(barber, booking.date, booking.time));

  /*
   * Nadie disponible a esa hora: puede que el barbero elegido no trabaje en ese
   * tramo, esté ausente o se haya dado de baja mientras se rellenaba el
   * formulario. Se distingue del hueco pillado porque el mensaje al cliente
   * tiene que ser distinto.
   */
  if (candidates.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        slotTaken: true,
        error:
          "Esa hora ya no está disponible con ese barbero. Elige otra hora o déjanos asignarte al primero libre.",
      },
      { status: 409 },
    );
  }

  /*
   * Llave de gestión: se genera UNA vez, antes de intentar con los barberos,
   * para que la que se guarda y la que se devuelve al cliente sean la misma
   * sin importar a quién acabe asignándose la cita.
   */
  const manageToken = randomUUID();

  for (const barber of candidates) {
    const ref = db
      .collection(APPOINTMENTS)
      .doc(slotKey(booking.date, booking.time, barber.id));

    try {
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(ref);
        // Un hueco cancelado vuelve a estar libre. El documento sigue ahí —el
        // identificador es determinista— así que se comprueba el estado y no la
        // simple existencia; si no, cancelar dejaría el hueco inutilizado para
        // siempre.
        if (existing.exists && existing.data()?.status !== "cancelada") {
          throw new SlotTaken();
        }

        tx.set(ref, {
          date: booking.date,
          time: booking.time,
          barberId: barber.id,
          barberName: barber.name,
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          durationMinutes: service.duration,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          notes: booking.notes ?? null,
          status: "confirmada",
          createdAt: Timestamp.now(),
          cancelledAt: null,
          /*
           * Llave para que el cliente pueda cambiar o anular SU cita sin
           * cuentas ni contraseñas. Es un valor aleatorio imposible de adivinar
           * que solo conoce quien hizo la reserva: sin él, cualquiera que
           * supiera la fecha y la hora podría cancelarle la cita a otro.
           */
          manageToken,
        });
      });

      return NextResponse.json({
        ok: true,
        booking: {
          id: ref.id,
          manageToken,
          date: booking.date,
          dateLabel: longDateLabel(booking.date),
          time: booking.time,
          barberName: barber.name,
          serviceName: service.name,
          serviceId: service.id,
          price: service.price,
        },
      });
    } catch (error) {
      if (error instanceof SlotTaken) continue; // se prueba el siguiente barbero
      console.error("[reservas] Fallo al guardar la cita:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "No hemos podido guardar la cita. Inténtalo de nuevo.",
        },
        { status: 503 },
      );
    }
  }

  return NextResponse.json(
    {
      ok: false,
      slotTaken: true,
      error: "Justo te han cogido ese hueco. Elige otra hora, por favor.",
    },
    { status: 409 },
  );
}
