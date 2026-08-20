"use client";

import { MapPin, Phone, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { NAV_SECTIONS } from "@/lib/constants";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Id del elemento que abre el menú, para devolverle el foco al cerrar. */
  triggerId: string;
}

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * Menú móvil a pantalla completa.
 *
 * Es un diálogo modal de verdad: bloquea el desplazamiento del fondo, atrapa el
 * tabulador, se cierra con Escape y devuelve el foco al botón que lo abrió. No
 * es un desplegable nativo disfrazado.
 */
export function MobileMenu({ open, onClose, triggerId }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const node = panel.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        document.getElementById(triggerId)?.focus();
        return;
      }

      if (event.key !== "Tab" || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, triggerId]);

  if (!open) return null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      className="panel-in bg-paper fixed inset-0 z-50 flex flex-col lg:hidden"
    >
      <div
        aria-hidden="true"
        className="halftone-loose pointer-events-none absolute inset-0 opacity-[0.09]"
      />

      <div className="keyline-b relative flex h-[4.5rem] shrink-0 items-center justify-between gap-3">
        <div className="container-page flex w-full items-center justify-between">
          <Wordmark compact />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                onClose();
                document.getElementById(triggerId)?.focus();
              }}
              aria-label="Cerrar menú"
              className="keyline bg-paper-raised text-ink inline-flex size-10 items-center justify-center"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Secciones"
        className="container-page relative flex-1 overflow-y-auto py-5"
      >
        <ul>
          {NAV_SECTIONS.map((section, index) => (
            <li
              key={section.id}
              className="panel-item-in keyline-b"
              style={{ ["--item-delay" as string]: `${0.05 + index * 0.05}s` }}
            >
              <a
                href={`#${section.id}`}
                onClick={onClose}
                className="flex items-baseline gap-4 py-4"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-ink-faint text-xs"
                >
                  0{index + 1}
                </span>
                <span className="display-poster text-[2.1rem]">
                  {section.label}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Image
            src="/logo/el-chamo.png"
            alt={business.name}
            width={1200}
            height={713}
            sizes="220px"
            className="mb-5 h-auto w-[13.5rem]"
          />
          <OpenStatus chip />
          <p className="text-ink-soft text-sm leading-relaxed">
            {business.address.street}
            <br />
            {business.address.postalCode} {business.address.city},{" "}
            {business.address.region}
          </p>
        </div>
      </nav>

      {/* Acciones fijas al pie: es lo que la gente viene a buscar. */}
      <div className="keyline-t bg-paper-sunken relative shrink-0">
        <div
          className="container-page pt-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <a
            href="#reservar"
            onClick={onClose}
            className="keyline bg-blue text-on-color font-display flex w-full items-center justify-center py-4 text-sm tracking-[0.08em] uppercase shadow-hard"
          >
            Pedir cita
          </a>

          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            <a
              href={business.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
              className="keyline bg-paper-raised flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase"
            >
              <WhatsAppGlyph size={15} />
              Chat
            </a>
            <a
              href={business.phone.href}
              onClick={onClose}
              aria-label={`Llamar al ${business.phone.display}`}
              className="keyline bg-paper-raised flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase"
            >
              <Phone aria-hidden="true" size={15} />
              Llamar
            </a>
            <a
              href={business.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              aria-label="Cómo llegar, abrir en Google Maps (se abre en una pestaña nueva)"
              className="keyline bg-paper-raised flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase"
            >
              <MapPin aria-hidden="true" size={15} />
              Ir
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
