// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/modules/identity/client/authContext";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "LEDGERA",
  description: "Tributacion cripto simple y verificable",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}