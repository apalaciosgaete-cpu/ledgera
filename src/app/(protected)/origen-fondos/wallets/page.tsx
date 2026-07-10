"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fonts } from "@/styles/tokens";
import { WALLETS } from "@/modules/crypto/catalogs/sourceFundsCatalogs";

export default function WalletsSourceFundsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const guide = "Selecciona el dispositivo y registra una dirección pública. La conexión es de solo lectura y nunca solicita semillas ni llaves privadas.";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    const wallet = WALLETS.find((item) => item.name.toLowerCase().includes(clean) || item.shortName.toLowerCase().includes(clean));
    if (!wallet) {
      setMessage("No encontramos esa wallet fría en el catálogo.");
      return;
    }

    setMessage(null);
    router.push(`/origen-fondos/wallets/${wallet.id}`);
  }

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

      <section style={{ width: "100%", border: "1px solid var(--accent-soft)", borderRadius: 18, background: "var(--bg-elev)", padding: 12, display: "grid", gap: 8, boxShadow: "0 10px 22px rgba(109,74,255,0.05)", boxSizing: "border-box" }}>
        <p style={{ margin: 0, color: "var(--text)", fontSize: 12.5, lineHeight: 1.3, fontFamily: fonts.body }}>{guide}</p>
        {message && <p style={{ margin: 0, color: "var(--warn)", fontSize: 12, fontFamily: fonts.body }}>{message}</p>}
        <form onSubmit={submit} style={{ width: "100%" }}>
          <div style={{ flex: 1, minHeight: 44, borderRadius: 15, border: "1px solid var(--border)", background: "var(--bg-elev)", display: "flex", alignItems: "center", padding: "0 14px", gap: 6, minWidth: 0 }}>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setMessage(null); }} placeholder="Escribe el nombre de tu wallet..." style={{ flex: 1, border: "none", outline: "none", color: "var(--text)", fontSize: 14, fontFamily: fonts.body, minWidth: 0, background: "transparent" }} />
          </div>
        </form>
      </section>
    </main>
  );
}
