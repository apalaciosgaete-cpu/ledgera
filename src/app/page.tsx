// src/app/page.tsx
import type { Metadata } from "next";
import LedgeraLanding from "@/components/landing/LedgeraLanding";

const baseUrl = "https://ledgera.cl";
const title = "LEDGERA | Orden financiero crypto para Chile";
const description =
  "Ordena movimientos crypto, concilia banco y exchange, revisa importaciones y prepara información tributaria trazable para Chile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "LEDGERA: orden financiero crypto para Chile",
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

export default function RootPage() {
  return <LedgeraLanding />;
}
