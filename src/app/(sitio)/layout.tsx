import { SiteHeader } from "@/components/navigation/SiteHeader";
import { StickyBookBar } from "@/components/ui/StickyBookBar";
import { buildLocalBusinessSchema } from "@/lib/seo";

/**
 * Envoltorio del sitio público.
 *
 * Va en un grupo de rutas para que el panel interno (/agenda) NO herede la
 * cabecera, el atajo flotante de reserva ni los datos estructurados del
 * negocio: allí no pintan nada. Es la alternativa limpia a comprobar la ruta
 * dentro de cada componente.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const schema = buildLocalBusinessSchema();

  return (
    <>
      {/* Primer elemento enfocable: salta la cabecera fija. */}
      <a
        href="#contenido"
        className="keyline bg-yellow text-on-color font-display sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:text-sm focus:tracking-[0.08em] focus:uppercase"
      >
        Saltar al contenido
      </a>

      <SiteHeader />

      <main id="contenido">{children}</main>

      <StickyBookBar />

      <script
        type="application/ld+json"
        // El objeto se construye desde data/business.ts, así que los datos
        // estructurados y la interfaz no pueden divergir.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
