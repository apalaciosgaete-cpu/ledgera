// src/app/robots.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";
const isProduction = process.env.NODE_ENV === "production";
const isMaintenanceMode = process.env.SITE_MAINTENANCE_MODE === "true" && isProduction;

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
          disallow: ["/api/", "/admin/", "/panel", "/configuracion/", "/checkout", "/login", "/register", "/onboarding", "/verify/", "/import/", "/importaciones", "/declaraciones", "/documentacion", "/obligaciones-tributarias"],
        },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
