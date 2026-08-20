import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Escalona respecto a los hermanos. En segundos, por compatibilidad de API. */
  delay?: number;
  /** Desplazamiento vertical inicial, en píxeles. */
  y?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "span" | "p";
}

/**
 * Aparición al entrar en pantalla.
 *
 * Es CSS puro: una animación ligada al scroll (ver globals.css). Tres ventajas
 * sobre el enfoque habitual con IntersectionObserver:
 *
 *   1. Es a prueba de fallos. El estado oculto solo existe donde el navegador
 *      sabe animar por scroll; en cualquier otro caso el contenido sale
 *      visible. Con un observador, si por lo que sea no dispara —una pestaña en
 *      segundo plano, un rastreador que no hace scroll— el texto se queda
 *      invisible para siempre. Eso es un fallo de accesibilidad y de SEO, no un
 *      detalle estético.
 *   2. No hay JavaScript: ni componente cliente, ni observadores, ni trabajo en
 *      el hilo principal. Esta pieza se usa una treintena de veces en la
 *      página.
 *   3. La animación va al ritmo real del scroll, no a un temporizador que corre
 *      por su cuenta.
 *
 * Al ser un componente de servidor, no arrastra nada al paquete del cliente.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  style,
  as: Tag = "div",
}: RevealProps) {
  return (
    <Tag
      className={cn("reveal", className)}
      style={
        {
          "--reveal-y": `${y}px`,
          // Los segundos de la API se traducen a un desfase del recorrido: un
          // retardo de 0,1 s equivale a empezar un 4 % más tarde.
          ...(delay
            ? { "--reveal-offset": `${Math.min(delay * 40, 24)}%` }
            : {}),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
