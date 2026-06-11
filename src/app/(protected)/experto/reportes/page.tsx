"use client";

import Link from "next/link";

export default function ExpertoReportesPlaceholder() {
  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      <section style={{ marginBottom: 20 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto</p>
        <h1 style={{ color: "#F8FAFC", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Reportes</h1>
        <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Exportación CSV, PDF y respaldo ante fiscalización.
        </p>
      </section>
      <section style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 28, textAlign: "center" }}>
        <h2 style={{ color: "#F8FAFC", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Próximamente</h2>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
          Esta sección se migrará en una etapa posterior de la consolidación experta.
        </p>
        <Link href="/experto" style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#F8FAFC", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a Experto
        </Link>
      </section>
    </div>
  );
}
