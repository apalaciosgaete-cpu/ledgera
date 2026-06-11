"use client";

import Link from "next/link";

export default function MiSituacionPage() {
  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          Consolidado
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
          Mi Situación
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Resumen de tu posición financiera, tributaria y de inversiones.
        </p>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Link
          href="/impuestos"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "22px 24px",
            textDecoration: "none",
            display: "block",
          }}
        >
          <span style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850 }}>Ver detalle tributario →</span>
          <p style={{ color: "#64748B", fontSize: 13, margin: "6px 0 0" }}>
            Revisa tu estado tributario, declaraciones y reportes.
          </p>
        </Link>
      </div>
    </div>
  );
}
