// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";

const routes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/quienes-somos",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/como-funciona",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/planes",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/preguntas",
    changeFrequency: "monthly",
    priority: 0.7,
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
  {
    path: "/impuestos-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/binance-impuestos-chile",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/como-declarar-crypto-en-chile",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/conciliacion-binance-banco",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/contador-crypto-chile",
    changeFrequency: "monthly",
    priority: 0.8,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
