import { business } from "@/data/business";

/**
 * Construye el enlace de WhatsApp con el mensaje ya escrito.
 *
 * El texto base se edita en `data/business.ts`. Si se indica un servicio, se
 * añade al final para que la barbería reciba la consulta ya cualificada.
 */
export function whatsappHref(service?: string): string {
  const message = service
    ? `${business.whatsapp.message} Me interesa: ${service}.`
    : business.whatsapp.message;

  return `https://wa.me/${business.whatsapp.number}?text=${encodeURIComponent(message)}`;
}
