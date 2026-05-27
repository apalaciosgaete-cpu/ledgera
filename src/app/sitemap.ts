// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { blogArticles } from "@/modules/seo/blogArticles";

const baseUrl = "https://ledgera.cl";

const publicRoutes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/como-funciona",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/planes",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/impuestos-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/como-declarar-crypto-en-chile",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/conciliacion-binance-banco",
    changeFrequency: "monthly",
    priority: 0.88,
  },
  {
    path: "/contador-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.84,
  },
  {
    path: "/binance-impuestos-chile",
    changeFrequency: "monthly",
    priority: 0.82,
  },
  {
    path: "/quienes-somos",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/preguntas",
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/blog",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/terminos",
    changeFrequency: "yearly",
    priority: 0.25,
  },
  {
    path: "/privacidad",
    changeFrequency: "yearly",
    priority: 0.25,
  },
  {
    path: "/cookies",
    changeFrequency: "yearly",
    priority: 0.25,
  },
] as const;

const blogRoutes = blogArticles.map((article) => ({
  path: `/blog/${article.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [...publicRoutes, ...blogRoutes].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
