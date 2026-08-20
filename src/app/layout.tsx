import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { metadata as siteMetadata } from "@/lib/seo";
import { THEME_KEY } from "@/lib/themeStore";
import "./globals.css";

/**
 * Dos familias, ninguna más.
 *
 * Anton para los titulares: es una condensada muy pesada, de cartel, que hace
 * juego con las letras infladas del rótulo. Archivo, una grotesca de trabajo, se
 * encarga de la interfaz y el texto corrido. Las dos se sirven autoalojadas
 * desde el propio dominio con `next/font`: sin peticiones a Google y sin salto
 * de fuente.
 */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  // El color de la barra del navegador acompaña al tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Aplica el tema guardado ANTES del primer pintado.
 *
 * Va en línea y de forma síncrona a propósito: si esperara a que React
 * hidratara, quien tenga elegido el tema oscuro vería un fogonazo del claro.
 * El tema de casa es el claro, así que sin preferencia guardada no se toca nada.
 */
const THEME_SCRIPT = `
(function(){
  try {
    var saved = localStorage.getItem('${THEME_KEY}');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${archivo.variable}`}
      // El script de arriba escribe `data-theme` en este mismo elemento antes
      // de que React hidrate, así que el HTML del servidor y el DOM del cliente
      // difieren en ese atributo a propósito. Sin esto, React avisa de un
      // desajuste de hidratación que no es un error sino el mecanismo que evita
      // el destello de tema. Solo afecta a los atributos de <html>.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
