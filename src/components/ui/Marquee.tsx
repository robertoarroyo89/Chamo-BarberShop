import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  /** Fondo de la cinta. */
  tone?: "blue" | "yellow" | "red" | "ink";
  /** Duración de una vuelta completa. Más segundos = más lento. */
  seconds?: number;
  className?: string;
}

const TONES = {
  blue: "bg-blue text-on-color",
  yellow: "bg-yellow text-on-color",
  red: "bg-red text-on-color",
  ink: "bg-ink text-paper",
};

/**
 * CINTA DE TEXTO en bucle, como una valla o un rótulo de tienda.
 *
 * El contenido se escribe DOS veces y la animación desplaza exactamente el
 * 50 %: al terminar, la segunda copia está donde estaba la primera y el salto
 * es invisible. Es CSS puro, sin JavaScript y sin medir nada.
 *
 * La cinta visible va marcada como decorativa y el texto se ofrece una sola vez
 * a los lectores de pantalla, para no repetirlo dos veces.
 */
export function Marquee({
  items,
  tone = "yellow",
  seconds = 34,
  className,
}: MarqueeProps) {
  const copies = [0, 1];

  return (
    <div
      className={cn(
        "keyline-t keyline-b overflow-hidden py-2.5 select-none",
        TONES[tone],
        className,
      )}
    >
      <div
        className="marquee-track"
        aria-hidden="true"
        style={{ ["--marquee-duration" as string]: `${seconds}s` }}
      >
        {copies.map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((item, index) => (
              <span
                key={`${copy}-${index}`}
                className="flex shrink-0 items-center"
              >
                <span className="font-display px-5 text-sm tracking-[0.1em] whitespace-nowrap uppercase sm:text-base">
                  {item}
                </span>
                {/* Separador: un rombo, no un emoji. */}
                <span className="size-1.5 rotate-45 bg-current opacity-70" />
              </span>
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">{items.join(". ")}.</span>
    </div>
  );
}
