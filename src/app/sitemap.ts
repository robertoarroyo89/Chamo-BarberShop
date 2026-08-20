import type { MetadataRoute } from "next";
import { business } from "@/data/business";

/**
 * Una sola URL: es una web de una página. Las secciones son anclas y no deben
 * declararse como URLs independientes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: business.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
