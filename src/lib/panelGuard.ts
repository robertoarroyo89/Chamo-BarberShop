import { hasSession, isAdminConfigured } from "@/lib/adminAuth";

export type PanelState = "sin-configurar" | "anonimo" | "ok";

/**
 * Estado de acceso al panel.
 *
 * Lo llaman TODAS las páginas del panel antes de consultar nada. Se comprueba
 * en cada página y no solo en el marco compartido a propósito: en React Server
 * Components el código de la página se ejecuta aunque el marco decida no
 * mostrarla, así que un guardián puesto solo arriba dejaría que las consultas
 * a la base de datos se hicieran igualmente.
 */
export async function panelState(): Promise<PanelState> {
  if (!isAdminConfigured()) return "sin-configurar";
  if (!(await hasSession())) return "anonimo";
  return "ok";
}
