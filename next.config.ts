import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No hace falta anunciar el framework en cada respuesta.
  poweredByHeader: false,

  // Las fotografías son locales, así que no se autoriza ningún dominio remoto.
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 solo acepta valores de `quality` declarados aquí. 82 es para las
    // fotos de la galería: el detalle del pelo es justo lo que hay que ver, y
    // al 75 por defecto empieza a empastarse.
    qualities: [75, 82],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Las fotos y el rótulo llevan nombre estable: se pueden cachear largo.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
