// src/app/como-funciona/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";
const title = "Importación, conciliación y respaldo tributario";
const description =
  "Aprende cómo LEDGERA ordena movimientos crypto, revisa importaciones, concilia banco y exchange, y prepara información financiera-tributaria trazable en Chile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/como-funciona`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/como-funciona`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Cómo funciona LEDGERA",
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

export default function ComoFuncionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
