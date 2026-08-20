import { cn } from "@/lib/utils";

/**
 * LOGOTIPO TIPOGRÁFICO para espacios pequeños.
 *
 * El rótulo de la casa es un graffiti ancho y muy detallado: a 40 px de alto no
 * se lee, se convierte en una manchita. Así que en la cabecera y en el menú se
 * usa esta versión tipográfica, que repite su estructura —el nombre grande y
 * "BARBER SHOP" pequeño debajo, subrayado en amarillo— y sí aguanta el tamaño.
 *
 * El rótulo original se usa donde tiene sitio de sobra: héroe, pie, menú móvil,
 * imagen para compartir y favicon.
 */
export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("block leading-none", className)}>
      <span
        className={cn(
          "font-display block tracking-[-0.01em] transition-[font-size] duration-300",
          compact ? "text-[1.35rem]" : "text-[1.6rem]",
        )}
      >
        El Chamo
      </span>
      <span className="mt-1 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="bg-yellow keyline-b h-1.5 w-6 border-b-0"
        />
        <span className="text-ink-soft text-[0.5rem] font-bold tracking-[0.28em] uppercase">
          Barber Shop
        </span>
      </span>
    </span>
  );
}
