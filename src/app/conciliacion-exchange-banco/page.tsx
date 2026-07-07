// src/app/conciliacion-exchange-banco/page.tsx
import type { Metadata } from "next";
import SeoContentPage from "@/components/seo/SeoContentPage";

const baseUrl = "https://ledgera.cl";

const content = {
  path: "/conciliacion-exchange-banco",
  title: "Conciliación exchange y banco: conecta transferencias con movimientos crypto",
  description:
    "Concilia movimientos bancarios con operaciones de cualquier exchange para entender qué transferencias corresponden a compras, ventas, depósitos o retiros crypto.",
  keyword: "conciliación exchange banco Chile",
  eyebrow: "Conciliación crypto",
  h1: "Conciliación exchange y banco: entiende qué pasó con tu dinero",
  intro:
    "Para muchos usuarios, el problema no es solo el exchange. El problema es conectar una transferencia bancaria con el movimiento crypto correspondiente. LEDGERA ordena ambos lados para ayudarte a encontrar coincidencias revisables, sin importar qué exchange uses.",
  ctaLabel: "Crear cuenta gratis",
  ctaHref: "/register",
  sections: [
    {
      heading: "El banco muestra dinero, el exchange muestra crypto",
      body: [
        "Una cartola bancaria puede mostrar transferencias, cargos o abonos. Un exchange puede mostrar depósitos, compras o retiros. Si esos mundos no se conectan, la trazabilidad queda incompleta.",
        "La conciliación permite revisar si una salida bancaria tiene relación con una compra crypto o si un ingreso puede venir desde un retiro o venta.",
      ],
    },
    {
      heading: "Buscar match antes de confirmar",
      body: [
        "LEDGERA permite buscar coincidencias entre movimientos bancarios y movimientos de portafolio ya confirmados.",
        "El sistema propone candidatos, pero el usuario conserva el control: confirma, ignora o deja en revisión.",
      ],
      bullets: [
        "Comparación por fecha.",
        "Comparación por monto estimado.",
        "Candidatos con explicación.",
        "Revisión humana antes de marcar conciliado.",
      ],
    },
    {
      heading: "Agnóstico al exchange",
      body: [
        "No importa si usas Binance, Buda.com, Binance LATAM, Bybit, KuCoin u otro exchange. LEDGERA normaliza los datos de importación para que la conciliación funcione con cualquier plataforma.",
        "El objetivo es conectar tu banco con tus movimientos crypto, sin importar de dónde vengan.",
      ],
    },
    {
      heading: "Por qué esto importa para impuestos",
      body: [
        "La conciliación no solo ordena el portafolio. También ayuda a explicar el flujo financiero: desde dónde salió el dinero, cuándo llegó al exchange y qué operación se relaciona con ese movimiento.",
        "Ese contexto es clave para preparar información clara antes de revisar obligaciones tributarias.",
      ],
    },
  ],
  related: [
    {
      label: "Impuestos crypto en Chile",
      href: "/impuestos-crypto-chile",
    },
    {
      label: "Cómo declarar crypto en Chile",
      href: "/como-declarar-crypto-en-chile",
    },
    {
      label: "Conciliación Binance y banco",
      href: "/conciliacion-binance-banco",
    },
  ],
};

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

export default function ConciliacionExchangeBancoPage() {
  return <SeoContentPage content={content} />;
}
