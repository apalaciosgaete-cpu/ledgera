// src/app/robots.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";
const isProduction = process.env.NODE_ENV === "production";
const isMaintenanceMode = process.env.SITE_MAINTENANCE_MODE !== "false" && isProduction;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isMaintenanceMode
      ? {
          userAgent: "*",
          disallow: "/",
        }
      : {
          userAgent: "*",
          allow: "/",
        },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
