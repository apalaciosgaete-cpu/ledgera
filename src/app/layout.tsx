// src/app/layout.tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./landing-brand.css";
import "./landing-brand-override.css";
import { AuthProvider } from "@/modules/identity/client/authContext";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsProviders from "@/components/analytics/AnalyticsProviders";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

// ── LEDGERA design system · Propuesta B "Cierre" ──
// Display: cifras destacadas, headlines, logo · Body: nav/texto/labels · Mono: montos, folios, tablas
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const baseUrl = "https://ledgera.cl";
const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  "6Iatkj-oi2CtR-GyTina6GNlkzxObGIs6u115Fl064k";
const defaultTitle = "LEDGERA | De tus exchanges a tu declaración, sin planillas";
const defaultDescription =
  "Importa operaciones cripto desde exchanges, ordena activos digitales y genera respaldos tributarios trazables en PDF y Excel.";

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
    "tributación cripto Chile",
    "operaciones cripto Chile",
    "activos digitales Chile",
    "declarar operaciones cripto",
    "respaldo tributario cripto",
    "trazabilidad cripto",
    "exchanges cripto Chile",
    "declaración activos digitales",
    "PDF Excel tributario",
    "contador cripto Chile",
  ],
  authors: [{ name: "LEDGERA" }],
  creator: "LEDGERA",
  publisher: "LEDGERA",
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: googleSiteVerification,
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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LEDGERA - Respaldo tributario para operaciones cripto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LEDGERA",
  url: baseUrl,
  logo: `${baseUrl}/icon`,
  sameAs: [baseUrl],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LEDGERA",
  url: baseUrl,
  inLanguage: "es-CL",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LEDGERA",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    priceCurrency: "CLP",
  },
  description: defaultDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CL"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}
    >
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
        <FeedbackWidget />
        <AnalyticsProviders />
        <CookieBanner />
      </body>
    </html>
  );
}
