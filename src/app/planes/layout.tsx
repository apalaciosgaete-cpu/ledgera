// src/app/planes/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";
const title = "Planes Gratuito, Personal y Profesional";
const description =
  "Compara los planes Gratuito, Personal y Profesional de LEDGERA para ordenar operaciones cripto, conciliar movimientos y generar respaldos trazables en Chile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/planes`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/planes`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Planes LEDGERA",
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

export default function PlanesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
