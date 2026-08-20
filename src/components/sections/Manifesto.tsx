import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { business } from "@/data/business";
import { pad2 } from "@/lib/utils";

/** Lo que de verdad hace la casa, en cuatro palabras. */
const WHAT_WE_DO = [
  { label: "Degradados", detail: "Del cero al largo que pidas." },
  { label: "Cortes modernos", detail: "Lo que traigas en el móvil, hecho." },
  { label: "Barba a navaja", detail: "Perfilado, toalla y aceite." },
  { label: "Niños", detail: "Con paciencia y sin dramas." },
];

export function Manifesto() {
  return (
    <section id="manifiesto" className="py-(--spacing-section)">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <SectionTitle
            index={pad2(4)}
            eyebrow="Quiénes somos"
            lines={["Barbería", "de barrio."]}
            tone="blue"
          />

          <div className="mt-9 max-w-xl space-y-5 text-base leading-relaxed sm:text-lg">
            <Reveal y={18}>
              <p>
                Llevamos {business.yearsExperience} años cortando en{" "}
                {business.address.city}. Somos tres en la silla y cada cabeza se
                mira antes de encender la máquina.
              </p>
            </Reveal>
            <Reveal y={18} delay={0.08}>
              <p className="text-ink-soft">
                Aquí no hay prisa ni postureo. Entras, dices lo que quieres —o
                lo enseñas en el móvil— y sales con la cabeza a punto. Precio de
                barrio y trato de barrio.
              </p>
            </Reveal>
          </div>

          {/* --- Lo que hacemos, como un listado de cartel ---------------- */}
          <Reveal y={20} delay={0.14}>
            <ul className="keyline-t mt-11">
              {WHAT_WE_DO.map((item, index) => (
                <li
                  key={item.label}
                  className="keyline-b flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-ink-faint w-6 text-xs"
                  >
                    {pad2(index + 1)}
                  </span>
                  <span className="font-display text-[clamp(1.25rem,3.5vw,1.75rem)] tracking-[0.01em]">
                    {item.label}
                  </span>
                  <span className="text-ink-soft ml-auto text-sm">
                    {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* --- Fotografía: el equipo trabajando ------------------------- */}
        <div className="lg:col-span-5 lg:pt-24">
          <Reveal y={26} delay={0.1}>
            <PhotoFrame
              photo={business.shopPhotos.working}
              tone="blue"
              tilt={-2}
              ratio="portrait"
              sizes="(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 88vw"
              caption="Dentro del local"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
