// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/mantenimiento`,
      lastModified: new Date("2026-05-28"),
      changeFrequency: "daily",
      priority: 0.1,
    },
  ];
}
