// src/app/page.tsx
import type { Metadata } from "next";
import LandingConversacional from "@/components/landing/LandingConversacional";

export const metadata: Metadata = {
  title: "De tus exchanges a tu declaración, sin planillas",
  description:
    "LEDGERA importa operaciones cripto desde exchanges, ordena activos digitales y genera respaldos tributarios trazables en PDF y Excel.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingConversacional />;
}
