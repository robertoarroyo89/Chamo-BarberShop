import { BookingForm } from "@/components/booking/BookingForm";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { getAllBarbers } from "@/lib/barbersStore";
import { bookableBarbers } from "@/lib/team";
import { isBookingConfigured } from "@/lib/firebaseAdmin";
import { pad2 } from "@/lib/utils";

/**
 * Sección de reserva.
 *
 * Es un componente de servidor: aquí se comprueba UNA vez si la agenda propia
 * está configurada y se le pasa el resultado al formulario. Así el cliente no
 * necesita una petición solo para saber qué interfaz pintar.
 */
export async function Booking() {
  const configured = isBookingConfigured();
  // El equipo se lee aquí para que el selector salga ya pintado en el HTML.
  const team = bookableBarbers(await getAllBarbers()).map(
    ({ id, name, initials, accent }) => ({ id, name, initials, accent }),
  );

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
          Cabecera horizontal y formulario a todo el ancho.
          En dos columnas el formulario medía más de mil píxeles de alto: una
          columna estrecha obliga a apilar los cinco pasos y en escritorio se
          convertía en un scroll interminable. Ahora los pasos se reparten en
          dos columnas dentro del propio formulario.
        */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            index={pad2(1)}
            eyebrow="Tu hueco"
            lines={["Pide", "cita"]}
            tone="red"
          />

          <Reveal y={16} delay={0.12} className="lg:pb-3 lg:text-right">
            <p className="text-ink-soft max-w-sm text-base leading-relaxed">
              Elige servicio, barbero y hora. Sin registrarte y sin descargar
              nada: en tres toques está hecho.
            </p>
            <div className="mt-4 lg:flex lg:justify-end">
              <OpenStatus chip />
            </div>
          </Reveal>
        </div>

        <Reveal y={24} delay={0.08} className="mt-9">
          <BookingForm configured={configured} initialBarbers={team} />
        </Reveal>

        {/* Vías alternativas, en una tira: ocupan una línea en vez de una caja. */}
        <Reveal y={16} delay={0.16}>
          <div className="keyline bg-paper-raised mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
            <span className="eyebrow text-ink-faint">También puedes</span>
            <a
              href={business.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:decoration-ink inline-flex items-center gap-2 text-sm font-semibold underline decoration-transparent underline-offset-4 transition-colors"
              aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
            >
              <WhatsAppGlyph size={15} />
              Escribirnos por WhatsApp
            </a>
            <a
              href={business.phone.href}
              className="hover:decoration-ink text-sm font-semibold underline decoration-transparent underline-offset-4 transition-colors"
              aria-label={`Llamar al ${business.phone.display}`}
            >
              Llamar al {business.phone.display}
            </a>
            <span className="text-ink-soft text-sm">
              O pasarte sin cita, si pillas hueco.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
