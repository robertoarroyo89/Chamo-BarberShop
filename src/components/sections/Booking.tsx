import { BookingForm } from "@/components/booking/BookingForm";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { isBookingConfigured } from "@/lib/firebaseAdmin";
import { pad2 } from "@/lib/utils";

/**
 * Sección de reserva.
 *
 * Es un componente de servidor: aquí se comprueba UNA vez si la agenda propia
 * está configurada y se le pasa el resultado al formulario. Así el cliente no
 * necesita una petición solo para saber qué interfaz pintar.
 */
export function Booking() {
  const configured = isBookingConfigured();

  return (
    <section
      id="reservar"
      className="relative overflow-hidden py-(--spacing-section)"
    >
      {/* Punto de tinta amarilla detrás de la numeración, del tamaño de una
          mancha de imprenta y no de un fondo entero: a lo grande volvía a
          parecer el degradado difuso de cualquier landing. */}
      <div
        aria-hidden="true"
        className="bg-yellow keyline pointer-events-none absolute top-16 -left-14 size-44 rounded-full opacity-70 lg:size-56"
      />
      <div
        aria-hidden="true"
        className="halftone-loose pointer-events-none absolute inset-0 opacity-[0.07]"
      />

      <div className="container-page relative">
        {/*
          En móvil manda el formulario: título, formulario y, al final, las vías
          alternativas. En escritorio vuelve a dos columnas, con el formulario a
          la derecha ocupando las dos filas.
        */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:row-start-1">
            <SectionTitle
              index={pad2(5)}
              eyebrow="Tu hueco"
              lines={["Pide", "cita"]}
              tone="red"
            />

            <Reveal y={18} delay={0.12}>
              <p className="text-ink-soft mt-7 max-w-sm text-base leading-relaxed">
                Elige servicio, barbero y hora. Sin registrarte y sin descargar
                nada: en tres toques está hecho.
              </p>
            </Reveal>

            <Reveal y={16} delay={0.2}>
              <div className="mt-7">
                <OpenStatus chip />
              </div>
            </Reveal>
          </div>

          {/* Vías alternativas: al final en móvil, bajo el título en escritorio. */}
          <div className="order-last lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2">
            <Reveal y={16} delay={0.2}>
              <div>
                <div className="keyline bg-paper-raised p-4">
                  <p className="eyebrow text-ink-faint">También puedes</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>
                      <a
                        href={business.whatsapp.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:decoration-ink inline-flex items-center gap-2 font-semibold underline decoration-transparent underline-offset-4 transition-colors"
                        aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
                      >
                        <WhatsAppGlyph size={15} />
                        Escribirnos por WhatsApp
                      </a>
                    </li>
                    <li>
                      <a
                        href={business.phone.href}
                        className="hover:decoration-ink font-semibold underline decoration-transparent underline-offset-4 transition-colors"
                        aria-label={`Llamar al ${business.phone.display}`}
                      >
                        Llamar al {business.phone.display}
                      </a>
                    </li>
                    <li className="text-ink-soft">
                      O pasarte sin cita, si pillas hueco.
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <Reveal y={24} delay={0.08}>
              <BookingForm configured={configured} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
