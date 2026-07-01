// src/app/mantenimiento/page.tsx
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "LEDGERA en mantenimiento",
  description:
    "LEDGERA se encuentra temporalmente fuera de línea mientras se realizan ajustes internos.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export default function MaintenancePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(22,163,74,0.18), transparent 34%), linear-gradient(135deg, var(--bg-elev) 0%, var(--bg-sunken) 44%, var(--bg-elev) 100%)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "32px",
          background: "rgba(7,27,40,0.72)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.34)",
          padding: "48px 36px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "34px" }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <p
          style={{
            margin: "0 auto 14px",
            width: "fit-content",
            border: "1px solid rgba(74,222,128,0.28)",
            borderRadius: "999px",
            background: "rgba(22,163,74,0.12)",
            color: "var(--accent)",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Modo mantenimiento
        </p>

        <h1
          style={{
            margin: "0",
            fontSize: "clamp(34px, 6vw, 58px)",
            lineHeight: 1,
            letterSpacing: "-0.055em",
            fontWeight: 900,
          }}
        >
          Estamos ajustando LEDGERA
        </h1>

        <p
          style={{
            margin: "24px auto 0",
            maxWidth: "570px",
            color: "var(--text-faint)",
            fontSize: "18px",
            lineHeight: 1.65,
          }}
        >
          El sitio público se encuentra temporalmente fuera de línea mientras realizamos ajustes de marca, navegación y experiencia interna.
        </p>

        <p
          style={{
            margin: "30px auto 0",
            color: "var(--text-soft)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          Vuelve pronto. Estamos preparando una versión más estable y consistente.
        </p>
      </section>
    </main>
  );
}
