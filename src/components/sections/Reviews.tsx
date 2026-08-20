"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Stars } from "@/components/ui/Stars";
import { business } from "@/data/business";
import { cn, formatDecimal, pad2 } from "@/lib/utils";

/**
 * Opiniones.
 *
 * El carril usa desplazamiento nativo con anclaje: en móvil se arrastra con el
 * dedo sin una línea de JavaScript, y en escritorio los botones lo mueven. Las
 * fichas vecinas quedan a medio ver, de modo que se intuya que hay más.
 *
 * Los textos son reseñas reales publicadas en la ficha de Google del negocio,
 * recortadas y firmadas con nombre e inicial. Ninguna está inventada, y el
 * enlace a Google permite comprobarlas.
 */
export function Reviews() {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const total = business.reviews.length;

  useEffect(() => {
    const node = track.current;
    if (!node) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const items = Array.from(node.children) as HTMLElement[];
        const centre = node.scrollLeft + node.clientWidth / 2;
        let closest = 0;
        let best = Number.POSITIVE_INFINITY;
        items.forEach((item, index) => {
          const distance = Math.abs(
            item.offsetLeft + item.offsetWidth / 2 - centre,
          );
          if (distance < best) {
            best = distance;
            closest = index;
          }
        });
        setActive(closest);
      });
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    const node = track.current;
    if (!node) return;
    const target = node.children[index] as HTMLElement | undefined;
    if (!target) return;
    node.scrollTo({
      left: target.offsetLeft - (node.clientWidth - target.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  return (
    <section id="opiniones" className="py-(--spacing-section)">
      <div className="container-page">
        {/* --- Cabecera con la nota global ------------------------------- */}
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="keyline bg-yellow text-on-color font-display inline-flex size-9 items-center justify-center text-sm leading-none"
              >
                {pad2(6)}
              </span>
              <span className="eyebrow text-ink-soft">Lo que dicen</span>
            </div>
            <h2 className="display-poster mt-5 text-[clamp(2.75rem,9vw,6rem)]">
              Opiniones
            </h2>
          </div>

          {/* Nota media, citando la fuente y enlazándola. */}
          <a
            href={business.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="keyline bg-paper-raised group inline-flex items-center gap-4 p-4 shadow-hard transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg"
            aria-label={`${formatDecimal(business.rating.value)} sobre 5 en ${business.rating.source} con ${business.rating.count} reseñas. Verlas en Google (se abre en una pestaña nueva)`}
          >
            <span className="font-display text-5xl leading-none">
              {formatDecimal(business.rating.value)}
            </span>
            <span className="block">
              <Stars value={business.rating.value} size={15} />
              <span className="text-ink-soft mt-1.5 block text-xs font-semibold">
                {business.rating.count} reseñas en {business.rating.source}
              </span>
            </span>
          </a>
        </div>

        {/* --- Carril ---------------------------------------------------- */}
        <div
          className="mt-12 lg:mt-16"
          role="group"
          aria-roledescription="carrusel"
          aria-label="Opiniones de clientes"
        >
          <ul
            ref={track}
            tabIndex={0}
            aria-label={`Opiniones, ${total} en total`}
            className="no-scrollbar -mx-[clamp(1.125rem,4.5vw,3.5rem)] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(1.125rem,4.5vw,3.5rem)] pt-1 pb-3"
          >
            {business.reviews.map((review, index) => (
              <li
                key={review.id}
                aria-roledescription="diapositiva"
                aria-label={`Opinión ${index + 1} de ${total}`}
                className={cn(
                  "w-[84vw] shrink-0 snap-center transition-opacity duration-500 sm:w-[58vw] lg:w-[38vw]",
                  index === active ? "opacity-100" : "opacity-55",
                )}
              >
                <blockquote className="keyline bg-paper-raised flex h-full flex-col p-6 shadow-hard sm:p-7">
                  {/* Comilla tipográfica de verdad, no un icono. */}
                  <span
                    aria-hidden="true"
                    className="font-display text-blue block text-6xl leading-[0.5] select-none"
                  >
                    &rdquo;
                  </span>

                  <p className="mt-5 flex-1 text-base leading-[1.55] sm:text-lg">
                    {review.quote}
                  </p>

                  <footer className="keyline-t mt-6 flex flex-wrap items-center justify-between gap-2 pt-4">
                    <cite className="font-display text-base not-italic">
                      {review.author}
                    </cite>
                    <span className="flex items-center gap-3">
                      <span className="text-ink-faint text-xs">
                        {review.when}
                      </span>
                      <Stars value={review.rating} size={12} />
                    </span>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>

          {/* --- Controles -------------------------------------------- */}
          <div className="mt-6 flex items-center justify-between gap-6">
            <p
              aria-live="polite"
              className="font-display text-sm tracking-[0.1em] tabular-nums"
            >
              {pad2(active + 1)}
              <span className="text-ink-faint"> / {pad2(total)}</span>
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => goTo(Math.max(0, active - 1))}
                disabled={active === 0}
                aria-label="Opinión anterior"
                className="keyline bg-paper-raised inline-flex size-11 items-center justify-center transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(Math.min(total - 1, active + 1))}
                disabled={active === total - 1}
                aria-label="Opinión siguiente"
                className="keyline bg-paper-raised inline-flex size-11 items-center justify-center transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
