"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  changeStatus,
  createAbsence,
  deleteAbsence,
  removeBarber,
  type TeamState,
} from "@/app/agenda/actions";
import { HoursEditor } from "@/components/agenda/HoursEditor";
import { Button } from "@/components/ui/Button";
import type { Barber, BarberStatus } from "@/lib/team";
import { formatRange } from "@/lib/hours";
import { cn } from "@/lib/utils";

const FILL = { blue: "bg-blue", yellow: "bg-yellow", red: "bg-red" };

const STATUS_LABEL: Record<BarberStatus, string> = {
  activo: "Coge citas",
  pausa: "En pausa",
  baja: "Ya no trabaja aquí",
};

const DAYS: { day: number; label: string }[] = [
  { day: 1, label: "Lunes" },
  { day: 2, label: "Martes" },
  { day: 3, label: "Miércoles" },
  { day: 4, label: "Jueves" },
  { day: 5, label: "Viernes" },
  { day: 6, label: "Sábado" },
  { day: 0, label: "Domingo" },
];

/**
 * Ficha de un barbero en el panel.
 *
 * Los formularios de horario y ausencias se despliegan solo al pedirlos: con
 * tres o cuatro personas en plantilla, tener siete días por siete filas
 * abiertos a la vez convierte la página en un muro ilegible.
 */
