"use client";

import Link from "next/link";
import { useState } from "react";
import { PeriodoBlock } from "./PeriodoBlock";
import { RevisionBlock } from "./RevisionBlock";
import { LedgerBlock } from "./LedgerBlock";
import { MovimientosBlock } from "./MovimientosBlock";

type Tab = "periodo" | "revision" | "ledger" | "movimientos";

export default function ExpertoOperacionesPage() {
  const [tab, setTab] = useState<Tab>("periodo");

  const tabBtn = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: active ? "rgba(22,163,74,0.18)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-soft)",
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Modo Experto</p>
          <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Operaciones</h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Estado del período, revisión operacional, ledger tributario y movimientos auditados.
          </p>
        </div>
        <Link href="/experto" style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a Experto
        </Link>
      </section>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg-elev)", borderRadius: 10, padding: 4, border: "1px solid var(--border)" }}>
        {tabBtn("periodo", "Período")}
        {tabBtn("revision", "Revisión")}
        {tabBtn("ledger", "Ledger")}
        {tabBtn("movimientos", "Movimientos")}
      </div>

      {tab === "periodo" && <PeriodoBlock />}
      {tab === "revision" && <RevisionBlock />}
      {tab === "ledger" && <LedgerBlock />}
      {tab === "movimientos" && <MovimientosBlock />}
    </div>
  );
}
