// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { blogArticles } from "@/modules/seo/blogArticles";

const baseUrl = "https://ledgera.cl";
const siteUpdatedAt = "2026-05-27";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/como-funciona",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/planes",
    changeFrequency: "weekly",
    priority: 0.85,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/impuestos-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/como-declarar-crypto-en-chile",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/conciliacion-binance-banco",
    changeFrequency: "monthly",
    priority: 0.88,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/contador-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.84,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/binance-impuestos-chile",
    changeFrequency: "monthly",
    priority: 0.82,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/quienes-somos",
    changeFrequency: "monthly",
    priority: 0.75,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/preguntas",
    changeFrequency: "monthly",
    priority: 0.72,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/blog",
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/terminos",
    changeFrequency: "yearly",
    priority: 0.25,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/privacidad",
    changeFrequency: "yearly",
    priority: 0.25,
    lastModified: siteUpdatedAt,
  },
  {
    path: "/cookies",
    changeFrequency: "yearly",
    priority: 0.25,
    lastModified: siteUpdatedAt,
  },
] as const;

const blogRoutes = blogArticles.map((article) => ({
  path: `/blog/${article.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.7,
  lastModified: article.updatedAt,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  return [...publicRoutes, ...blogRoutes].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
