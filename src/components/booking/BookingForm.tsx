"use client";

import { Check, Loader2, RotateCcw, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { ANY_BARBER, business, services } from "@/data/business";
import { bookableDates } from "@/lib/booking";
import type { Slot } from "@/lib/booking";
import { describeDate, formatTime, longDateLabel } from "@/lib/hours";
import {
  clear as clearSaved,
  getServerSnapshot as savedServerSnapshot,
  getSnapshot as savedSnapshot,
  save as saveAppointment,
  subscribe as subscribeSaved,
  type SavedAppointment,
} from "@/lib/savedAppointment";
import { cn, formatPrice } from "@/lib/utils";

/** Lo mínimo que necesita el selector para pintar a un barbero. */
export interface BarberOption {
  id: string;
  name: string;
  initials: string;
  accent: "blue" | "yellow" | "red";
}

interface BookingFormProps {
  /**
   * Si el proyecto tiene credenciales de Firebase. Llega ya resuelto desde el
   * servidor, así que no hace falta una petición solo para averiguarlo.
   */
  configured: boolean;
  /**
   * Equipo que coge citas, renderizado ya en el servidor para que el selector
   * aparezca sin esperas. Se refresca con cada consulta de disponibilidad, así
   * que un alta o una baja hecha desde el panel se refleja al momento.
   */
  initialBarbers: BarberOption[];
}

const ACCENTS = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  red: "bg-red",
};

/** Añade la opción "me da igual" al principio de la lista. */
function withAnyOption(team: BarberOption[]): BarberOption[] {
  return [
    { id: ANY_BARBER.id, name: "Cualquiera", initials: "··", accent: "blue" },
    ...team,
  ];
}

