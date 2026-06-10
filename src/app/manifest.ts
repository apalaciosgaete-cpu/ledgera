// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LEDGERA",
    short_name: "LEDGERA",
    description:
      "Importa tus movimientos de Buda, Binance o CSV. LEDGERA calcula tu ganancia y te dice qué poner en el Formulario 22 del SII.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071520",
    theme_color: "#071B28",
    orientation: "portrait-primary",
    lang: "es-CL",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
