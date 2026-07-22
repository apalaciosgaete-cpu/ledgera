// src/app/preguntas/layout.tsx
import type { Metadata } from "next";
import {
  JsonLd,
  buildBreadcrumbList,
  buildFaqPageSchema,
} from "@/modules/seo/structuredData";

const baseUrl = "https://ledgera.cl";
const title = "Preguntas frecuentes | Impuestos crypto, conciliación y LEDGERA";
const description =
  "Respuestas sobre impuestos crypto en Chile, importaciones, conciliación banco-exchange, portafolio, reportes y uso de LEDGERA.";

const faqSchema = buildFaqPageSchema([
  {
    question: "¿Es obligatorio declarar criptomonedas al SII en Chile?",
    answer:
      "Las ganancias por venta de criptomonedas pueden constituir renta y deben revisarse dentro de la declaración anual correspondiente. LEDGERA ayuda a ordenar la información, pero la interpretación final debe validarse con un contador o asesor tributario.",
  },
  {
    question: "¿Qué operaciones pueden requerir revisión tributaria?",
    answer:
      "Ventas a moneda fiat, intercambios entre activos, pagos recibidos en cripto y movimientos con ganancia realizada pueden requerir análisis. La simple compra o tenencia normalmente no genera impuesto por sí sola.",
  },
  {
    question: "¿Cómo funciona el motor FIFO de LEDGERA?",
    answer:
      "El motor procesa movimientos confirmados en orden cronológico. Cuando existe una venta, consume primero las unidades más antiguas y calcula costo, resultado y trazabilidad desde los movimientos disponibles.",
  },
  {
    question: "¿Puedo conciliar banco y exchange?",
    answer:
      "Sí. El objetivo es relacionar transferencias bancarias, movimientos de exchange y portafolio para reducir desorden operacional.",
  },
  {
    question: "¿LEDGERA reemplaza a un contador?",
    answer:
      "No. LEDGERA organiza y prepara información financiera-tributaria. No reemplaza la revisión profesional ni constituye asesoría tributaria personalizada.",
  },
  {
    question: "¿Qué agrega el plan Profesional?",
    answer:
      "El plan Profesional agrega herramientas de revisión técnica, auditoría ampliada, reportes trazables y soporte prioritario para operaciones más complejas.",
  },
]);

const breadcrumbSchema = buildBreadcrumbList([
  { name: "Inicio", url: baseUrl },
  { name: "Preguntas frecuentes", url: `${baseUrl}/preguntas` },
]);

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${baseUrl}/preguntas`,
  },
  openGraph: {
    title,
    description,
    url: `${baseUrl}/preguntas`,
    siteName: "LEDGERA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Preguntas frecuentes LEDGERA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${baseUrl}/opengraph-image`],
  },
};

export default function PreguntasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}
