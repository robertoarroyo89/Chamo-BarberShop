import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { business } from "@/data/business";
import { getAllBarbers } from "@/lib/barbersStore";
import { visibleBarbers } from "@/lib/team";
import { cn, pad2 } from "@/lib/utils";

const ACCENTS = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  red: "bg-red",
};

/**
 * El equipo.
 *
 * Los nombres son los que la barbería tiene publicados en su ficha de reservas.
 * Se muestran con iniciales sobre un bloque de color en lugar de retratos: hay
 * fotos reales de los barberos, pero no está confirmado qué cara corresponde a
 * cada nombre y poner una por otra sería peor que no poner ninguna.
 */
export async function Team() {
  // El equipo sale de la base de datos, no del código: así un alta o una baja
  // desde el panel se ve en la web sin volver a desplegar.
  const team = visibleBarbers(await getAllBarbers());

  return (
    <section
      id="equipo"
      className="bg-paper-sunken keyline-t keyline-b py-(--spacing-section)"
    >
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <SectionTitle
            index={pad2(4)}
            eyebrow="Quién te atiende"
            lines={["El equipo"]}
            tone="blue"
            size="md"
          />

          <Reveal y={18} delay={0.1}>
            <p className="text-ink-soft mt-6 max-w-md text-base leading-relaxed">
              {team.length === 1
                ? "Aquí no hay rotación: te atiende siempre la misma mano."
                : `Somos ${team.length}. Puedes pedir cita con quien quieras o dejar que te atienda el primero que quede libre.`}
            </p>
          </Reveal>

          <ul className="mt-9 grid gap-4 sm:grid-cols-3">
            {team.map((barber, index) => (
              <Reveal
                as="li"
                key={barber.id}
                y={20}
                delay={0.14 + index * 0.07}
              >
                <div className="keyline bg-paper-raised flex items-center gap-4 p-4 shadow-hard">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "keyline font-display text-on-color grid size-12 shrink-0 place-items-center text-lg leading-none",
                      ACCENTS[barber.accent],
                    )}
                  >
                    {barber.initials}
                  </span>
                  <span className="font-display text-xl leading-none">
                    {barber.name}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>

          {/* Comodidades reales del local, tomadas de su ficha. */}
          <Reveal y={18} delay={0.3}>
            <ul className="mt-10 flex flex-wrap gap-2">
              {business.amenities.map((item) => (
                <li
                  key={item}
                  className="keyline bg-paper-raised text-ink-soft px-3 py-1.5 text-xs font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal y={26} delay={0.12}>
            <PhotoFrame
              photo={business.shopPhotos.thumbsUp}
              tone="yellow"
              tilt={2}
              ratio="square"
              sizes="(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 88vw"
              caption="En plena faena"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
