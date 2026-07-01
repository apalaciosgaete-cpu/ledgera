"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fonts, colors } from "@/styles/tokens";
import { EXCHANGES } from "@/modules/crypto/catalogs/sourceFundsCatalogs";

export default function ExchangesSourceFundsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const guide = "Estás en Exchanges. Selecciona el exchange que quieres conectar para continuar.";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim().toLowerCase();
    const exchange = EXCHANGES.find((item) => item.name.toLowerCase().includes(clean) || item.shortName.toLowerCase().includes(clean));
    if (exchange) router.push(`/origen-fondos/exchanges/${exchange.id}`);
  }

  return (
    <main style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "grid", gap: 8, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.25rem,2.1vw,1.55rem)", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Exchanges</h1>
        <p style={{ color: "#334155", fontSize: 12.5, lineHeight: 1.2, margin: 0, fontFamily: fonts.body }}>{EXCHANGES.length} exchanges disponibles. Selecciona para conectar tu cuenta.</p>
      </section>

      <section style={{ minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10, alignContent: "start" }}>
        {EXCHANGES.map((exchange) => {
          const isAvailable = exchange.status === "available";
          return (
            <button key={exchange.id} type="button" disabled={!isAvailable} onClick={() => router.push(`/origen-fondos/exchanges/${exchange.id}`)} style={{ height: 110, borderRadius: 16, border: `1px solid ${isAvailable ? "#E6E0FF" : colors.border}`, background: isAvailable ? "#FFFFFF" : colors.surfaceAlt, color: "#0F2A3D", cursor: isAvailable ? "pointer" : "not-allowed", display: "flex", flexDirection: "column", gap: 0, padding: "14px 12px 12px", alignItems: "center", justifyContent: "space-between", opacity: isAvailable ? 1 : 0.55, boxShadow: isAvailable ? "0 4px 12px rgba(15,42,61,0.04)" : "none", fontFamily: fonts.body, textAlign: "center", transition: "box-shadow 0.15s, transform 0.15s" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <img src={exchange.logoUrl} alt={exchange.name} style={{ width: 80, height: 40, objectFit: "contain", display: "block" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <strong style={{ fontSize: 11.5, lineHeight: 1.1, fontWeight: 900 }}>{exchange.shortName}</strong>
                {!isAvailable && <span style={{ fontSize: 8.5, fontWeight: 700, color: colors.textMuted }}>Próximamente</span>}
              </div>
            </button>
          );
        })}
      </section>

      <section style={{ width: "100%", border: "1px solid #DDD6FE", borderRadius: 18, background: "#FFFFFF", padding: 12, display: "grid", gap: 8, boxShadow: "0 10px 22px rgba(109,74,255,0.05)", boxSizing: "border-box" }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 12.5, lineHeight: 1.3, fontFamily: fonts.body }}>{guide}</p>
        <form onSubmit={submit} style={{ width: "100%" }}>
          <div style={{ flex: 1, minHeight: 44, borderRadius: 15, border: "1px solid #CBD5E1", background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 14px", gap: 6, minWidth: 0, boxShadow: "0 6px 14px rgba(15,42,61,0.035)" }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe el nombre de tu exchange..." style={{ flex: 1, border: "none", outline: "none", color: "#0F2A3D", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
          </div>
        </form>
      </section>
    </main>
  );
}
