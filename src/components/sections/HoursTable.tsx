"use client";

import { useSyncExternalStore } from "react";
import { openingHours } from "@/data/business";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/businessClock";
import { formatRange, groupSchedule } from "@/lib/hours";
import { cn } from "@/lib/utils";

const GROUPS = groupSchedule(openingHours);

/**
 * Cuadro de horarios.
 *
 * Se genera a partir de `openingHours`, agrupando los días con el mismo
 * horario para no repetir cinco filas idénticas.
 *
 * El día en curso se resalta a partir del reloj del negocio: el servidor no
 * puede saber en qué día está el visitante, así que el HTML inicial sale sin
 * resaltar y la marca aparece tras la hidratación. Al ser solo un fondo y un
 * filete, la aparición no mueve nada de sitio.
 */
export function HoursTable() {
  const clock = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const today = clock?.day ?? null;

  return (
    <dl className="keyline-t">
      {GROUPS.map((group) => {
        const isToday = today !== null && group.days.includes(today);
        const closed = group.ranges.length === 0;

        return (
          <div
            key={group.label}
            className={cn(
              "relative flex flex-col gap-1.5 px-3 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8",
              // El día en curso se pinta con el amarillo del rótulo. No es solo
              // color: lleva además la etiqueta "HOY".
              isToday ? "bg-yellow text-on-color" : "keyline-b",
            )}
          >
            <dt className="flex items-baseline gap-3">
              <span
                className={cn(
                  "font-display text-lg tracking-[0.02em] sm:text-xl",
                  closed && !isToday && "text-ink-faint",
                )}
              >
                {group.label}
              </span>
              {isToday ? (
                <span className="keyline bg-paper-raised text-ink px-1.5 py-0.5 text-[0.625rem] font-bold tracking-[0.14em] uppercase">
                  Hoy
                </span>
              ) : null}
            </dt>

            <dd
              className={cn(
                "flex flex-wrap items-baseline gap-x-5 gap-y-1 font-display text-base tracking-[0.02em] tabular-nums sm:text-lg",
                closed && !isToday && "text-ink-faint",
              )}
            >
              {closed ? (
                <span>Cerrado</span>
              ) : (
                group.ranges.map((range) => (
                  <span key={`${range.from}-${range.to}`}>
                    {formatRange(range)}
                  </span>
                ))
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
