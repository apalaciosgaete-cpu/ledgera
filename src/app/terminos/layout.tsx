// src/app/terminos/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de uso de LEDGERA, plataforma financiero-tributaria para gestión de operaciones crypto en Chile.",
  alternates: {
    canonical: `${baseUrl}/terminos`,
  },
  openGraph: {
    title: "Términos y condiciones | LEDGERA",
    description:
      "Condiciones de uso de LEDGERA para usuarios de la plataforma financiero-tributaria crypto en Chile.",
    url: `${baseUrl}/terminos`,
    type: "article",
    siteName: "LEDGERA",
    locale: "es_CL",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
