import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";

/**
 * Cierre.
 *
 * Un bloque de color a sangre, con el titular más grande de la página. Es el
 * último empujón: el texto sobre color usa la tinta fija (ver globals.css), así
 * que se lee igual en tema claro y en oscuro.
 */
export function FinalCta() {
  return (
    <section className="bg-blue text-on-color keyline-b relative overflow-hidden">
      {/* Trama de puntos sobre el color: acabado de impresión. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(#141210 1px, transparent 1.4px)",
          backgroundSize: "8px 8px",
        }}
      />

      <div className="container-page relative py-16 sm:py-20 lg:py-24">
        <Reveal y={20}>
          <p className="eyebrow">Última llamada</p>
        </Reveal>

        <Reveal y={26} delay={0.06}>
          <h2 className="display-poster mt-4 text-[clamp(3rem,13vw,9rem)]">
            ¿Te toca
            <br />
            corte?
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal y={20} delay={0.14}>
            <p className="max-w-md text-lg leading-relaxed font-medium">
              Coge tu hueco en un minuto. Si lo prefieres, escríbenos o llama y
              lo cerramos por teléfono.
            </p>
          </Reveal>

          <Reveal y={20} delay={0.2}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#reservar" tone="paper" size="lg">
                Pedir cita
              </ButtonLink>
              <ButtonLink
                href={business.whatsapp.href}
                external
                tone="ink"
                size="lg"
                icon={<WhatsAppGlyph size={19} />}
                ariaLabel="Escribir por WhatsApp (se abre en una pestaña nueva)"
              >
                WhatsApp
              </ButtonLink>
              <ButtonLink
                href={business.phone.href}
                tone="ink"
                size="lg"
                icon={<Phone aria-hidden="true" size={18} />}
                ariaLabel={`Llamar al ${business.phone.display}`}
                className="sm:hidden"
              >
                Llamar
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
