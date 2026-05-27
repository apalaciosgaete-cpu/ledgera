// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ledgera.cl";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/quienes-somos",
          "/como-funciona",
          "/planes",
          "/preguntas",
          "/blog",
          "/terminos",
          "/privacidad",
          "/cookies",
          "/impuestos-crypto-chile",
          "/binance-impuestos-chile",
          "/como-declarar-crypto-en-chile",
          "/conciliacion-binance-banco",
          "/contador-crypto-chile",
        ],
        disallow: [
          "/api",
          "/admin",
          "/dashboard",
          "/importaciones",
          "/portfolio",
          "/portafolio",
          "/movements",
          "/tax",
          "/bank",
          "/configuracion",
          "/seguridad",
          "/suscripcion",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
