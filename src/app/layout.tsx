// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/modules/identity/client/authContext";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsProviders from "@/components/analytics/AnalyticsProviders";

const baseUrl = "https://ledgera.cl";
const defaultTitle = "LEDGERA | Sistema financiero-tributario para crypto en Chile";
const defaultDescription =
  "Ordena movimientos crypto, concilia banco y exchange, revisa importaciones y prepara información tributaria trazable para Chile.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: "LEDGERA",
  title: {
    default: defaultTitle,
    template: "%s | LEDGERA",
  },
  description: defaultDescription,
  keywords: [
    "LEDGERA",
    "impuestos crypto Chile",
    "criptomonedas SII",
    "declarar criptomonedas Chile",
    "tributación cripto Chile",
    "conciliación Binance banco",
    "conciliación crypto banco",
    "contador crypto Chile",
    "portafolio crypto Chile",
    "FIFO criptomonedas Chile",
  ],
  authors: [{ name: "LEDGERA" }],
  creator: "LEDGERA",
  publisher: "LEDGERA",
  category: "finance",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: baseUrl,
    siteName: "LEDGERA",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "LEDGERA: sistema financiero-tributario para crypto en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [`${baseUrl}/opengraph-image`],
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
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LEDGERA",
  url: baseUrl,
  email: "admin@ledgera.cl",
  logo: `${baseUrl}/logo.png`,
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LEDGERA",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: baseUrl,
  description:
    "Sistema financiero-tributario para ordenar movimientos crypto, banco, portafolio, conciliación y base tributaria en Chile.",
  offers: {
    "@type": "Offer",
    priceCurrency: "CLP",
    availability: "https://schema.org/InStock",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
        <AuthProvider>{children}</AuthProvider>
        <AnalyticsProviders />
        <CookieBanner />
      </body>
    </html>
  );
}
