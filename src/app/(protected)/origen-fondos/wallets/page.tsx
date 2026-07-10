"use client";

import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { WALLETS } from "@/modules/crypto/catalogs/sourceFundsCatalogs";

export default function WalletsSourceFundsPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", gap: 12, alignContent: "start", paddingBottom: 72 }}>
      <section>
        <button onClick={() => router.push("/origen-fondos")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 4 }}>← Volver a Origen de Fondos</button>
        <h1 style={{ color: "var(--text)", fontSize: "clamp(1.25rem,2.1vw,1.55rem)", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.04em", fontFamily: fonts.display }}>Wallets frías</h1>
        <p style={{ color: "var(--text)", fontSize: 12.5, lineHeight: 1.3, margin: 0, fontFamily: fonts.body }}>{WALLETS.length} dispositivos disponibles para asociar direcciones públicas.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, alignContent: "start" }}>
        {WALLETS.map((wallet) => (
          <button key={wallet.id} type="button" onClick={() => router.push(`/origen-fondos/wallets/${wallet.id}`)} style={{ minHeight: 112, borderRadius: 16, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 0, padding: "14px 12px 12px", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(15,42,61,0.04)", fontFamily: fonts.body, textAlign: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
              <img src={wallet.logoUrl} alt={wallet.name} style={{ width: 80, height: 40, objectFit: "contain", display: "block" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <strong style={{ fontSize: 11.5, lineHeight: 1.1, fontWeight: 900 }}>{wallet.shortName}</strong>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--accent)" }}>Dirección pública</span>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}
