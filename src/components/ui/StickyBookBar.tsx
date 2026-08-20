"use client";

import { useEffect, useState } from "react";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";

/**
 * Atajo de reserva persistente.
 *
 * En móvil es una barra inferior —el gesto natural con el pulgar— y en
 * escritorio una pieza discreta abajo a la derecha. No es la burbuja verde de
 * siempre: usa el mismo lenguaje de filetes y sombra dura que el resto.
 *
 * Aparece al dejar atrás el héroe y desaparece al llegar al cierre, donde ya
 * hay botones a tamaño completo: no tiene sentido tapar contenido para repetir
 * la misma acción.
 *
 * Las dos piezas están siempre en el DOM y se muestran u ocultan con una
 * transición de CSS. Es una mejora progresiva: si por lo que sea el observador
 * no llega a dispararse, lo único que pasa es que no aparece el atajo — la
 * cabecera y la sección de reserva siguen ahí.
 */
export function StickyBookBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const closing = document.getElementById("cierre");

    let pastHero = false;
    let atClosing = false;
    const sync = () => setVisible(pastHero && !atClosing);

    const observers: IntersectionObserver[] = [];

    if (hero) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          pastHero = !entry.isIntersecting;
          sync();
        },
        { threshold: 0, rootMargin: "-45% 0px 0px 0px" },
      );
      observer.observe(hero);
      observers.push(observer);
    }

    if (closing) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          atClosing = entry.isIntersecting;
          sync();
        },
        { threshold: 0 },
      );
      observer.observe(closing);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const shown = visible ? "true" : "false";

  return (
    <>
      {/* --- Móvil: barra inferior ------------------------------------- */}
      <div
        data-visible={shown}
        // Fuera de pantalla no debe ser alcanzable con el tabulador.
        {...(visible ? {} : { inert: true })}
        className="dock dock-bottom keyline-t bg-paper fixed inset-x-0 bottom-0 z-30 sm:hidden"
      >
        <div
          className="flex items-stretch gap-2.5 px-4 pt-3"
          // Respeta la barra inferior de Safari en iOS.
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <a
            href="#reservar"
            className="keyline bg-blue text-on-color font-display flex flex-1 items-center justify-center py-3.5 text-sm tracking-[0.08em] uppercase"
          >
            Pedir cita
          </a>
          <a
            href={business.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
            className="keyline bg-paper-raised text-ink grid w-14 shrink-0 place-items-center"
          >
            <WhatsAppGlyph size={20} />
          </a>
        </div>
      </div>

      {/* --- Escritorio: pieza flotante -------------------------------- */}
      <div
        data-visible={shown}
        {...(visible ? {} : { inert: true })}
        className="dock dock-corner fixed right-6 bottom-6 z-30 hidden flex-col items-end gap-2 sm:flex"
      >
        <a
          href={business.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
          className="keyline bg-paper-raised text-ink grid size-11 place-items-center shadow-hard transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg"
        >
          <WhatsAppGlyph size={19} />
        </a>
        <a
          href="#reservar"
          className="keyline bg-blue text-on-color font-display px-5 py-3 text-sm tracking-[0.08em] uppercase shadow-hard transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg"
        >
          Pedir cita
        </a>
      </div>
    </>
  );
}
