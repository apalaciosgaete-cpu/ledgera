// src/app/privacidad/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad de LEDGERA sobre tratamiento de datos personales, seguridad y uso de información en la plataforma.",
  alternates: {
    canonical: `${baseUrl}/privacidad`,
  },
  openGraph: {
    title: "Política de privacidad | LEDGERA",
    description:
      "Información sobre privacidad, datos personales y seguridad en LEDGERA.",
    url: `${baseUrl}/privacidad`,
    type: "article",
    siteName: "LEDGERA",
    locale: "es_CL",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
