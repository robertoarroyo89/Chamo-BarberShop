import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { business } from "@/data/business";
import { cn, formatPrice, pad2 } from "@/lib/utils";

const ACCENTS = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  red: "bg-red",
};

/**
 * Carta de servicios.
 *
 * Cada servicio es una ficha impresa: filete negro, la banda de color de marca
 * arriba y el precio en grande, como en la pizarra de la puerta. El precio es
 * el argumento del negocio, así que se lee antes que nada.
 */
export function Services() {
  return (
    <section
      id="servicios"
      className="bg-paper-sunken keyline-t keyline-b py-(--spacing-section)"
    >
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            index={pad2(2)}
            eyebrow="Lo que hacemos"
            lines={["Servicios", "y precios"]}
            tone="yellow"
            className="lg:max-w-2xl"
          />
          <Reveal y={16} delay={0.1}>
            <p className="text-ink-soft max-w-xs text-sm leading-relaxed lg:pb-4 lg:text-right">
              Todos los servicios duran {business.services[0].duration} minutos.
              Efectivo y tarjeta.
            </p>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:mt-16">
          {business.services.map((service, index) => (
            <Reveal
              as="li"
              key={service.id}
              y={22}
              delay={index * 0.06}
              className="h-full"
            >
              <article className="keyline bg-paper-raised flex h-full flex-col shadow-hard">
                {/* Banda de color: identifica el servicio de un vistazo. */}
                <div
                  aria-hidden="true"
                  className={cn("keyline-b h-3", ACCENTS[service.accent])}
                />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="font-display text-ink-faint text-xs"
                    >
                      {pad2(index + 1)}
                    </span>
                    {service.note ? (
                      <span className="keyline font-display text-on-color bg-yellow px-2 py-0.5 text-[0.625rem] tracking-[0.1em] uppercase">
                        {service.note}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-[clamp(1.4rem,4vw,1.75rem)] leading-[1.05]">
                    {service.name}
                  </h3>

                  <p className="text-ink-soft mt-2.5 flex-1 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  <p className="keyline-t mt-5 flex items-baseline justify-between pt-4">
                    <span className="font-display text-3xl leading-none tabular-nums">
                      {formatPrice(service.price)}
                    </span>
                    <span className="text-ink-faint text-xs">
                      {service.duration} min
                    </span>
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
