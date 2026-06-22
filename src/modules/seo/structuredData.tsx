// src/modules/seo/structuredData.tsx
import type { BlogArticle } from "@/modules/seo/blogArticles";
import type { SeoPageContent } from "@/modules/seo/seoPageContent";

export const seoBaseUrl = "https://ledgera.cl";

export type JsonLdObject = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  url: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

function safeJsonLd(data: JsonLdObject | JsonLdObject[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function buildBreadcrumbList(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqPageSchema(items: FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildSeoWebPageSchema(content: SeoPageContent): JsonLdObject {
  const url = `${seoBaseUrl}${content.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.h1,
    headline: content.h1,
    description: content.description,
    url,
    inLanguage: "es-CL",
    isPartOf: {
      "@type": "WebSite",
      name: "LEDGERA",
      url: seoBaseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LEDGERA",
      url: seoBaseUrl,
    },
    about: content.keyword,
  };
}

export function buildBlogPostingSchema(article: BlogArticle): JsonLdObject {
  const url = `${seoBaseUrl}/blog/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: [`${seoBaseUrl}/opengraph-image`],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: "es-CL",
    author: {
      "@type": "Organization",
      name: "LEDGERA",
      url: seoBaseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LEDGERA",
      url: seoBaseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${seoBaseUrl}/icon`,
      },
    },
  };
}
