// src/app/page.tsx
import type { Metadata } from "next";
import LandingConversacional from "@/components/landing/LandingConversacional";

export const metadata: Metadata = {
  title: "LEDGERA | De tus exchanges a tu declaración, sin planillas",
  description:
    "Importa operaciones cripto desde exchanges, ordena activos digitales, detecta inconsistencias y genera respaldos tributarios trazables en PDF y Excel para revisión antes de declarar en Chile.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingConversacional />;
}
