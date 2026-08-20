/**
 * FUENTE ÚNICA DE VERDAD — El Chamo Barber Shop
 * ---------------------------------------------------------------------------
 * Todos los datos del negocio (teléfono, dirección, precios, horario, enlaces,
 * equipo) viven AQUÍ. Ningún componente debe repetir estos valores en su JSX.
 *
 * Procedencia de los datos:
 *   · Ficha de Booksy gestionada por el propio negocio (dirección, servicios
 *     con duración, equipo, horario).
 *   · Ficha de Google Maps del local (coordenadas, valoración y reseñas).
 *   · Web anterior (teléfono, WhatsApp, Instagram, fotografías).
 *
 * Lo marcado con "VERIFICAR" debe confirmarse con la barbería antes de
 * publicar. Ver README.md → "Datos por confirmar".
 */

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo (getDay de JS)

export interface TimeRange {
  from: string; // "HH:MM" en 24 h
  to: string;
}

export interface DaySchedule {
  day: WeekDay;
  label: string;
  short: string;
  /** Tramos de apertura. Array vacío = cerrado. */
  ranges: TimeRange[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Duración en minutos, tal y como está configurada en Booksy. */
  duration: number;
  note?: string;
  featured: boolean;
  /** Color de marca con el que se pinta la ficha. */
  accent: "blue" | "yellow" | "red";
}

export interface Barber {
  id: string;
  name: string;
  /** Iniciales para el selector de barbero. */
  initials: string;
  accent: "blue" | "yellow" | "red";
}

export interface Review {
  id: string;
  author: string;
  quote: string;
  rating: number;
  /** Cuándo se publicó, en las palabras de Google. */
  when: string;
}

export interface Photo {
  id: string;
  src: string;
  alt: string;
  label?: string;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// HORARIO — editar SOLO aquí.
// Lo consumen: sección Horario, pie, datos estructurados, estado "abierto
// ahora" y el cálculo de huecos libres para reservar.
// ---------------------------------------------------------------------------

const WEEKDAY_RANGES: TimeRange[] = [
  { from: "09:30", to: "14:00" },
  { from: "16:00", to: "20:00" },
];

/**
 * VERIFICAR HORARIO DEL SÁBADO ANTES DE PRODUCCIÓN.
 *
 * La web anterior se contradecía consigo misma: su contenido visible daba el
 * sábado igual que el resto de la semana, mientras su JSON-LD lo cerraba a las
 * 18:00. Booksy muestra el mismo horario que en día laborable.
 *
 * Se toma el horario completo. Para corregirlo basta editar este array.
 */
const SATURDAY_RANGES: TimeRange[] = [
  { from: "09:30", to: "14:00" },
  { from: "16:00", to: "20:00" },
];

export const openingHours: DaySchedule[] = [
  { day: 1, label: "Lunes", short: "Lun", ranges: WEEKDAY_RANGES },
  { day: 2, label: "Martes", short: "Mar", ranges: WEEKDAY_RANGES },
  { day: 3, label: "Miércoles", short: "Mié", ranges: WEEKDAY_RANGES },
  { day: 4, label: "Jueves", short: "Jue", ranges: WEEKDAY_RANGES },
  { day: 5, label: "Viernes", short: "Vie", ranges: WEEKDAY_RANGES },
  { day: 6, label: "Sábado", short: "Sáb", ranges: SATURDAY_RANGES },
  { day: 0, label: "Domingo", short: "Dom", ranges: [] },
];

// ---------------------------------------------------------------------------
// SERVICIOS — precios y duraciones tomados de la ficha de Booksy del negocio.
// Son exactamente los cinco que la barbería tiene publicados. El degradado no
// va aparte a propósito: está dentro de "Corte caballero" y al mismo precio, así
// que listarlo dos veces solo marea a quien elige.
// ---------------------------------------------------------------------------

export const services: Service[] = [
  {
    id: "corte",
    name: "Corte caballero",
    description:
      "Degradado o fade, tijera, lavado y acabado. Del cero al largo que pidas.",
    price: 12,
    duration: 30,
    note: "El más pedido",
    featured: true,
    accent: "blue",
  },
  {
    id: "barba",
    name: "Barba",
    description: "Perfilado a navaja, toalla caliente y aceite.",
    price: 7,
    duration: 30,
    featured: false,
    accent: "red",
  },
  {
    id: "pelo-barba",
    name: "Pelo y barba",
    description: "El pack completo: corte y barba perfilada.",
    price: 17,
    duration: 30,
    note: "Pack",
    featured: true,
    accent: "yellow",
  },
  {
    id: "nino",
    name: "Corte niño",
    description: "Sin prisas y con paciencia. Salen encantados.",
    price: 10,
    duration: 30,
    note: "Hasta 12 años",
    featured: false,
    accent: "blue",
  },
  {
    id: "jubilado",
    name: "Corte jubilado",
    description: "Precio especial para clientes jubilados.",
    price: 8,
    duration: 30,
    featured: false,
    accent: "red",
  },
];

// ---------------------------------------------------------------------------
// EQUIPO — nombres tal y como figuran en la ficha de Booksy del negocio.
//
// Nota: hay fotos reales de los barberos en /public/images/local, pero no está
// confirmado qué cara corresponde a cada nombre, así que el selector usa
// iniciales en lugar de retratos. Ver README.md.
// ---------------------------------------------------------------------------

export const barbers: Barber[] = [
  { id: "andre", name: "Andre", initials: "AN", accent: "blue" },
  { id: "nacho", name: "Nacho", initials: "NA", accent: "yellow" },
  { id: "antonio", name: "Antonio", initials: "AO", accent: "red" },
];

/** Opción "me da igual quién": la barbería asigna. */
export const ANY_BARBER = {
  id: "cualquiera",
  name: "El primero que quede libre",
} as const;

// ---------------------------------------------------------------------------
// RESERVAS
// ---------------------------------------------------------------------------

export const booking = {
  /** Rejilla de huecos, en minutos. Coincide con la duración en Booksy. */
  slotMinutes: 30,
  /** No se ofrecen huecos con menos de este margen desde ahora. */
  minNoticeMinutes: 60,
  /** Cuántos días vista se pueden reservar. */
  horizonDays: 21,
} as const;

// ---------------------------------------------------------------------------
// OPINIONES — reseñas reales publicadas en la ficha de Google del negocio.
// Se recortan y se firma con nombre e inicial. No se ha inventado ninguna.
// ---------------------------------------------------------------------------

export const reviews: Review[] = [
  {
    id: "juanjose-o",
    author: "Juanjosé O.",
    quote:
      "Desde que entras te reciben con buen rollo y te hacen sentir como en casa. Se toman su tiempo para dejarte el corte perfecto, sin prisas y cuidando cada detalle.",
    rating: 5,
    when: "Hace 4 meses",
  },
  {
    id: "maikol-f",
    author: "Maikol de F.",
    quote:
      "No hay nada como encontrar una barbería que realmente entienda lo que uno busca y cuide los detalles. La mejor de Burjassot.",
    rating: 5,
    when: "Hace 4 meses",
  },
  {
    id: "sebastian-c",
    author: "Sebastián C.",
    quote:
      "Muy buen ambiente y un corte genial. He ido sin tener muy claro qué quería y El Chamo ha hecho un trabajo excelente. Recomendado 100%.",
    rating: 5,
    when: "Hace 4 meses",
  },
  {
    id: "alvaro-g",
    author: "Álvaro G.",
    quote:
      "De 10, unos chicos muy majos y el corte de pelo exactamente como pedí y quería.",
    rating: 5,
    when: "Hace 5 meses",
  },
  {
    id: "sheila-r",
    author: "Sheila R.",
    quote:
      "Mi hijo se cortó el pelo y me dijo que lo trataron súper bien. Son muy amables y hay buen ambiente.",
    rating: 5,
    when: "Hace un mes",
  },
];

// ---------------------------------------------------------------------------
// FOTOGRAFÍA — todas las imágenes son reales del negocio, recuperadas de su
// web anterior y de su ficha de Booksy. Para añadir más: deja el archivo en
// /public/images/trabajos y añade una entrada aquí. Ver README.md.
// ---------------------------------------------------------------------------

export const works: Photo[] = [
  {
    id: "raya-marcada",
    src: "/images/trabajos/raya-marcada-fade.jpg",
    alt: "Corte de hombre con raya marcada y degradado medio hecho en El Chamo Barber Shop, Burjassot",
    label: "Raya marcada",
    width: 1200,
    height: 1600,
  },
  {
    id: "texturizado",
    src: "/images/trabajos/texturizado-fade-barba.jpg",
    alt: "Corte texturizado con degradado y barba perfilada hecho en El Chamo Barber Shop, Burjassot",
    label: "Texturizado",
    width: 1200,
    height: 1600,
  },
  {
    id: "fade-medio",
    src: "/images/trabajos/fade-medio-barba.jpg",
    alt: "Degradado medio con barba arreglada hecho en El Chamo Barber Shop, Burjassot",
    label: "Fade medio",
    width: 1400,
    height: 1867,
  },
  {
    id: "corto-barba",
    src: "/images/trabajos/corto-barba-completa.jpg",
    alt: "Corte corto al aire con degradado y barba completa hecho en El Chamo Barber Shop, Burjassot",
    label: "Corto y barba",
    width: 1200,
    height: 1600,
  },
  {
    id: "fade-bajo",
    src: "/images/trabajos/fade-bajo-raya.jpg",
    alt: "Degradado bajo con raya marcada al lado hecho en El Chamo Barber Shop, Burjassot",
    label: "Fade bajo",
    width: 1200,
    height: 1600,
  },
];

/** Fotos del local y del equipo trabajando. */
export const shopPhotos = {
  storefront: {
    id: "fachada",
    src: "/images/local/fachada.jpg",
    alt: "Fachada de El Chamo Barber Shop en la Avenida de Maria Ros, Burjassot, con su toldo rotulado y el poste de barbero",
    width: 1017,
    height: 1013,
  },
  working: {
    id: "trabajando",
    src: "/images/local/trabajando.jpg",
    alt: "Barbero de El Chamo cortando el pelo a un cliente en el local de Burjassot",
    width: 1125,
    height: 2266,
  },
  thumbsUp: {
    id: "barbero-trabajando",
    src: "/images/local/barbero-trabajando.jpg",
    alt: "Barbero de El Chamo peinando a un cliente en el interior de la barbería",
    width: 1000,
    height: 1000,
  },
} satisfies Record<string, Photo>;

// ---------------------------------------------------------------------------
// NEGOCIO
// ---------------------------------------------------------------------------

const PHONE_E164 = "+34642176247";

/** Mensaje que se abre ya escrito en WhatsApp. Editable libremente. */
const WHATSAPP_MESSAGE = "Hola, quería reservar cita en El Chamo Barber Shop.";

export const business = {
  name: "El Chamo Barber Shop",
  shortName: "El Chamo",

  /**
   * Dominio público.
   *
   * De aquí salen el canónico, el sitemap, los datos estructurados y la imagen
   * que se ve al compartir por WhatsApp. Cambiar al conectar el dominio propio.
   */
  url: "https://chamo-barber-shop.vercel.app",

  // --- Dirección -----------------------------------------------------------
  // Se usa la grafía de la ficha de Booksy, que gestiona el propio negocio:
  // "Av. de Maria Ros, 2". La web anterior ponía "C/ Maria Ros, 2".
  address: {
    street: "Av. de Maria Ros, 2",
    city: "Burjassot",
    region: "Valencia",
    postalCode: "46100",
    country: "ES",
  },

  /** Coordenadas del local, tomadas de su ficha de Google Maps. */
  geo: { lat: 39.5131869, lng: -0.4121984 },

  // --- Contacto ------------------------------------------------------------
  phone: {
    e164: PHONE_E164,
    display: "642 176 247",
    href: `tel:${PHONE_E164}`,
  },

  whatsapp: {
    /** Número sin "+" ni espacios, como exige wa.me. */
    number: "34642176247",
    message: WHATSAPP_MESSAGE,
    get href() {
      return `https://wa.me/${this.number}?text=${encodeURIComponent(this.message)}`;
    },
  },

  instagram: {
    handle: "@el_chamo_barber_shop_",
    href: "https://instagram.com/el_chamo_barber_shop_",
  },

  /**
   * Indicaciones. Se usa la URL oficial y documentada de Google Maps
   * (`/maps/dir/?api=1`) en lugar de un enlace con identificador interno:
   * funciona en móvil y escritorio y no depende de parámetros opacos.
   */
  mapsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Av.+de+Maria+Ros%2C+2%2C+46100+Burjassot%2C+Valencia",

  /** La ficha del local, para ver las reseñas completas. */
  googleReviewsUrl:
    "https://www.google.com/maps/search/?api=1&query=El+Chamo+Barber+Shop%2C+Av.+de+Maria+Ros%2C+2%2C+Burjassot",

  /**
   * Ficha de Booksy. El negocio la tiene activa.
   *
   * IMPORTANTE: esta web incluye su propia agenda (ver lib/booking). Si Booksy
   * sigue aceptando reservas al mismo tiempo, los dos calendarios no se ven
   * entre sí y habrá solapamientos. Ver README.md → "Reservas".
   */
  booksyUrl:
    "https://booksy.com/es-es/180524_el-chamo-barber-shop_barberia_57393_burjassot",

  // --- Valoración ----------------------------------------------------------
  /**
   * Datos reales de la ficha de Google del negocio.
   *
   * Se muestran en la interfaz citando la fuente y enlazando a Google, pero NO
   * se publican como `aggregateRating` en los datos estructurados: marcar como
   * propia la valoración de una plataforma externa incumple las directrices de
   * Google. Ver lib/seo.ts.
   */
  rating: {
    value: 4.7,
    count: 152,
    source: "Google",
  },

  /** Años de oficio, tal como los declaraba la web anterior. VERIFICAR. */
  yearsExperience: 8,

  /** Comodidades declaradas en la ficha de Booksy. */
  amenities: [
    "Se aceptan tarjetas",
    "Acceso sin escalones",
    "Adaptado para niños",
    "Wi-Fi",
  ],

  openingHours,
  services,
  barbers,
  reviews,
  works,
  shopPhotos,
  booking,
} as const;

export type Business = typeof business;
