// src/app/page.tsx
import type { Metadata } from "next";
import LedgeraLanding from "@/components/landing/LedgeraLanding";

export const metadata: Metadata = {
  title: "LEDGERA — Ordena tus movimientos crypto, banco y portafolio en Chile",
  description:
    "Organiza importaciones crypto, concilia movimientos bancarios, limpia tu portafolio y prepara información financiera y tributaria clara para Chile.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LedgeraLanding />;
}
