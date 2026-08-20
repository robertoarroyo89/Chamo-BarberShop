import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "yellow" | "red" | "paper" | "ink";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
}

interface LinkProps extends CommonProps {
  href: string;
  external?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
}

interface ActionProps extends CommonProps {
  /**
   * Opcional a propósito: un botón de envío dentro de un formulario —incluidos
   * los formularios con Server Actions del panel interno— no necesita ninguno,
   * y un componente de servidor no puede pasar funciones a la interfaz.
   */
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * BOTÓN PEGATINA.
 *
 * Filete negro, sombra dura sin difuminar y un gesto de pulsación físico: al
 * pasar por encima la pieza se levanta (se desplaza en contra de su sombra) y
 * al pulsar se hunde hasta tocar el papel. Es la microinteracción de la casa —
 * viene de la serigrafía, no de una interfaz de aplicación.
 *
 * Solo se animan `transform` y `box-shadow`.
 */

const TONES: Record<Tone, string> = {
  // El texto sobre bloques de color usa una tinta fija: ver globals.css.
  blue: "bg-blue text-on-color",
  yellow: "bg-yellow text-on-color",
  red: "bg-red text-on-color",
  paper: "bg-paper-raised text-ink",
  ink: "bg-ink text-paper",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3.5 text-sm",
  lg: "px-7 py-4 text-base sm:px-9 sm:py-5 sm:text-lg",
};

function classes({
  tone = "blue",
  size = "md",
  block,
  className,
}: CommonProps) {
  return cn(
    "group inline-flex items-center justify-center gap-2.5 text-center",
    "font-display uppercase tracking-[0.06em] leading-none",
    "keyline shadow-hard",
    // El levantar/hundir. `will-change` se deja fuera a propósito: son piezas
    // pequeñas y no merece reservarles una capa permanente.
    "transition-[transform,box-shadow] duration-150 ease-out",
    "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg",
    "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    /*
     * Deshabilitado con estilo propio, no con opacidad.
     * Bajar la opacidad de un botón azul sobre papel claro lo dejaba
     * prácticamente ilegible; así se lee que aún no está disponible.
     */
    "disabled:pointer-events-none disabled:bg-paper-sunken disabled:text-ink-faint",
    "disabled:border-ink-faint disabled:shadow-none",
    TONES[tone],
    SIZES[size],
    block && "w-full",
    className,
  );
}

export function ButtonLink({
  href,
  external,
  ariaLabel,
  icon,
  children,
  onClick,
  ...rest
}: LinkProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={classes({ children, ...rest })}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </a>
  );
}

export function Button({
  onClick,
  type = "button",
  disabled,
  ariaLabel,
  icon,
  children,
  ...rest
}: ActionProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes({ children, ...rest })}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
