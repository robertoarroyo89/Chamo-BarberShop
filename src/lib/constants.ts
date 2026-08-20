/**
 * Secciones navegables.
 *
 * "Reservar" no está en la navegación porque tiene su propio botón destacado en
 * la cabecera y va nada más empezar la página.
 */
export const NAV_SECTIONS = [
  { id: "servicios", label: "Servicios" },
  { id: "trabajos", label: "Trabajos" },
  { id: "equipo", label: "Equipo" },
  { id: "opiniones", label: "Opiniones" },
  { id: "visitanos", label: "Visítanos" },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

/**
 * Secciones observadas para marcar el enlace activo. Incluye las navegables más
 * las que ocupan pantalla entre ellas, para que el indicador no se quede
 * "pegado" al pasar por el manifiesto o por la reserva.
 */
export const OBSERVED_SECTIONS = [
  "reservar",
  "servicios",
  "trabajos",
  "manifiesto",
  "equipo",
  "opiniones",
  "visitanos",
] as const;

/** Frases de la cinta bajo el héroe. Cortas, en mayúsculas, sin relleno. */
export const MARQUEE_ITEMS = [
  "Degradados",
  "Barba a navaja",
  "Corte niño",
  "Precio de barrio",
  "Burjassot",
  "Sin postureo",
] as const;
