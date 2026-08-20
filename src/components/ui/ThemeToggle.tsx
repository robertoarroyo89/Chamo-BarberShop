"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  setTheme,
  subscribe,
} from "@/lib/themeStore";

/**
 * Interruptor de tema.
 *
 * El tema de casa es el claro —el cartel de papel—; el oscuro es una cortesía
 * para quien lo prefiera.
 *
 * El estado no se guarda aquí: la verdad está en el atributo `data-theme` del
 * documento, que el script en línea del layout deja puesto ANTES del primer
 * pintado. Este componente solo lo lee y lo cambia (ver lib/themeStore).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // Antes de hidratar no se anuncia estado, solo la acción.
      aria-label={
        theme === null
          ? "Cambiar entre tema claro y oscuro"
          : isDark
            ? "Cambiar a tema claro"
            : "Cambiar a tema oscuro"
      }
      aria-pressed={theme === null ? undefined : isDark}
      className={
        "keyline bg-paper-raised text-ink inline-flex size-10 shrink-0 items-center justify-center " +
        "transition-[transform,box-shadow] duration-150 ease-out " +
        "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard " +
        "active:translate-x-0 active:translate-y-0 active:shadow-none " +
        (className ?? "")
      }
    >
      {/* Los dos iconos están siempre en el marcado y se alternan por opacidad:
          el botón no cambia de tamaño al pulsarlo. */}
      <span className="relative block size-[18px]">
        <Sun
          aria-hidden="true"
          size={18}
          className={
            "absolute inset-0 transition-opacity duration-200 " +
            (isDark ? "opacity-100" : "opacity-0")
          }
        />
        <Moon
          aria-hidden="true"
          size={18}
          className={
            "absolute inset-0 transition-opacity duration-200 " +
            (isDark ? "opacity-0" : "opacity-100")
          }
        />
      </span>
    </button>
  );
}
