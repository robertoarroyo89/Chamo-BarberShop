import { Booking } from "@/components/sections/Booking";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { Reviews } from "@/components/sections/Reviews";
import { Services } from "@/components/sections/Services";
import { Team } from "@/components/sections/Team";
import { Visit } from "@/components/sections/Visit";
import { Works } from "@/components/sections/Works";
import { Marquee } from "@/components/ui/Marquee";
import { MARQUEE_ITEMS } from "@/lib/constants";

/**
 * Regeneración incremental.
 *
 * La página sigue sirviéndose desde caché, pero el equipo ya no está escrito en
 * el código: viene de la base de datos. El panel llama a `revalidatePath("/")`
 * en cada cambio, así que un alta o una baja se ve al instante; este plazo es
 * solo la red de seguridad por si esa llamada se perdiera.
 */
export const revalidate = 3600;

/**
 * Página única.
 *
 * Componente de servidor. Solo declaran "use client" las piezas que de verdad
 * necesitan interacción: el formulario de reserva, el carrusel de opiniones, la
 * cabecera, el mapa y el interruptor de tema.
 *
 * La reserva va primero, pegada al héroe: es a lo que viene la mayoría, y su
 * propio formulario ya lista los servicios con precio, así que no necesita que
 * nada la preceda. Después la página se toma su tiempo para contar la casa:
 * carta completa → trabajos → quiénes somos → el equipo → opiniones → dónde
 * estamos.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee items={[...MARQUEE_ITEMS]} tone="yellow" />
      <Booking />
      <Services />
      <Works />
      <Manifesto />
      <Team />
      <Reviews />
      <Visit />

      {/* El cierre agrupa CTA y pie: el atajo flotante de reserva se oculta al
          entrar este bloque en pantalla, para no duplicar la acción. */}
      <div id="cierre">
        <FinalCta />
        <Footer />
      </div>
    </>
  );
}
