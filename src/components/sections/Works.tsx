import { ButtonLink } from "@/components/ui/Button";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { InstagramGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { pad2 } from "@/lib/utils";

/**
 * Retícula de trabajos.
 *
 * Las plazas están descritas en datos, no escritas a mano una por una: si
 * mañana se añaden fotos en business.ts, la composición sigue funcionando
 * porque se recorre este ciclo. Cada plaza lleva su tamaño, su desnivel, su
 * giro y el color de su sombra, para que la pared parezca compuesta y no
 * alineada con regla.
 *
 * Los anchos suman 12 de dos en dos (7+5 y 5+7), así que con un número par de
 * fotos no queda ningún hueco suelto al final de una fila.
 */
const SLOTS = [
  { span: "col-span-2 lg:col-span-7", offset: "", tilt: -1.5, tone: "blue" },
  {
    span: "col-span-1 lg:col-span-5",
    offset: "lg:mt-16",
    tilt: 2,
    tone: "yellow",
  },
  {
    span: "col-span-1 lg:col-span-5",
    offset: "lg:mt-2",
    tilt: -2,
    tone: "red",
  },
  {
    span: "col-span-2 lg:col-span-7",
    offset: "lg:mt-14",
    tilt: 1.5,
    tone: "yellow",
  },
] as const;

const SLOT_SIZES = [
  "(min-width: 1024px) 54vw, 92vw",
  "(min-width: 1024px) 38vw, 46vw",
  "(min-width: 1024px) 38vw, 46vw",
  "(min-width: 1024px) 54vw, 92vw",
];

export function Works() {
  return (
    <section id="trabajos" className="py-(--spacing-section)">
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            index={pad2(3)}
            eyebrow="Nuestro trabajo"
            lines={["Cortes", "de la casa"]}
            tone="red"
            className="lg:max-w-2xl"
          />
          <Reveal y={16} delay={0.1}>
            <div className="lg:pb-3">
              <p className="text-ink-soft mb-4 max-w-xs text-sm leading-relaxed">
                Fotos hechas en el local. Sin filtros y sin retoques: lo que ves
                es lo que sale de la silla.
              </p>
              <ButtonLink
                href={business.instagram.href}
                external
                tone="paper"
                size="sm"
                icon={<InstagramGlyph size={15} />}
                ariaLabel={`Ver más trabajos en Instagram, ${business.instagram.handle} (se abre en una pestaña nueva)`}
              >
                Más en Instagram
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 lg:mt-16 lg:grid-cols-12 lg:gap-7">
          {business.works.map((photo, index) => {
            const slot = SLOTS[index % SLOTS.length];
            return (
              <Reveal
                key={photo.id}
                y={26}
                delay={(index % 3) * 0.07}
                className={`${slot.span} ${slot.offset}`}
              >
                <PhotoFrame
                  photo={photo}
                  tone={slot.tone}
                  tilt={slot.tilt}
                  ratio="portrait"
                  sizes={SLOT_SIZES[index % SLOT_SIZES.length]}
                  caption={photo.label}
                />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
