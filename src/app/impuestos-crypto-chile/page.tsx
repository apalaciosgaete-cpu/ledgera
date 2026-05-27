// src/app/impuestos-crypto-chile/page.tsx
import type { Metadata } from "next";
import SeoContentPage from "@/components/seo/SeoContentPage";
import { seoPages } from "@/modules/seo/seoPageContent";

const content = seoPages.impuestosCryptoChile;

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

export default function ImpuestosCryptoChilePage() {
  return <SeoContentPage content={content} />;
}
