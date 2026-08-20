"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { business } from "@/data/business";

const QUERY = `${business.address.street}, ${business.address.postalCode} ${business.address.city}, ${business.address.region}`;
const EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(QUERY)}&z=17&output=embed`;

/**
 * Mapa que se carga al pulsar.
 *
 * Dos razones para no incrustarlo directamente:
 *   · rendimiento — un iframe de Google Maps arrastra varios cientos de kB y
 *     decenas de peticiones que nadie necesita para saber dónde está el local;
 *   · privacidad — deja cookies de terceros en cuanto se carga. Al exigir un
 *     gesto explícito, la página no instala nada por su cuenta y no hace falta
 *     un aviso de cookies.
 *
 * Quien solo quiera las indicaciones tiene el botón "Cómo llegar", que no carga
 * nada de Google.
 */
export function LazyMap() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div className="keyline bg-paper-raised relative aspect-4/3 w-full overflow-hidden">
        <iframe
          title={`Mapa de la ubicación de ${business.name} en ${business.address.city}`}
          src={EMBED_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="keyline bg-paper-raised group relative flex aspect-4/3 w-full flex-col items-center justify-center gap-4 overflow-hidden shadow-hard transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard-lg"
    >
      {/* Trama de puntos: sugiere un plano sin fingir ser uno. */}
      <span
        aria-hidden="true"
        className="halftone pointer-events-none absolute inset-0 opacity-[0.13] transition-opacity duration-500 group-hover:opacity-20"
      />

      <span
        aria-hidden="true"
        className="keyline bg-red text-on-color relative grid size-14 place-items-center"
      >
        <MapPin size={24} />
      </span>

      <span className="relative px-6 text-center">
        <span className="font-display block text-lg">Ver el mapa</span>
        <span className="text-ink-soft mt-1 block text-xs leading-relaxed">
          Se carga al pulsar, para no instalar cookies de Google por defecto
        </span>
      </span>
    </button>
  );
}
