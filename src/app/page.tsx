// src/app/page.tsx
import type { Metadata } from "next";
import LandingConversacional from "@/components/landing/LandingConversacional";

export const metadata: Metadata = {
  title: "Tu sistema operativo financiero y tributario",
  description:
    "Conversa con LEDGERA y entiende las consecuencias financieras y tributarias de tus decisiones antes de actuar. No reemplaza a un contador, te ayuda a decidir mejor.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <LandingConversacional />;
}
