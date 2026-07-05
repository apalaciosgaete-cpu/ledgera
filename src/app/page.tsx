// src/app/page.tsx
import type { Metadata } from "next";
import LandingConversacional from "@/components/landing/LandingConversacional";

export const metadata: Metadata = {
  title: "Ordena activos y genera respaldo tributario",
  description:
    "LEDGERA transforma movimientos de crypto, bancos e inversiones en información ordenada, trazable y exportable para revisar antes de declarar.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingConversacional />;
}
