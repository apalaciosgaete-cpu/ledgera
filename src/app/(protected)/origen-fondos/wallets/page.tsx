"use client";

import { useRouter } from "next/navigation";

import { fonts } from "@/styles/tokens";

export default function WalletsSourceFundsPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos")}
            style={{
              width: "fit-content",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-soft)",
              fontSize: 13,
              fontFamily: fonts.body,
              padding: 0,
            }}
          >
            ← Volver a Origen de Fondos
          </button>

          <div style={{ display: "grid", gap: 6 }}>
            <h1
              style={{
                color: "var(--text)",
                fontSize: "clamp(1.65rem,3vw,2.25rem)",
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-0.045em",
                fontFamily: fonts.display,
              }}
            >
              Wallets
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 780 }}>
              Este módulo no admite conexiones ni asociaciones de cuentas actualmente.
            </p>
          </div>
        </header>

        <section
          style={{
            maxWidth: 720,
            borderRadius: 20,
            border: "1px solid var(--border)",
            background: "var(--bg-elev)",
            padding: 22,
            boxShadow: "var(--shadow-sm)",
            display: "grid",
            gap: 8,
          }}
        >
          <strong style={{ color: "var(--text)", fontSize: 16, fontWeight: 900 }}>
            Funcionalidad en evaluación
          </strong>
          <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            Las conexiones de wallets permanecerán deshabilitadas hasta contar con una definición técnica, operativa y de seguridad suficientemente validada.
          </p>
        </section>
      </div>
    </main>
  );
}
