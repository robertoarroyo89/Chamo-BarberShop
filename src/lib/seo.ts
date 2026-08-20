import type { Metadata } from "next";
import { business, openingHours, type WeekDay } from "@/data/business";
import { groupSchedule } from "@/lib/hours";

const SCHEMA_DAYS: Record<WeekDay, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const siteTitle = `${business.name} | Barbería en ${business.address.city}, ${business.address.region}`;

export const siteDescription =
  `Barbería en ${business.address.city} (${business.address.region}). ` +
  "Cortes de hombre, degradados y arreglo de barba desde 7 €. " +
  "Pide cita online en un minuto o escríbenos por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: {
    default: siteTitle,
    template: `%s | ${business.name}`,
  },
  description: siteDescription,
  applicationName: business.name,
  authors: [{ name: business.name }],
  creator: business.name,
  publisher: business.name,
  alternates: {
    canonical: "/",
  },
  category: "Barbería",
  // Palabras clave con intención local real. Sin repetición forzada.
  keywords: [
    "barbería Burjassot",
    "barbero Burjassot",
    "barbería en Burjassot",
    "corte de pelo hombre Burjassot",
    "degradado Burjassot",
    "fade Burjassot",
    "arreglo de barba Burjassot",
    "barbería Valencia",
    "El Chamo Barber Shop",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: business.url,
    siteName: business.name,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: true,
    address: true,
  },
};

/**
 * JSON-LD del negocio.
 *
 * Deliberadamente NO se incluyen:
 *   · aggregateRating ni review — la valoración (4,7 con 152 reseñas) es la de
 *     la ficha de Google del negocio. Se muestra en la interfaz citando la
 *     fuente y enlazándola, pero marcarla aquí como valoración propia del sitio
 *     incumple las directrices de datos estructurados de Google, que prohíben
 *     publicar como propias las reseñas de una plataforma externa.
 *
 * Sí se incluyen las coordenadas: provienen de la ficha del local en Google
 * Maps, así que apuntan al portal y no al centro del municipio.
 *
 * El horario se genera a partir de la misma fuente que la interfaz, de modo que
 * nunca puedan divergir.
 */
export function buildLocalBusinessSchema() {
  const openingHoursSpecification = groupSchedule(openingHours)
    .filter((group) => group.ranges.length > 0)
    .flatMap((group) =>
      group.ranges.map((range) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: group.days.map((day) => SCHEMA_DAYS[day]),
        opens: range.from,
        closes: range.to,
      })),
    );

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${business.url}#business`,
    name: business.name,
    description: siteDescription,
    url: business.url,
    image: `${business.url}/logo/el-chamo.png`,
    logo: `${business.url}/logo/el-chamo.png`,
    telephone: business.phone.e164,
    priceRange: "€",
    currenciesAccepted: "EUR",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    areaServed: {
      "@type": "City",
      name: business.address.city,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    },
    hasMap: business.mapsUrl,
    openingHoursSpecification,
    sameAs: [business.instagram.href, business.booksyUrl],
    makesOffer: business.services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
      },
      price: service.price,
      priceCurrency: "EUR",
    })),
  };
}
