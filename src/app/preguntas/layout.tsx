// src/app/preguntas/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";
const title = "Preguntas frecuentes | Impuestos crypto, conciliación y LEDGERA";
const description =
  "Respuestas sobre impuestos crypto en Chile, importaciones, conciliación banco-exchange, portafolio, reportes y uso de LEDGERA.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/preguntas`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/preguntas`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Preguntas frecuentes LEDGERA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function PreguntasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
