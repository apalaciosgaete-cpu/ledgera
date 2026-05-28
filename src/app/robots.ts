// src/app/robots.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
