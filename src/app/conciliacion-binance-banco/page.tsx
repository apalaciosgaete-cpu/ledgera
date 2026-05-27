// src/app/conciliacion-binance-banco/page.tsx
import type { Metadata } from "next";
import SeoContentPage from "@/components/seo/SeoContentPage";
import { seoPages } from "@/modules/seo/seoPageContent";

const content = seoPages.conciliacionBinanceBanco;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  alternates: {
    canonical: content.path,
  },
  openGraph: {
    title: content.title,
    description: content.description,
    url: content.path,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: content.title,
    description: content.description,
  },
};

export default function ConciliacionBinanceBancoPage() {
  return <SeoContentPage content={content} />;
}
