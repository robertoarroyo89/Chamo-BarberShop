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
 * Página única.
 *
 * Componente de servidor. Solo declaran "use client" las piezas que de verdad
 * necesitan interacción: el formulario de reserva, el carrusel de opiniones, la
 * cabecera, el mapa y el interruptor de tema.
 *
 * El orden cuenta una historia: quiénes somos → qué cuesta → qué hacemos →
 * quién lo hace → reservar → qué dicen → dónde estamos.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee items={[...MARQUEE_ITEMS]} tone="yellow" />
      <Manifesto />
      <Services />
      <Works />
      <Team />
      <Booking />
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
