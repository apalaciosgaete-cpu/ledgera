// src/app/preguntas/layout.tsx
import type { Metadata } from "next";
import {
  JsonLd,
  buildBreadcrumbList,
  buildFaqPageSchema,
} from "@/modules/seo/structuredData";

const baseUrl = "https://ledgera.cl";
const title = "Preguntas frecuentes sobre cripto, impuestos y conciliación";
const description =
  "Respuestas sobre impuestos crypto en Chile, importaciones, conciliación banco-exchange, portafolio, reportes y uso de LEDGERA.";

const faqSchema = buildFaqPageSchema([
  {
    question: "¿LEDGERA reemplaza a un contador?",
    answer: "No. LEDGERA organiza y prepara información financiera-tributaria, pero no reemplaza revisión profesional ni asesoría tributaria personalizada.",
  },
  {
    question: "¿Qué operaciones cripto pueden requerir revisión?",
    answer:
      "Ventas a moneda fiat, intercambios entre activos, pagos recibidos en cripto y movimientos con ganancia realizada pueden requerir análisis según el caso.",
  },
  {
    question: "¿Puedo reconstruir años anteriores?",
    answer: "Sí. Puedes ordenar operaciones históricas para revisar períodos anteriores, siempre validando el tratamiento final con un profesional.",
  },
  {
    question: "¿Puedo conciliar banco y exchange?",
    answer:
      "Sí. El objetivo es relacionar transferencias bancarias, movimientos de exchange y portafolio para reducir desorden operacional.",
  },
  {
    question: "¿Puedo importar datos desde exchanges?",
    answer: "LEDGERA está diseñada para trabajar con importaciones desde exchanges, revisión previa y confirmación antes de afectar el historial financiero.",
  },
  {
    question: "¿Qué significa que la información sea trazable?",
    answer: "Que cada resultado pueda explicarse desde operaciones originales, fechas, cantidades, precios, comisiones y clasificaciones aplicadas.",
  },
  {
    question: "¿Existe plan gratuito?",
    answer: "Sí. El plan gratuito permite explorar la plataforma con un volumen limitado de operaciones.",
  },
  {
    question: "¿Qué plan conviene para una persona?",
    answer: "El plan Personal está pensado para usuarios que necesitan ordenar operaciones, revisar portafolio, conciliación y reportes.",
  },
  {
    question: "¿Hay planes para contadores o empresas?",
    answer:
      "Sí. Los planes Profesional y Empresa están orientados a operación multiusuario, clientes o revisión profesional con mayor trazabilidad.",
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
