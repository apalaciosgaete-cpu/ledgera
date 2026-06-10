// src/app/page.tsx
import type { Metadata } from "next";
import LedgeraLanding from "@/components/landing/LedgeraLanding";

export const metadata: Metadata = {
  title: "LEDGERA — Calcula tus impuestos crypto para el SII en Chile",
  description:
    "Importa tus movimientos de Buda, Binance o CSV. LEDGERA calcula tu ganancia y te dice qué poner en el Formulario 22 del SII.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LedgeraLanding />;
}
