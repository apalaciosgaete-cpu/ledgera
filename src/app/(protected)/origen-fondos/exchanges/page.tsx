"use client";

import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { EXCHANGES } from "@/modules/crypto/catalogs/sourceFundsCatalogs";

export default function ExchangesSourceFundsPage() {
  const router = useRouter();
  const availableCount = EXCHANGES.filter((item) => item.status === "available").length;

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", gap: 12, alignContent: "start", paddingBottom: 72 }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.25rem,2.1vw,1.55rem)", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Exchanges</h1>
        <p style={{ color: "var(--text)", fontSize: 12.5, lineHeight: 1.3, margin: 0, fontFamily: fonts.body }}>{availableCount} conexiones operativas de {EXCHANGES.length} exchanges en catálogo.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, alignContent: "start" }}>
        {EXCHANGES.map((exchange) => {
          const isAvailable = exchange.status === "available";
          return (
            <button key={exchange.id} type="button" disabled={!isAvailable} onClick={() => router.push(`/origen-fondos/exchanges/${exchange.id}`)} style={{ minHeight: 112, borderRadius: 16, border: `1px solid ${isAvailable ? "var(--border-strong)" : "var(--border)"}`, background: isAvailable ? "var(--bg-elev)" : "var(--bg-sunken)", color: "var(--text)", cursor: isAvailable ? "pointer" : "not-allowed", display: "flex", flexDirection: "column", gap: 0, padding: "14px 12px 12px", alignItems: "center", justifyContent: "space-between", opacity: isAvailable ? 1 : 0.55, boxShadow: isAvailable ? "0 4px 12px rgba(15,42,61,0.04)" : "none", fontFamily: fonts.body, textAlign: "center", transition: "box-shadow 0.15s, transform 0.15s" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                <img src={exchange.logoUrl} alt={exchange.name} style={{ width: 80, height: 40, objectFit: "contain", display: "block" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <strong style={{ fontSize: 11.5, lineHeight: 1.1, fontWeight: 900 }}>{exchange.shortName}</strong>
                <span style={{ fontSize: 8.5, fontWeight: 800, color: isAvailable ? "var(--accent)" : "var(--text-faint)" }}>{isAvailable ? "API disponible" : "Próximamente"}</span>
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