export function BarberCard({ barber }: { barber: Barber }) {
  const [panel, setPanel] = useState<"none" | "hours" | "absence">("none");

  const [absenceState, absenceAction, savingAbsence] = useActionState<
    TeamState,
    FormData
  >(createAbsence, {});
  const [removeState, removeAction, removing] = useActionState<
    TeamState,
    FormData
  >(removeBarber, {});

  const dimmed = barber.status !== "activo";

  return (
    <article
      className={cn(
        "keyline bg-paper-raised shadow-hard",
        dimmed && "opacity-95",
      )}
    >
      <div
        aria-hidden="true"
        className={cn("keyline-b h-2.5", FILL[barber.accent])}
      />

      <div className="p-5">
        {/* --- Cabecera --------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span
            aria-hidden="true"
            className={cn(
              "keyline font-display text-on-color grid size-11 shrink-0 place-items-center text-base leading-none",
              FILL[barber.accent],
            )}
          >
            {barber.initials}
          </span>

          <div className="min-w-32 flex-1">
            <h3 className="text-xl leading-none">{barber.name}</h3>
            <p
              className={cn(
                "mt-1.5 text-xs font-semibold",
                barber.status === "activo" ? "text-ink-soft" : "text-red-ink",
              )}
            >
              {STATUS_LABEL[barber.status]}
            </p>
          </div>

          {/* --- Cambio de estado ---------------------------------------- */}
          <div className="flex flex-wrap gap-2">
            {(["activo", "pausa", "baja"] as BarberStatus[])
              .filter((s) => s !== barber.status)
              .map((status) => (
                <form key={status} action={changeStatus}>
                  <input type="hidden" name="id" value={barber.id} />
                  <input type="hidden" name="status" value={status} />
                  <Button
                    type="submit"
                    tone={status === "activo" ? "blue" : "paper"}
                    size="sm"
                    ariaLabel={`${barber.name}: ${STATUS_LABEL[status].toLowerCase()}`}
                  >
                    {status === "activo"
                      ? "Reactivar"
                      : status === "pausa"
                        ? "Pausar"
                        : "Dar de baja"}
                  </Button>
                </form>
              ))}
          </div>
        </div>

        {/* --- Resumen del horario ---------------------------------------- */}
        {/*
          Siete fichas, con el día encima y su horario debajo. En una rejilla de
          etiqueta-a-la-izquierda y valor-a-la-derecha, en pantalla ancha el par
          quedaba a medio metro de distancia y costaba saber qué iba con qué.
        */}
        <dl className="keyline-t mt-5 grid grid-cols-4 gap-1.5 pt-4 sm:grid-cols-7">
          {DAYS.map(({ day, label }) => {
            const own = barber.hours?.[day as 0 | 1 | 2 | 3 | 4 | 5 | 6];
            const libra = own !== undefined && own !== null && own.length === 0;
            const propio = own !== undefined && own !== null && own.length > 0;

            return (
              <div
                key={day}
                className={cn(
                  "keyline px-1.5 py-1.5 text-center",
                  libra ? "bg-paper-sunken" : "bg-paper",
                )}
              >
                <dt className="text-ink-soft text-[0.625rem] font-bold tracking-[0.08em] uppercase">
                  {label.slice(0, 3)}
                </dt>
                <dd
                  className={cn(
                    "font-display mt-0.5 text-[0.6875rem] leading-tight tabular-nums",
                    libra && "text-red-ink",
                  )}
                >
                  {libra ? (
                    "Libra"
                  ) : propio ? (
                    <span className="block">
                      {own.map((r) => (
                        <span key={`${r.from}-${r.to}`} className="block">
                          {formatRange(r)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-ink-faint">Local</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* --- Ausencias -------------------------------------------------- */}
        {(barber.absences ?? []).length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {barber.absences.map((absence, index) => (
              <li
                key={`${absence.from}-${absence.to}-${index}`}
                className="keyline bg-paper-sunken flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
              >
                <span>
                  <strong className="font-semibold">
                    {absence.from.split("-").reverse().slice(0, 2).join("/")} –{" "}
                    {absence.to.split("-").reverse().slice(0, 2).join("/")}
                  </strong>
                  {absence.reason ? ` · ${absence.reason}` : ""}
                </span>
                <form action={deleteAbsence}>
                  <input type="hidden" name="id" value={barber.id} />
                  <input type="hidden" name="index" value={index} />
                  <button
                    type="submit"
                    className="hover:decoration-ink font-semibold underline decoration-transparent underline-offset-2"
                    aria-label={`Quitar la ausencia de ${barber.name} del ${absence.from}`}
                  >
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        {/* --- Acciones --------------------------------------------------- */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button
            onClick={() => setPanel(panel === "hours" ? "none" : "hours")}
            tone="paper"
            size="sm"
          >
            {panel === "hours" ? "Cerrar horario" : "Editar horario"}
          </Button>
          <Button
            onClick={() => setPanel(panel === "absence" ? "none" : "absence")}
            tone="paper"
            size="sm"
          >
            {panel === "absence" ? "Cerrar ausencia" : "Añadir ausencia"}
          </Button>
        </div>

        {/* --- Horario ---------------------------------------------------- */}
        {panel === "hours" ? <HoursEditor barber={barber} /> : null}

        {/* --- Formulario de ausencia ------------------------------------- */}
        {panel === "absence" ? (
          <form action={absenceAction} className="keyline mt-5 p-4">
            <input type="hidden" name="id" value={barber.id} />
            <p className="font-display text-base">
              Vacaciones, baja o día libre
            </p>
            <p className="text-ink-soft mt-1 text-xs">
              Esos días no se ofrecerán citas con {barber.name}.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field
                id={`from-${barber.id}`}
                name="from"
                label="Desde"
                type="date"
                required
              />
              <Field
                id={`to-${barber.id}`}
                name="to"
                label="Hasta"
                type="date"
                required
              />
              <Field
                id={`reason-${barber.id}`}
                name="reason"
                label="Motivo"
                placeholder="Vacaciones"
                maxLength={60}
              />
            </div>

            {absenceState.error ? (
              <p
                role="alert"
                className="keyline bg-red text-on-color mt-4 px-3 py-2 text-xs font-semibold"
              >
                {absenceState.error}
              </p>
            ) : null}

            <div className="mt-4">
              <Button
                type="submit"
                tone="blue"
                size="sm"
                disabled={savingAbsence}
                icon={
                  savingAbsence ? (
                    <Loader2
                      aria-hidden="true"
                      size={14}
                      className="animate-spin"
                    />
                  ) : undefined
                }
              >
                {savingAbsence ? "Guardando…" : "Anotar ausencia"}
              </Button>
            </div>
          </form>
        ) : null}

        {/* --- Borrado definitivo ----------------------------------------- */}
        {barber.status === "baja" ? (
          <form action={removeAction} className="keyline-t mt-5 pt-4">
            <input type="hidden" name="id" value={barber.id} />
            <p className="text-ink-soft text-xs leading-relaxed">
              Si nunca tuvo citas, puedes borrarlo del todo. Si las tuvo, se
              queda de baja para no perder su historial.
            </p>
            {removeState.error ? (
              <p
                role="alert"
                className="keyline bg-red text-on-color mt-3 px-3 py-2 text-xs font-semibold"
              >
                {removeState.error}
              </p>
            ) : null}
            <div className="mt-3">
              <Button
                type="submit"
                tone="paper"
                size="sm"
                disabled={removing}
                ariaLabel={`Borrar definitivamente a ${barber.name}`}
              >
                {removing ? "Borrando…" : "Borrar del todo"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
  maxLength,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-ink-soft block">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="keyline bg-paper mt-1.5 w-full px-2.5 py-2 text-sm"
      />
    </div>
  );
}
