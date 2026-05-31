// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/modules/identity/client/authContext";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsProviders from "@/components/analytics/AnalyticsProviders";
import ChatWidget from "@/components/chat/ChatWidget";
import SwRegister from "@/components/chat/SwRegister";
import AuthEntryTrustOverlay from "@/components/auth/AuthEntryTrustOverlay";

const baseUrl = "https://ledgera.cl";
const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  "6Iatkj-oi2CtR-GyTina6GNlkzxObGIs6u115Fl064k";
const defaultTitle = "LEDGERA | Sistema financiero-tributario para crypto en Chile";
const defaultDescription =
  "Ordena movimientos crypto, concilia banco y exchange, revisa importaciones y prepara información tributaria trazable para Chile.";

function safeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

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
  verification: {
    google: googleSiteVerification,
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
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
  "@id": `${baseUrl}/#organization`,
  name: "LEDGERA",
  url: baseUrl,
  email: "admin@ledgera.cl",
  logo: `${baseUrl}/brand/ledgera-app-icon.svg`,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "admin@ledgera.cl",
      areaServed: "CL",
      availableLanguage: ["es-CL", "es"],
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  name: "LEDGERA",
  url: baseUrl,
  inLanguage: "es-CL",
  publisher: {
    "@id": `${baseUrl}/#organization`,
  },
  description: defaultDescription,
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${baseUrl}/#software`,
  name: "LEDGERA",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: baseUrl,
  description:
    "Sistema financiero-tributario para ordenar movimientos crypto, banco, portafolio, conciliación y base tributaria en Chile.",
  inLanguage: "es-CL",
  publisher: {
    "@id": `${baseUrl}/#organization`,
  },
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
            __html: safeJsonLd(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(softwareSchema),
          }}
        />
        <AuthProvider>{children}</AuthProvider>
<AuthEntryTrustOverlay />
<AnalyticsProviders />
        <CookieBanner />
        <ChatWidget />
        <SwRegister />
      </body>
    </html>
  );
}
