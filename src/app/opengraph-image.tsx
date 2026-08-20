import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { business } from "@/data/business";
import { formatDecimal } from "@/lib/utils";

/**
 * Imagen de previsualización para WhatsApp, Instagram y Google.
 *
 * Es lo primero que ve mucha gente, porque a este negocio le llega el tráfico
 * por enlaces compartidos. Se genera una sola vez al compilar (la ruta es
 * estática) y se sirve como archivo desde el CDN.
 *
 * Mismo lenguaje que la web: papel crema, filete negro y el rótulo de la casa
 * haciendo de tipografía.
 */

export const alt = `${business.name} — barbería en ${business.address.city}, ${business.address.region}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f5f2ea";
const INK = "#141210";
const BLUE = "#1b9fd8";
const YELLOW = "#ffc61e";
const RED_INK = "#c9251d";

export default async function OpengraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public", "logo", "el-chamo.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        // El filete negro del sistema, haciendo de marco de la pieza.
        border: `14px solid ${INK}`,
      }}
    >
      {/* --- Franja superior ------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: YELLOW,
          borderBottom: `6px solid ${INK}`,
          padding: "14px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: 5,
            color: INK,
            textTransform: "uppercase",
          }}
        >
          {`Barbería en ${business.address.city} · ${business.address.region}`}
        </div>
        <div
          style={{ display: "flex", fontSize: 23, fontWeight: 700, color: INK }}
        >
          {`${formatDecimal(business.rating.value)} / 5 · ${business.rating.count} reseñas`}
        </div>
      </div>

      {/* --- Cuerpo --------------------------------------------------- */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          padding: "0 44px",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={560}
          height={333}
          style={{ objectFit: "contain" }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: 34,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.02,
              letterSpacing: -1,
            }}
          >
            Entras, te sientas
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 800,
              color: RED_INK,
              lineHeight: 1.14,
              letterSpacing: -1,
            }}
          >
            y sales nuevo.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#4a453e",
              marginTop: 16,
            }}
          >
            Degradados · Barba · Corte niño
          </div>
        </div>
      </div>

      {/* --- Franja inferior ------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: BLUE,
          borderTop: `6px solid ${INK}`,
          padding: "18px 40px",
        }}
      >
        <div
          style={{ display: "flex", fontSize: 27, fontWeight: 700, color: INK }}
        >
          {`${business.address.street} · ${business.address.postalCode} ${business.address.city}`}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 800,
            color: PAPER,
            backgroundColor: INK,
            padding: "10px 22px",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Pide cita
        </div>
      </div>
    </div>,
    size,
  );
}
