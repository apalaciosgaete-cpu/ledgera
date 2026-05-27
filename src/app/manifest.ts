// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LEDGERA",
    short_name: "LEDGERA",
    description:
      "Sistema financiero-tributario para ordenar movimientos crypto, conciliación banco-exchange y base tributaria trazable en Chile.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071520",
    theme_color: "#0A1F2E",
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
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
