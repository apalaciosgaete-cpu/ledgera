// src/app/conciliacion-binance-banco/page.tsx
import type { Metadata } from "next";
import SeoContentPage from "@/components/seo/SeoContentPage";
import { seoPages } from "@/modules/seo/seoPageContent";

const baseUrl = "https://ledgera.cl";
const content = seoPages.conciliacionBinanceBanco;
const canonicalUrl = `${baseUrl}${content.path}`;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: content.title,
    description: content.description,
    url: canonicalUrl,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "article",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: content.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: content.title,
    description: content.description,
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function ConciliacionBinanceBancoPage() {
  return <SeoContentPage content={content} />;
}
