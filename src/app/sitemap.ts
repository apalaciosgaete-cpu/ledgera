// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { blogArticles } from "@/modules/seo/blogArticles";
import { seoPageList } from "@/modules/seo/seoPageContent";

const baseUrl = "https://ledgera.cl";
const isProduction = process.env.NODE_ENV === "production";
const isMaintenanceMode = process.env.SITE_MAINTENANCE_MODE !== "false" && isProduction;

const staticPages = [
  "",
  "/como-funciona",
  "/planes",
  "/quienes-somos",
  "/preguntas",
  "/blog",
  "/terminos",
  "/privacidad",
  "/cookies",
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

  const now = new Date();

  const publicRoutes: MetadataRoute.Sitemap = [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
    ...seoPageList.map((page) => ({
      url: `${baseUrl}${page.path}`,
      lastModified: now,
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
