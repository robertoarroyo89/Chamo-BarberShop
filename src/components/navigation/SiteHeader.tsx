"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { business } from "@/data/business";
import { NAV_SECTIONS, OBSERVED_SECTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TRIGGER_ID = "abrir-menu";

/** Marca la sección visible sin escuchar el evento de scroll. */
function useActiveSection() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const nodes = OBSERVED_SECTIONS.map((id) =>
      document.getElementById(id),
    ).filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-14% 0px -66% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return active;
}

/** Detecta si se ha dejado atrás la cabecera, para compactarla. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Un centinela invisible evita por completo escuchar el scroll.
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none;";
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return scrolled;
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();
  const scrolled = useScrolled();

  return (
    <>
      <header
        className={cn(
          "bg-paper fixed inset-x-0 top-0 z-40 border-b-2 transition-colors duration-300",
          // El filete inferior solo aparece al despegar: en reposo la cabecera
          // se funde con el papel del héroe.
          scrolled ? "border-ink" : "border-transparent",
        )}
      >
        <div
          className={cn(
            "container-page flex items-center justify-between gap-4 transition-[height] duration-300",
            scrolled ? "h-14" : "h-[4.5rem]",
          )}
        >
          {/* --- Rótulo ---------------------------------------------------- */}
          <a
            href="#inicio"
            aria-label={`${business.name}, ir al inicio`}
            className="flex shrink-0 items-center"
          >
            <Wordmark compact={scrolled} />
          </a>

          {/* --- Navegación de escritorio --------------------------------- */}
          <nav aria-label="Navegación principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_SECTIONS.map((section) => {
                const isActive = active === section.id;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "font-display block px-3 py-2 text-sm tracking-[0.08em] uppercase transition-colors duration-200",
                        // La sección activa se marca con el amarillo del rótulo,
                        // más un filete: no depende solo del color.
                        isActive
                          ? "bg-yellow text-on-color keyline"
                          : "text-ink-soft hover:text-ink border-2 border-transparent",
                      )}
                    >
                      {section.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* --- Acciones -------------------------------------------------- */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle className={scrolled ? "size-9" : "size-10"} />

            <a
              href="#reservar"
              className="keyline bg-blue text-on-color font-display hidden px-5 py-2.5 text-sm tracking-[0.08em] uppercase shadow-hard transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:inline-block"
            >
              Pedir cita
            </a>

            <button
              id={TRIGGER_ID}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-label="Abrir menú de navegación"
              className="keyline bg-paper-raised text-ink inline-flex size-10 items-center justify-center transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard lg:hidden"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        triggerId={TRIGGER_ID}
      />
    </>
  );
}
