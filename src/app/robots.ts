// src/app/robots.ts
import type { MetadataRoute } from "next";

const baseUrl = "https://ledgera.cl";

export default function robots(): MetadataRoute.Robots {
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
          "/import",
          "/configuracion",
          "/seguridad",
          "/suscripcion",
          "/login",
          "/register",
          "/verify",
          "/bienvenida",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
