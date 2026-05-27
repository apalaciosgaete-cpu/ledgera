// src/app/cookies/layout.tsx
import type { Metadata } from "next";

const baseUrl = "https://ledgera.cl";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Política de cookies de LEDGERA, incluyendo cookies necesarias, funcionales y analíticas usadas en la plataforma.",
  alternates: {
    canonical: `${baseUrl}/cookies`,
  },
  openGraph: {
    title: "Política de cookies | LEDGERA",
    description:
      "Información sobre cookies necesarias, funcionales y analíticas usadas en LEDGERA.",
    url: `${baseUrl}/cookies`,
    type: "article",
    siteName: "LEDGERA",
    locale: "es_CL",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
