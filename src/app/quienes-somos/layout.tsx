// src/app/quienes-somos/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";
const title = "Quiénes somos";
const description =
  "Conoce LEDGERA, una plataforma chilena para ordenar movimientos crypto, conciliación financiera, portafolio y base tributaria trazable.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/quienes-somos`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/quienes-somos`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "LEDGERA - Quiénes somos",
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

export default function QuienesSomosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
