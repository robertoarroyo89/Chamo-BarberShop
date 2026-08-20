import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Stars } from "@/components/ui/Stars";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { formatDecimal } from "@/lib/utils";

/**
 * Primer viewport.
 *
 * El rótulo de la casa ES el titular: no se retipografía "El Chamo" con una
 * fuente cualquiera cuando existe un graffiti hecho a mano con la personalidad
 * del negocio dentro. El resto de la página sale de sus colores.
 */
export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="halftone-loose pointer-events-none absolute inset-0 opacity-[0.08]"
      />

      <div className="container-page relative grid gap-10 pt-28 pb-14 sm:pt-32 lg:grid-cols-12 lg:gap-8 lg:pt-36 lg:pb-20">
        {/* --- Columna de texto ------------------------------------------- */}
        <div className="lg:col-span-7 lg:pr-6">
          <Reveal
            y={12}
            className="flex flex-wrap items-center gap-x-3 gap-y-2"
          >
            <span className="keyline bg-yellow text-on-color eyebrow px-2.5 py-1">
              Barbería en {business.address.city}
            </span>
            <OpenStatus chip />
          </Reveal>

          {/* El rótulo, como encabezado principal. El texto alternativo hace
              de título para lectores de pantalla y buscadores. */}
          <h1 className="mt-7 max-w-xl sm:mt-9">
            <Image
              src="/logo/el-chamo.png"
              alt={`${business.name} — barbería en ${business.address.city}, ${business.address.region}`}
              width={1200}
              height={713}
              // Es el elemento más grande del primer viewport: se precarga.
              priority
              sizes="(min-width: 1024px) 34rem, (min-width: 640px) 26rem, 84vw"
              className="h-auto w-[84%] max-w-[34rem] sm:w-[26rem] lg:w-full"
            />
          </h1>

          <Reveal y={20} delay={0.1}>
            <p className="display-poster mt-8 text-[clamp(2.1rem,7vw,3.9rem)]">
              Entras, te sientas
              <br />
              <span className="text-red-ink">y sales nuevo.</span>
            </p>
          </Reveal>

          <Reveal y={18} delay={0.18}>
            <p className="text-ink-soft mt-6 max-w-md text-base leading-relaxed sm:text-lg">
              Degradados, cortes modernos y barba a navaja en{" "}
              {business.address.city}. Puedes venir sin cita, pero pidiéndola
              esperas menos.
            </p>
          </Reveal>

          <Reveal y={18} delay={0.26}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="#reservar" tone="blue" size="lg">
                Pedir cita
              </ButtonLink>
              <ButtonLink
                href={business.whatsapp.href}
                external
                tone="paper"
                size="lg"
                icon={<WhatsAppGlyph size={19} />}
                ariaLabel="Escribir por WhatsApp (se abre en una pestaña nueva)"
              >
                WhatsApp
              </ButtonLink>
            </div>
          </Reveal>

          {/* --- Prueba social, con la fuente citada ---------------------- */}
          <Reveal y={16} delay={0.34}>
            <a
              href={business.googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex flex-wrap items-center gap-x-3 gap-y-1"
              aria-label={`${formatDecimal(business.rating.value)} sobre 5 en ${business.rating.source}, ${business.rating.count} reseñas. Ver en Google (se abre en una pestaña nueva)`}
            >
              <span className="font-display text-2xl leading-none">
                {formatDecimal(business.rating.value)}
              </span>
              <Stars value={business.rating.value} size={15} />
              <span className="text-ink-soft group-hover:decoration-ink text-xs underline decoration-transparent underline-offset-4 transition-colors">
                {business.rating.count} reseñas en {business.rating.source}
              </span>
            </a>
          </Reveal>
        </div>

        {/* --- Fotografía del local --------------------------------------- */}
        <div className="lg:col-span-5 lg:pt-6">
          <Reveal y={26} delay={0.16} className="relative">
            {/*
              Mancha de tinta azul asomando por detrás del marco, desplazada
              como una plancha mal registrada en la imprenta. Canto duro y sin
              difuminar: un círculo borroso de fondo es el recurso de cualquier
              landing genérica, y aquí lo que toca es tinta plana.
            */}
            <div
              aria-hidden="true"
              className="bg-blue pointer-events-none absolute -top-6 -right-7 bottom-10 left-10 -z-10 rounded-full sm:-right-10"
            />
            <PhotoFrame
              photo={business.shopPhotos.storefront}
              tone="red"
              tilt={2}
              ratio="square"
              sizes="(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 88vw"
              caption={business.address.street}
              // En escritorio esta foto es un poco mayor que el rótulo, así que
              // es ella la que marca el LCP. Se precarga igual que el logotipo:
              // dejarla en diferido retrasaba la métrica sin ganar nada.
              priority
            />

            {/* Pegatina de precio: el gancho real del negocio. */}
            <div
              className="keyline bg-yellow text-on-color absolute -top-4 -left-3 grid place-items-center px-3 py-2 shadow-hard sm:-left-5"
              style={{ rotate: "-7deg" }}
            >
              <span className="font-display text-[0.625rem] leading-none tracking-[0.16em]">
                Desde
              </span>
              <span className="font-display text-2xl leading-none">7 €</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
