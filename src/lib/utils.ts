/** Une clases condicionalmente sin necesidad de dependencias externas. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** 12 → "12 €". Formato español: espacio fino antes del símbolo. */
export function formatPrice(price: number): string {
  const value = Number.isInteger(price)
    ? String(price)
    : price.toFixed(2).replace(".", ",");
  return `${value} €`;
}

/** 4.8 → "4,8" (coma decimal). */
export function formatDecimal(value: number): string {
  return String(value).replace(".", ",");
}

/** Dos dígitos para la numeración editorial de secciones: 1 → "01". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
