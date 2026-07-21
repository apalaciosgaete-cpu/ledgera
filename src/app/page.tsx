// src/app/page.tsx
import type { Metadata } from "next";
import LandingConversacional from "@/components/landing/LandingConversacional";

export const metadata: Metadata = {
  title: "Sistema operativo financiero y tributario para cripto en Chile",
  description:
    "Conversa con LEDGERA y entiende las consecuencias financieras y tributarias de tus decisiones antes de actuar. Declaración de criptomonedas, conciliación bancaria y cumplimiento tributario en Chile. No reemplaza a un contador, te ayuda a decidir mejor.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingConversacional />;
}
