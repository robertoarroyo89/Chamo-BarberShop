export type Theme = "light" | "dark";

export const THEME_KEY = "el-chamo-tema";

/**
 * El tema, como almacén externo.
 *
 * La fuente de la verdad es el atributo `data-theme` del `<html>`, que ya deja
 * puesto el script en línea del layout antes del primer pintado. React no debe
 * duplicar ese dato en un estado propio: se limita a leerlo con
 * `useSyncExternalStore`, que es la vía prevista para valores que viven fuera
 * de React.
 *
 * Así se evitan las dos trampas: el destello de tema al hidratar y el
 * `setState` dentro de un efecto para "ponerse al día" con el DOM.
 */

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Instantánea del cliente. Devuelve un primitivo, así que es estable. */
export function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * En el servidor no hay tema conocido: el interruptor se pinta sin estado y lo
 * adopta al hidratar. Devolver null evita cualquier desajuste.
 */
export function getServerSnapshot(): null {
  return null;
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Modo privado o almacenamiento bloqueado: el cambio vale para esta visita
    // y no se recuerda. No es motivo para romper nada.
  }
  listeners.forEach((listener) => listener());
}
