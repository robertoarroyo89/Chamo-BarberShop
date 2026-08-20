import Image from "next/image";
import type { Photo } from "@/data/business";
import { cn } from "@/lib/utils";

interface PhotoFrameProps {
  photo: Photo;
  /** Color de la sombra dura. */
  tone?: "ink" | "blue" | "yellow" | "red";
  /** Giro leve, en grados. Da el aire de foto pegada con celo. */
  tilt?: number;
  /** Proporción del recorte. */
  ratio?: "portrait" | "square" | "landscape";
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Rótulo al pie, dentro del marco. */
  caption?: string;
}

const SHADOWS = {
  ink: "shadow-hard-lg",
  blue: "shadow-hard-blue",
  yellow: "shadow-hard-yellow",
  red: "shadow-hard-red",
};

const RATIOS = {
  portrait: "aspect-3/4",
  square: "aspect-square",
  landscape: "aspect-4/3",
};

/**
 * Fotografía enmarcada como una copia impresa: filete negro, sombra dura y un
 * grado de giro. Al pasar por encima se endereza y se levanta, como si la
 * despegaras de la pared.
 *
 * El tratamiento de imagen es contenido a propósito —un punto de contraste y
 * algo menos de saturación— porque las fotos están hechas en un local blanco y
 * muy iluminado: apagarlas se comería el detalle del pelo, que es lo que
 * interesa ver.
 */
export function PhotoFrame({
  photo,
  tone = "ink",
  tilt = 0,
  ratio = "portrait",
  sizes,
  priority = false,
  className,
  caption,
}: PhotoFrameProps) {
  return (
    <figure
      className={cn(
        "keyline bg-paper-raised group relative p-2 transition-transform duration-500 ease-out",
        SHADOWS[tone],
        className,
      )}
      style={tilt ? { rotate: `${tilt}deg` } : undefined}
    >
      <div className={cn("relative overflow-hidden", RATIOS[ratio])}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          quality={82}
          priority={priority}
          className="object-cover contrast-[1.05] saturate-[0.94] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>

      {caption ? (
        <figcaption className="font-display text-ink flex items-center justify-between px-1 pt-2 text-xs tracking-[0.12em] uppercase">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
