import { formatDecimal } from "@/lib/utils";

interface StarsProps {
  /** Valoración de 0 a 5. Admite decimales (rellena la estrella parcial). */
  value: number;
  size?: number;
  className?: string;
}

const STAR_PATH =
  "M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.46l-5.9 3.1 1.12-6.57L2.45 9.34l6.6-.96L12 2.4z";

/**
 * Estrellas de valoración.
 *
 * Amarillo de marca con perfil negro, como el "BARBER SHOP" del rótulo. La
 * cifra se muestra siempre en texto junto a las estrellas, así que la
 * información nunca depende solo del color ni de la forma. El grupo se anuncia
 * una vez con su valor exacto.
 */
export function Stars({ value, size = 14, className }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const fraction = clamped % 1;
  const clipId = `estrella-${String(clamped).replace(".", "-")}`;

  return (
    <span
      role="img"
      aria-label={`${formatDecimal(clamped)} de 5 estrellas`}
      className={className}
      style={{ display: "inline-flex", gap: size * 0.1 }}
    >
      {fraction > 0 ? (
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          focusable="false"
          className="absolute"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <rect x="0" y="0" width={fraction} height="1" />
            </clipPath>
          </defs>
        </svg>
      ) : null}

      {Array.from({ length: 5 }, (_, index) => {
        const filled = index + 1 <= Math.floor(clamped);
        const partial = !filled && index < clamped;

        return (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
          >
            {filled ? <path d={STAR_PATH} className="fill-yellow" /> : null}
            {partial ? (
              <g clipPath={`url(#${clipId})`}>
                <path d={STAR_PATH} className="fill-yellow" />
              </g>
            ) : null}
            {/* El perfil va siempre encima: marca la escala de 5 y da el
                acabado de rótulo. */}
            <path
              d={STAR_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="text-ink"
            />
          </svg>
        );
      })}
    </span>
  );
}
