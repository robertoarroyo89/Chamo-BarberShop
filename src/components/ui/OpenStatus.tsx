"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/businessClock";
import { formatTime } from "@/lib/hours";
import { cn } from "@/lib/utils";

interface OpenStatusProps {
  className?: string;
  /** Con filete y fondo, como una chapa. Sin él, texto suelto. */
  chip?: boolean;
}

/**
 * Indicador "ABIERTO / CERRADO".
 *
 * El dato viene del reloj del negocio (lib/businessClock), siempre en hora de
 * Europe/Madrid: quien consulte la web desde otro huso ve el estado real de la
 * barbería, no el de su móvil.
 *
 * En el HTML del servidor no hay estado —solo el hueco reservado— así que no
 * puede haber desajuste de hidratación ni un "abierto" erróneo servido desde
 * caché.
 */
export function OpenStatus({ className, chip = false }: OpenStatusProps) {
  const clock = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const status = clock?.status ?? null;
  const isOpen = status?.state === "open";

  let text = "";
  if (status?.state === "open") {
    text = `Abierto hasta las ${formatTime(status.until)}`;
  } else if (status?.state === "closed") {
    const when = status.isToday
      ? "hoy"
      : status.isTomorrow
        ? "mañana"
        : status.nextDayLabel.toLowerCase();
    text = `Cerrado · abre ${when} a las ${formatTime(status.nextFrom)}`;
  }

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex min-h-7 items-center gap-2 whitespace-nowrap",
        "font-sans text-[0.6875rem] font-bold tracking-[0.14em] uppercase",
        chip && "keyline bg-paper-raised px-2.5 py-1",
        className,
      )}
    >
      {status ? (
        <>
          {/* Cuadrado, no círculo: el sistema no usa formas redondas. */}
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0",
              isOpen ? "bg-blue" : "bg-ink-faint",
            )}
          />
          <span className={isOpen ? "text-ink" : "text-ink-soft"}>{text}</span>
        </>
      ) : null}
    </span>
  );
}
