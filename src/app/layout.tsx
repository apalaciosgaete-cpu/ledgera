// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/modules/identity/client/authContext";
import CookieBanner from "@/components/CookieBanner";

const siteUrl = new URL("https://ledgera.cl");

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LEDGERA",
    url: "https://ledgera.cl",
    brand: {
      "@type": "Brand",
      name: "LEDGERA",
    },
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LEDGERA",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://ledgera.cl",
    description:
      "LEDGERA ordena movimientos crypto, revisa importaciones, concilia banco y exchange, limpia portafolios y prepara información financiera y tributaria para Chile.",
    areaServed: {
      "@type": "Country",
      name: "Chile",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CLP",
      availability: "https://schema.org/InStock",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "LEDGERA",
    url: "https://ledgera.cl",
    description:
      "Sistema financiero para usuarios crypto en Chile: importaciones, banco, portafolio, conciliación, trazabilidad y base tributaria.",
    areaServed: {
      "@type": "Country",
      name: "Chile",
    },
    serviceType: [
      "Orden financiero crypto",
      "Conciliación banco exchange",
      "Gestión de portafolio crypto",
      "Preparación tributaria crypto",
      "Trazabilidad financiera digital",
    ],
  },
];

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "LEDGERA",
  title: {
    default:
      "LEDGERA — Ordena tus movimientos crypto, banco y portafolio en Chile",
    template: "%s | LEDGERA",
  },
  description:
    "Organiza importaciones crypto, concilia movimientos bancarios, limpia tu portafolio y prepara información financiera y tributaria clara para Chile.",
  keywords: [
    "impuestos crypto chile",
    "declarar criptomonedas chile",
    "conciliación banco crypto",
    "conciliación exchange banco",
    "ordenar movimientos crypto",
    "portafolio crypto chile",
    "contador crypto chile",
    "tributación crypto chile",
    "crypto sii chile",
    "ganancias crypto chile",
    "binance impuestos chile",
    "conciliación banco exchange",
    "movimientos crypto chile",
  ],
  authors: [{ name: "LEDGERA" }],
  creator: "LEDGERA",
  publisher: "LEDGERA",
  category: "financial technology",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "/",
    siteName: "LEDGERA",
    title:
      "LEDGERA — Ordena tus movimientos crypto, banco y portafolio en Chile",
    description:
      "Revisa importaciones, concilia banco y exchange, limpia tu portafolio y prepara información financiera y tributaria clara.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LEDGERA — Orden financiero crypto para Chile.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "LEDGERA — Ordena tus movimientos crypto, banco y portafolio en Chile",
    description:
      "Revisa importaciones, concilia banco y exchange, limpia tu portafolio y prepara información financiera y tributaria clara.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
