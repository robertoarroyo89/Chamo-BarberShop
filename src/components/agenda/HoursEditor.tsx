"use client";

import { useActionState, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { saveHours, type TeamState } from "@/app/agenda/actions";
import { Button } from "@/components/ui/Button";
import { openingHours, type TimeRange, type WeekDay } from "@/data/business";
import { formatTime } from "@/lib/hours";
import type { Barber } from "@/lib/team";
import { cn } from "@/lib/utils";

/**
 * Editor del horario semanal de un barbero.
 *
 * Tres decisiones que vienen de usarlo:
 *
 *   1. Las horas se eligen de una lista acotada al horario del local, no con un
 *      campo de hora libre. Un `input type="time"` ofrece las 24 h, y en una
 *      barbería que cierra a las 20:00 poder escribir las 23:30 solo sirve para
 *      equivocarse.
 *   2. Los días que el LOCAL cierra no se pueden editar. El horario del local
 *      manda siempre sobre el del barbero, así que darle controles ahí sería
 *      ofrecer algo que no tiene ningún efecto.
 *   3. Se puede copiar un día al resto. Montar un turno de verano día por día
 *      son siete formularios idénticos.
 *
 * El estado vive aquí arriba —y no en cada fila— precisamente para que copiar
 * sea posible. Al enviar se serializa en campos ocultos, así que por debajo
 * sigue siendo un formulario normal con Server Action.
 */

const DAYS: { day: WeekDay; label: string; short: string }[] = [
  { day: 1, label: "Lunes", short: "Lun" },
  { day: 2, label: "Martes", short: "Mar" },
  { day: 3, label: "Miércoles", short: "Mié" },
  { day: 4, label: "Jueves", short: "Jue" },
  { day: 5, label: "Viernes", short: "Vie" },
  { day: 6, label: "Sábado", short: "Sáb" },
  { day: 0, label: "Domingo", short: "Dom" },
];

type Mode = "local" | "libra" | "propio";

interface DayState {
  mode: Mode;
  ranges: [string, string][];
}

/** Días en los que el local abre. En el resto no hay nada que configurar. */
const SHOP_OPEN = new Set(
  openingHours.filter((d) => d.ranges.length > 0).map((d) => d.day),
);

/** Tramos del local por día, para poder partirlos de ahí. */
const SHOP_RANGES = new Map<WeekDay, TimeRange[]>(
  openingHours.map((d) => [d.day, [...d.ranges]]),
);

/**
 * Horas seleccionables: de la apertura más temprana al cierre más tardío del
 * local, en pasos de media hora.
 */
const TIME_OPTIONS = (() => {
  const all = openingHours.flatMap((d) => d.ranges);
  if (all.length === 0) return [] as string[];

  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const first = Math.min(...all.map((r) => toMin(r.from)));
  const last = Math.max(...all.map((r) => toMin(r.to)));

  const out: string[] = [];
  for (let m = first; m <= last; m += 30) {
    out.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  }
  return out;
})();

function initialState(barber: Barber): Record<number, DayState> {
  const state: Record<number, DayState> = {};

  for (const { day } of DAYS) {
    const own = barber.hours?.[day];
    if (own === undefined || own === null) {
      state[day] = { mode: "local", ranges: [] };
    } else if (own.length === 0) {
      state[day] = { mode: "libra", ranges: [] };
    } else {
      state[day] = {
        mode: "propio",
        ranges: own.map((r) => [r.from, r.to] as [string, string]),
      };
    }
  }

  return state;
}

/** Tramos del local para ese día, como punto de partida al pasar a "propio". */
function shopDefaults(day: WeekDay): [string, string][] {
  return (SHOP_RANGES.get(day) ?? []).map((r) => [r.from, r.to]);
}

export function HoursEditor({ barber }: { barber: Barber }) {
  const [days, setDays] = useState<Record<number, DayState>>(() =>
    initialState(barber),
  );
  const [copiedFrom, setCopiedFrom] = useState<WeekDay | null>(null);
  const [state, action, pending] = useActionState<TeamState, FormData>(
    saveHours,
    {},
  );

  const setMode = (day: WeekDay, mode: Mode) => {
    setCopiedFrom(null);
    setDays((prev) => ({
      ...prev,
      [day]: {
        mode,
        // Al pasar a "propio" se parte del horario del local: casi siempre se
        // trata de recortarlo, no de inventarlo desde cero.
        ranges:
          mode === "propio"
            ? prev[day].ranges.length > 0
              ? prev[day].ranges
              : shopDefaults(day)
            : prev[day].ranges,
      },
    }));
  };

  const setTime = (
    day: WeekDay,
    index: number,
    which: 0 | 1,
    value: string,
  ) => {
    setCopiedFrom(null);
    setDays((prev) => {
      const ranges = prev[day].ranges.map((r) => [...r] as [string, string]);
      while (ranges.length <= index) ranges.push(["", ""]);
      ranges[index][which] = value;
      return { ...prev, [day]: { ...prev[day], ranges } };
    });
  };

  const removeRange = (day: WeekDay, index: number) => {
    setCopiedFrom(null);
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: prev[day].ranges.filter((_, i) => i !== index),
      },
    }));
  };

  const addRange = (day: WeekDay) => {
    setCopiedFrom(null);
    setDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], ranges: [...prev[day].ranges, ["", ""]] },
    }));
  };

  /** Copia la configuración de un día al resto de días que el local abre. */
  const copyToOthers = (from: WeekDay) => {
    setDays((prev) => {
      const source = prev[from];
      const next = { ...prev };
      for (const { day } of DAYS) {
        if (day === from || !SHOP_OPEN.has(day)) continue;
        next[day] = {
          mode: source.mode,
          ranges: source.ranges.map((r) => [...r] as [string, string]),
        };
      }
      return next;
    });
    setCopiedFrom(from);
  };

  return (
    <form action={action} className="keyline mt-5">
      <input type="hidden" name="id" value={barber.id} />

      <div className="keyline-b bg-paper-sunken px-4 py-3">
        <p className="font-display text-base leading-none">Horario semanal</p>
        <p className="text-ink-soft mt-1.5 text-xs leading-relaxed">
          <strong>Local</strong> sigue el horario de la barbería.{" "}
          <strong>Propio</strong> es para turnos: parte del horario del local y
          lo recortas.
        </p>
      </div>

      <div className="divide-ink/15 divide-y">
        {DAYS.map(({ day, label, short }) => {
          const closed = !SHOP_OPEN.has(day);
          const config = days[day];

          // El local cerrado manda: aquí no hay nada que decidir.
          if (closed) {
            return (
              <div
                key={day}
                className="flex items-center gap-3 px-4 py-3 opacity-60"
              >
                <span className="font-display w-20 shrink-0 text-sm">
                  {label}
                </span>
                <span className="text-ink-soft text-xs">
                  El local no abre. No hay horario que configurar.
                </span>
                <input type="hidden" name={`mode-${day}`} value="local" />
              </div>
            );
          }

          return (
            <div key={day} className="px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-display w-20 shrink-0 text-sm">
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                </span>

                {/* Control segmentado: se ve el estado de un vistazo y se
                    cambia de un toque, sin desplegar nada. */}
                <div
                  role="group"
                  aria-label={`${label}: tipo de horario`}
                  className="flex"
                >
                  {(
                    [
                      ["local", "Local"],
                      ["libra", "Libra"],
                      ["propio", "Propio"],
                    ] as [Mode, string][]
                  ).map(([value, text], i) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(day, value)}
                      aria-pressed={config.mode === value}
                      className={cn(
                        "keyline px-3 py-1.5 text-xs font-bold uppercase transition-colors",
                        i > 0 && "-ml-0.5",
                        config.mode === value
                          ? value === "libra"
                            ? "bg-red text-on-color"
                            : "bg-ink text-paper"
                          : "bg-paper-raised text-ink-soft hover:text-ink",
                      )}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <input type="hidden" name={`mode-${day}`} value={config.mode} />

                {config.mode === "propio" ? (
                  <button
                    type="button"
                    onClick={() => copyToOthers(day)}
                    className="text-ink-soft hover:text-ink ml-auto inline-flex items-center gap-1.5 text-xs font-semibold underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
                  >
                    <Copy aria-hidden="true" size={13} />
                    Copiar a los demás días
                  </button>
                ) : null}
              </div>

              {/* --- Tramos, solo si es horario propio ------------------- */}
              {config.mode === "propio" ? (
                <div className="mt-3 space-y-2 pl-0 sm:pl-23">
                  {(config.ranges.length > 0 ? config.ranges : [["", ""]]).map(
                    (range, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <TimeSelect
                          label={`${label}, tramo ${index + 1}, desde`}
                          name={`from-${day}-${index + 1}`}
                          value={range[0]}
                          onChange={(v) => setTime(day, index, 0, v)}
                        />
                        <span
                          aria-hidden="true"
                          className="text-ink-faint text-xs"
                        >
                          a
                        </span>
                        <TimeSelect
                          label={`${label}, tramo ${index + 1}, hasta`}
                          name={`to-${day}-${index + 1}`}
                          value={range[1]}
                          onChange={(v) => setTime(day, index, 1, v)}
                        />
                        {config.ranges.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRange(day, index)}
                            className="text-ink-soft hover:text-red-ink text-xs font-semibold underline underline-offset-2"
                            aria-label={`Quitar el tramo ${index + 1} del ${label.toLowerCase()}`}
                          >
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    ),
                  )}

                  {config.ranges.length < 2 ? (
                    <button
                      type="button"
                      onClick={() => addRange(day)}
                      className="text-ink-soft hover:text-ink text-xs font-semibold underline underline-offset-2"
                    >
                      + Añadir segundo tramo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* --- Avisos ----------------------------------------------------- */}
      <div className="keyline-t px-4 py-3">
        {/* El aviso de copiado desaparece en cuanto hay respuesta del guardado:
            si no, tapaba el mensaje que de verdad importa. */}
        {copiedFrom !== null && !state.ok && !state.error ? (
          <p
            role="status"
            className="keyline bg-yellow text-on-color mb-3 px-3 py-2 text-xs font-semibold"
          >
            Copiado a los demás días. Revisa y guarda.
          </p>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="keyline bg-red text-on-color mb-3 px-3 py-2 text-xs font-semibold"
          >
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p
            role="status"
            className="keyline bg-blue text-on-color mb-3 px-3 py-2 text-xs font-semibold"
          >
            {state.ok}
          </p>
        ) : null}

        <Button
          type="submit"
          tone="blue"
          size="sm"
          disabled={pending}
          icon={
            pending ? (
              <Loader2 aria-hidden="true" size={14} className="animate-spin" />
            ) : undefined
          }
        >
          {pending ? "Guardando…" : "Guardar horario"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Selector de hora acotado al horario del local.
 *
 * Es un `select` y no un `input type="time"` justamente para que no aparezcan
 * las 21, las 22 ni las 3 de la mañana: solo hay horas en las que el local
 * podría estar abierto.
 */
function TimeSelect({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="keyline bg-paper px-2 py-1.5 text-xs tabular-nums"
    >
      <option value="">--:--</option>
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {formatTime(time)}
        </option>
      ))}
    </select>
  );
}
