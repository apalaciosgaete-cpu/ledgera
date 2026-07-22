// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { blogArticles } from "@/modules/seo/blogArticles";
import { seoPageList } from "@/modules/seo/seoPageContent";

const baseUrl = "https://ledgera.cl";
const isProduction = process.env.NODE_ENV === "production";
const isMaintenanceMode = process.env.SITE_MAINTENANCE_MODE === "true" && isProduction;

const staticPages = [
  "",
  "/como-funciona",
  "/planes",
  "/servicio-asistido",
  "/quienes-somos",
  "/preguntas",
  "/blog",
  "/terminos",
  "/privacidad",
  "/cookies",
  "/conciliacion-exchange-banco",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  if (isMaintenanceMode) {
    return [
      {
        url: `${baseUrl}/mantenimiento`,
        lastModified: new Date("2026-05-28"),
        changeFrequency: "daily",
        priority: 0.1,
      },
    ];
  }

  const publicContentUpdatedAt = new Date("2026-07-21");

  const publicRoutes: MetadataRoute.Sitemap = [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: publicContentUpdatedAt,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/servicio-asistido" ? 0.8 : 0.7,
    })),
    ...seoPageList.map((page) => ({
      url: `${baseUrl}${page.path}`,
      lastModified: publicContentUpdatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...blogArticles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: article.slug === "guia-impuestos-criptomonedas-chile" ? 0.85 : 0.65,
    })),
  ];

  return publicRoutes;
}