/** Archivo de calendario, para llevarse la cita al móvil. */
function buildCalendarFile(
  appointment: SavedAppointment,
  durationMinutes: number,
) {
  const stamp = (d: string, t: string) =>
    `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const [h, m] = appointment.time.split(":").map(Number);
  const endMinutes = h * 60 + m + durationMinutes;
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(
    endMinutes % 60,
  ).padStart(2, "0")}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//El Chamo Barber Shop//ES",
    "BEGIN:VEVENT",
    `SUMMARY:${appointment.serviceName} en ${business.name}`,
    `DTSTART;TZID=Europe/Madrid:${stamp(appointment.date, appointment.time)}`,
    `DTEND;TZID=Europe/Madrid:${stamp(appointment.date, end)}`,
    `LOCATION:${business.address.street}\\, ${business.address.postalCode} ${business.address.city}`,
    `DESCRIPTION:Con ${appointment.barberName}. ${formatPrice(appointment.price)}. Tel ${business.phone.display}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

/**
 * FORMULARIO DE RESERVA.
 *
 * Agenda propia: los huecos salen del horario de business.ts cruzado con las
 * citas ya guardadas en Firestore. Decisiones de fondo:
 *
 *   · Los días se calculan aquí con funciones puras en hora de Madrid, así que
 *     la primera pantalla aparece sin esperar ninguna petición.
 *   · Las horas se piden al servidor, porque solo él sabe qué está cogido.
 *   · Cada paso es un `fieldset` con radios de verdad: se recorre con el
 *     tabulador y las flechas, y un lector de pantalla lo anuncia como grupo.
 *   · La cita se recuerda en el navegador, de modo que quien vuelva pueda
 *     cambiarla o anularla sin registrarse (ver lib/savedAppointment).
 *   · Sin Firebase configurado no se finge una agenda: se ofrece WhatsApp.
 */
export function BookingForm({ configured, initialBarbers }: BookingFormProps) {
  const dates = useMemo(() => bookableDates(), []);

  const saved = useSyncExternalStore(
    subscribeSaved,
    savedSnapshot,
    savedServerSnapshot,
  );

  const [serviceId, setServiceId] = useState(services[0].id);
  const [barberId, setBarberId] = useState<string>(ANY_BARBER.id);
  const [date, setDate] = useState(dates[0] ?? "");

  /**
   * La hora se guarda JUNTO al día al que pertenece, y los huecos también.
   *
   * Es lo que evita tener que "limpiar" nada desde un efecto cuando cambian el
   * día o el barbero: si el día no coincide, el dato simplemente no se usa. De
   * paso desaparece un fallo real —ver por un instante los huecos del día
   * anterior— porque un resultado viejo nunca puede darse por válido.
   */
  const [team, setTeam] = useState<BarberOption[]>(initialBarbers);
  const [pick, setPick] = useState<{ date: string; time: string } | null>(null);
  const [result, setResult] = useState<{ date: string; slots: Slot[] } | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    date: string;
    message: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Estado del flujo de anulación, que pide confirmación antes de actuar. */
  const [cancelState, setCancelState] = useState<
    "idle" | "asking" | "working" | "done" | "error"
  >("idle");

  const service = services.find((s) => s.id === serviceId) ?? services[0];

  // Solo cuenta lo que corresponde al día elegido ahora mismo.
  const slots = result?.date === date ? result.slots : null;
  const slotsError = failure?.date === date ? failure.message : null;

  /**
   * Pide los huecos de un día.
   *
   * Se escribe con `.then()` en vez de `async/await` a propósito: así queda a
   * la vista —y comprobable por las herramientas— que el estado solo se toca
   * dentro de un callback, cuando la respuesta ya ha llegado.
   */
  const loadSlots = useCallback((target: string, signal?: AbortSignal) => {
    fetch(`/api/disponibilidad?date=${encodeURIComponent(target)}`, {
      signal,
      cache: "no-store",
    })
      .then((response) =>
        response.json().then((data) => {
          if (!response.ok) {
            throw new Error(data?.error ?? "Error al consultar la agenda");
          }
          return data;
        }),
      )
      .then((data: { slots?: Slot[]; barbers?: BarberOption[] }) => {
        setResult({ date: target, slots: data.slots ?? [] });
        // El equipo viene con la disponibilidad: un alta o una baja hecha en el
        // panel aparece aquí sin recargar la página.
        if (data.barbers?.length) setTeam(data.barbers);
      })
      .catch((error: Error) => {
        // Cambiar de día aborta la petición anterior: no es un fallo.
        if (error.name === "AbortError") return;
        setFailure({
          date: target,
          message: "No hemos podido cargar las horas. Prueba otra vez.",
        });
      });
  }, []);

  useEffect(() => {
    // Con una cita en marcha se muestra el resguardo, no el formulario.
    if (!configured || !date || saved) return;
    if (result?.date === date || failure?.date === date) return;

    const controller = new AbortController();
    loadSlots(date, controller.signal);
    return () => controller.abort();
  }, [configured, date, saved, loadSlots, result?.date, failure?.date]);

  /**
   * Barbero en firme. Si el elegido ya no está en el equipo —le han dado de
   * baja mientras se rellenaba el formulario— se vuelve a "Cualquiera" en lugar
   * de dejar seleccionado a alguien que ya no existe.
   */
  const barber =
    barberId === ANY_BARBER.id || team.some((b) => b.id === barberId)
      ? barberId
      : ANY_BARBER.id;

  /** Con un barbero concreto, solo se ofrecen las horas en que está libre. */
  const visibleSlots = useMemo(() => {
    if (!slots) return null;
    if (barber === ANY_BARBER.id) return slots;
    return slots.filter((slot) => slot.freeBarberIds.includes(barber));
  }, [slots, barber]);

  /**
   * Hora en firme. Solo vale si es del día elegido Y sigue libre para el
   * barbero elegido; si no, se considera que no hay hora escogida.
   */
  const time =
    pick?.date === date && visibleSlots?.some((slot) => slot.time === pick.time)
      ? pick.time
      : "";

  const setTime = (value: string) => setPick({ date, time: value });

  const complete = Boolean(
    date && time && name.trim().length >= 2 && phone.trim(),
  );

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          serviceId,
          barberId: barber,
          customerName: name,
          customerPhone: phone,
          notes,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFormError(data?.error ?? "No hemos podido guardar la cita.");
        // Si alguien se le adelantó, se refrescan las horas al momento.
        if (data?.slotTaken) {
          setPick(null);
          setFailure(null);
          loadSlots(date);
        }
        return;
      }

      saveAppointment(data.booking as SavedAppointment);
      setCancelState("idle");
    } catch {
      setFormError("Parece que no hay conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Anula la cita guardada.
   *
   * `keepService` distingue "cancelar" de "cambiar": al cambiar se anula la
   * cita anterior —el hueco queda libre en el acto— y se vuelve al formulario
   * con el mismo servicio ya marcado.
   */
  const cancel = async (keepService: boolean) => {
    if (!saved) return;
    setCancelState("working");

    try {
      const response = await fetch("/api/reservas/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: saved.id, token: saved.manageToken }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setCancelState("error");
        return;
      }

      if (keepService) {
        setServiceId(saved.serviceId);
        setPick(null);
        // Se olvidan los huecos cargados: el que acaba de liberarse cuenta.
        setResult(null);
        setFailure(null);
        setDate(dates[0] ?? "");
        clearSaved();
        setCancelState("idle");
      } else {
        clearSaved();
        setCancelState("done");
      }
    } catch {
      setCancelState("error");
    }
  };

  // -----------------------------------------------------------------------
  // Sin Firebase: no se simula una agenda que no existe.
  // -----------------------------------------------------------------------
  if (!configured) {
    return (
      <div className="keyline bg-paper-raised p-6 shadow-hard-lg sm:p-9">
        <h3 className="text-2xl">Reserva por WhatsApp</h3>
        <p className="text-ink-soft mt-3 max-w-md text-base leading-relaxed">
          La agenda online está a punto de entrar en marcha. De momento,
          escríbenos y te damos hora al momento.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href={business.whatsapp.href}
            external
            tone="blue"
            size="lg"
            icon={<WhatsAppGlyph size={19} />}
            ariaLabel="Reservar por WhatsApp (se abre en una pestaña nueva)"
          >
            Escribir por WhatsApp
          </ButtonLink>
          <ButtonLink
            href={business.phone.href}
            tone="paper"
            size="lg"
            ariaLabel={`Llamar al ${business.phone.display}`}
          >
            Llamar
          </ButtonLink>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Cita anulada.
  // -----------------------------------------------------------------------
  if (cancelState === "done") {
    return (
      <div className="keyline bg-paper-raised shadow-hard-lg">
        <div className="keyline-b bg-red text-on-color flex items-center gap-3 px-6 py-4">
          <X aria-hidden="true" size={22} strokeWidth={3} />
          <h3 className="text-2xl leading-none">Cita anulada</h3>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-ink-soft text-base leading-relaxed">
            Listo, hemos liberado el hueco. Cuando quieras, pides otra.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => setCancelState("idle")}
              tone="blue"
              size="md"
            >
              Pedir otra cita
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Resguardo de la cita en marcha.
  // -----------------------------------------------------------------------
  if (saved) {
    const asking = cancelState === "asking";
    const working = cancelState === "working";

    return (
      <div className="keyline bg-paper-raised shadow-hard-lg">
        <div className="keyline-b bg-blue text-on-color flex items-center gap-3 px-6 py-4">
          <Check aria-hidden="true" size={22} strokeWidth={3} />
          <h3 className="text-2xl leading-none">Tienes cita</h3>
        </div>

        <div className="p-6 sm:p-8">
          {/* Resguardo: filas de dato, como un tique. */}
          <dl>
            {[
              ["Servicio", saved.serviceName],
              ["Día", saved.dateLabel],
              ["Hora", formatTime(saved.time)],
              ["Barbero", saved.barberName],
              ["Precio", formatPrice(saved.price)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="keyline-b flex flex-wrap items-baseline justify-between gap-2 py-3 last:border-b-0"
              >
                <dt className="eyebrow text-ink-faint">{label}</dt>
                <dd className="font-display text-lg leading-none">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-ink-soft mt-6 text-sm leading-relaxed">
            Te esperamos en {business.address.street}. Si no puedes venir,
            avísanos: el hueco lo aprovecha otro.
          </p>

          {cancelState === "error" ? (
            <p
              role="alert"
              className="keyline bg-red text-on-color mt-5 px-4 py-3 text-sm font-semibold"
            >
              No hemos podido anular la cita. Llámanos al{" "}
              {business.phone.display} y lo arreglamos.
            </p>
          ) : null}

          {/* --- Acciones ------------------------------------------------ */}
          {asking ? (
            <div className="keyline bg-paper-sunken mt-6 p-4">
              <p className="font-display text-base">
                ¿Seguro que quieres anular la cita?
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  onClick={() => void cancel(false)}
                  tone="red"
                  size="sm"
                  disabled={working}
                >
                  Sí, anular
                </Button>
                <Button
                  onClick={() => setCancelState("idle")}
                  tone="paper"
                  size="sm"
                  disabled={working}
                >
                  No, dejarla
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap gap-2.5">
              <ButtonLink
                href={buildCalendarFile(saved, service.duration)}
                tone="yellow"
                size="sm"
              >
                Añadir al calendario
              </ButtonLink>
              <Button
                onClick={() => void cancel(true)}
                tone="paper"
                size="sm"
                disabled={working}
                icon={
                  working ? (
                    <Loader2
                      aria-hidden="true"
                      size={15}
                      className="animate-spin"
                    />
                  ) : undefined
                }
              >
                Cambiar cita
              </Button>
              <Button
                onClick={() => setCancelState("asking")}
                tone="paper"
                size="sm"
                disabled={working}
              >
                Cancelar cita
              </Button>
            </div>
          )}

          <div className="keyline-t mt-6 pt-5">
            <a
              href={business.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft hover:text-ink inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
            >
              <WhatsAppGlyph size={15} />
              Escribirnos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Formulario.
  // -----------------------------------------------------------------------
  return (
    <form
      className="keyline bg-paper-raised shadow-hard-lg"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete && !submitting) void submit();
      }}
    >
      {/*
        Dos columnas en escritorio, en orden de columna y no de fila: a la
        izquierda QUÉ y CON QUIÉN, a la derecha CUÁNDO. Apilado en una sola
        columna el formulario pasaba de mil píxeles de alto.
      */}
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-2 lg:gap-x-10">
        {/*
          `min-w-0` no es decorativo: los elementos de una rejilla tienen
          `min-width: auto`, así que un hijo más ancho que la columna —el carril
          de fechas, que sangra con márgenes negativos— la estira y desborda el
          formulario entero. Con esto la columna puede encogerse y el carril
          vuelve a desplazarse dentro de ella.
        */}
        <div className="min-w-0 space-y-8">
          {/* --- 1. Servicio --------------------------------------------- */}
          <fieldset>
            <Legend step="1" tone="blue">
              ¿Qué te hacemos?
            </Legend>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {services.map((option) => (
                <Choice
                  key={option.id}
                  name="servicio"
                  value={option.id}
                  checked={serviceId === option.id}
                  onChange={setServiceId}
                >
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="font-display text-base leading-tight">
                      {option.name}
                    </span>
                    <span className="font-display shrink-0 text-base tabular-nums">
                      {formatPrice(option.price)}
                    </span>
                  </span>
                </Choice>
              ))}
            </div>
          </fieldset>

          {/* --- 2. Barbero ---------------------------------------------- */}
          <fieldset>
            <Legend step="2" tone="yellow">
              ¿Con quién?
            </Legend>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {withAnyOption(team).map((option) => (
                <Choice
                  key={option.id}
                  name="barbero"
                  value={option.id}
                  checked={barber === option.id}
                  onChange={setBarberId}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "keyline font-display text-on-color grid size-8 shrink-0 place-items-center text-xs leading-none",
                        ACCENTS[option.accent],
                      )}
                    >
                      {option.initials}
                    </span>
                    <span className="font-display text-sm">{option.name}</span>
                  </span>
                </Choice>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="min-w-0 space-y-8">
          {/* --- 3. Día --------------------------------------------------- */}
          <fieldset>
            <Legend step="3" tone="red">
              ¿Qué día?
            </Legend>
            {dates.length === 0 ? (
              <p className="text-ink-soft mt-4 text-sm">
                Ahora mismo no hay días abiertos para reservar. Escríbenos por
                WhatsApp.
              </p>
            ) : (
              <div className="no-scrollbar -mx-5 mt-4 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
                {dates.map((option) => {
                  const { weekday, day, month } = describeDate(option);
                  const isToday = option === dates[0];
                  return (
                    <Choice
                      key={option}
                      name="dia"
                      value={option}
                      checked={date === option}
                      onChange={setDate}
                      className="shrink-0 snap-start"
                      label={longDateLabel(option)}
                    >
                      <span className="flex w-14 flex-col items-center gap-0.5">
                        <span className="text-[0.625rem] font-bold tracking-[0.1em] uppercase">
                          {isToday ? "Hoy" : weekday}
                        </span>
                        <span className="font-display text-xl leading-none">
                          {day}
                        </span>
                        <span className="text-[0.625rem] uppercase">
                          {month}
                        </span>
                      </span>
                    </Choice>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* --- 4. Hora -------------------------------------------------- */}
          <fieldset>
            <Legend step="4" tone="blue">
              ¿A qué hora?
            </Legend>

            <div aria-live="polite" className="mt-4">
              {visibleSlots === null ? (
                <p className="text-ink-soft flex items-center gap-2 text-sm">
                  <Loader2
                    aria-hidden="true"
                    size={15}
                    className="animate-spin"
                  />
                  Buscando huecos…
                </p>
              ) : slotsError ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-red-ink text-sm font-semibold">
                    {slotsError}
                  </p>
                  <Button
                    onClick={() => {
                      setFailure(null);
                      loadSlots(date);
                    }}
                    tone="paper"
                    size="sm"
                    icon={<RotateCcw aria-hidden="true" size={14} />}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : visibleSlots.length === 0 ? (
                <p className="text-ink-soft text-sm">
                  Ese día está completo
                  {barber !== ANY_BARBER.id ? " para ese barbero" : ""}. Prueba
                  otro día
                  {barber !== ANY_BARBER.id ? " o elige “Cualquiera”" : ""}.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleSlots.map((slot) => (
                    <Choice
                      key={slot.time}
                      name="hora"
                      value={slot.time}
                      checked={time === slot.time}
                      onChange={setTime}
                    >
                      <span className="font-display block w-full text-center text-base tabular-nums">
                        {formatTime(slot.time)}
                      </span>
                    </Choice>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        </div>

        {/* --- 5. Datos: a lo ancho de las dos columnas ------------------ */}
        <fieldset className="lg:col-span-2">
          <Legend step="5" tone="yellow">
            ¿Quién eres?
          </Legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="reserva-nombre"
              label="Nombre"
              value={name}
              onChange={setName}
              autoComplete="name"
              maxLength={70}
              required
            />
            <Field
              id="reserva-telefono"
              label="Móvil"
              value={phone}
              onChange={setPhone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="600 000 000"
              hint="Por si tenemos que avisarte de algo."
              required
            />
            <Field
              id="reserva-notas"
              label="Algo que debamos saber"
              value={notes}
              onChange={setNotes}
              maxLength={300}
              optional
              placeholder="Degradado del 0 al 2, por ejemplo"
            />
          </div>
        </fieldset>
      </div>

      {/* --- Resumen y envío ------------------------------------------- */}
      <div className="keyline-t bg-paper-sunken flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="font-display text-lg leading-tight">
            {service.name} · {formatPrice(service.price)}
          </p>
          <p className="text-ink-soft mt-1 text-sm">
            {time
              ? `${longDateLabel(date)} a las ${formatTime(time)}`
              : "Elige día y hora para continuar"}
          </p>
        </div>

        <Button
          type="submit"
          tone="blue"
          size="lg"
          disabled={!complete || submitting}
          icon={
            submitting ? (
              <Loader2 aria-hidden="true" size={18} className="animate-spin" />
            ) : undefined
          }
        >
          {submitting ? "Confirmando…" : "Confirmar cita"}
        </Button>
      </div>

      {formError ? (
        <p
          role="alert"
          className="keyline-t bg-red text-on-color px-5 py-3 text-sm font-semibold sm:px-8"
        >
          {formError}
        </p>
      ) : null}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Piezas internas
// ---------------------------------------------------------------------------

function Legend({
  step,
  tone,
  children,
}: {
  step: string;
  tone: "blue" | "yellow" | "red";
  children: string;
}) {
  return (
    <legend className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "keyline font-display text-on-color grid size-7 place-items-center text-xs leading-none",
          ACCENTS[tone],
        )}
      >
        {step}
      </span>
      <span className="font-display text-lg leading-none">{children}</span>
    </legend>
  );
}

/**
 * Opción seleccionable.
 *
 * Por debajo es un `input type="radio"` real, oculto visualmente pero presente:
 * se recorre con las flechas dentro del grupo, se anuncia como radio y funciona
 * sin gestionar el teclado a mano. El foco se dibuja sobre la etiqueta con
 * `peer-focus-visible`.
 */
function Choice({
  name,
  value,
  checked,
  onChange,
  children,
  className,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  /** Texto accesible cuando lo visible va abreviado (los días). */
  label?: string;
}) {
  return (
    /*
     * `relative` es imprescindible, no decorativo.
     *
     * El radio va oculto con `sr-only`, que lo posiciona en absoluto. Sin un
     * ancestro posicionado, su bloque contenedor era una sección de más arriba:
     * el input se quedaba clavado en un punto de la página mientras su etiqueta
     * viajaba con el carril de fechas. Al marcarlo, el navegador desplazaba los
     * contenedores para "traer a la vista" un input que estaba en otro sitio, y
     * la sección entera se iba de lado.
     *
     * Con la etiqueta posicionada, cada input vive dentro de la suya y se mueve
     * con ella.
     */
    <label className={cn("relative block cursor-pointer", className)}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        className={cn(
          "keyline flex items-center justify-center px-3 py-2.5 transition-[transform,box-shadow,background-color] duration-150 ease-out",
          "peer-focus-visible:outline-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2",
          checked
            ? "bg-ink text-paper translate-x-[2px] translate-y-[2px] shadow-none"
            : "bg-paper-raised text-ink shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px]",
        )}
      >
        {children}
      </span>
    </label>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  hint,
  maxLength,
  required,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "tel" | "text";
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  required?: boolean;
  optional?: boolean;
}) {
  const hintId = hint ? `${id}-ayuda` : undefined;

  return (
    <div>
      <label htmlFor={id} className="eyebrow text-ink-soft block">
        {label}
        {optional ? <span className="text-ink-faint"> (opcional)</span> : null}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hintId}
        className="keyline bg-paper text-ink placeholder:text-ink-faint focus-visible:shadow-hard mt-2 w-full px-3.5 py-3 text-base focus:outline-none"
      />
      {hint ? (
        <p id={hintId} className="text-ink-faint mt-1.5 text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
