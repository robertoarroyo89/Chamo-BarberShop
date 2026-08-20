import type { MetadataRoute } from "next";
import { business } from "@/data/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El panel de la barbería lleva datos de clientes: fuera del índice.
        disallow: ["/agenda", "/api/"],
      },
    ],
    sitemap: `${business.url}/sitemap.xml`,
    host: business.url,
  };
}
