import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  /** Numeración editorial: "01", "02"… */
  index: string;
  /** Antetítulo corto. */
  eyebrow: string;
  /** Titular. Cada entrada es una línea. */
  lines: string[];
  tone?: "blue" | "yellow" | "red";
  className?: string;
  /** Tamaño del titular. "lg" para las secciones grandes. */
  size?: "md" | "lg";
}

const NUMBER_TONES = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  red: "bg-red",
};

/**
 * Cabecera de sección con lenguaje de cartel: el número en un cuadrado de
 * color con filete, el antetítulo en versalitas y el titular en Anton, grande y
 * apretado.
 */
export function SectionTitle({
  index,
  eyebrow,
  lines,
  tone = "blue",
  className,
  size = "lg",
}: SectionTitleProps) {
  return (
    <div className={className}>
      <Reveal y={14} className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "keyline font-display text-on-color inline-flex size-9 items-center justify-center text-sm leading-none",
            NUMBER_TONES[tone],
          )}
        >
          {index}
        </span>
        <span className="eyebrow text-ink-soft">{eyebrow}</span>
        <span aria-hidden="true" className="bg-ink h-0.5 flex-1" />
      </Reveal>

      <Reveal y={20} delay={0.08}>
        <h2
          className={cn(
            "display-poster mt-5",
            size === "lg"
              ? "text-[clamp(2.75rem,9vw,6.5rem)]"
              : "text-[clamp(2rem,6vw,3.5rem)]",
          )}
        >
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
      </Reveal>
    </div>
  );
}
