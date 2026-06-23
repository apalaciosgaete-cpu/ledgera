"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { fonts, colors } from "@/styles/tokens";
import { findExchangeById } from "@/modules/crypto/catalogs/sourceFundsCatalogs";

export default function ExchangeConnectionPage() {
  const router = useRouter();
  const params = useParams<{ exchangeId: string }>();
  const exchange = findExchangeById(params.exchangeId);
  if (!exchange) notFound();

  return (
    <main style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "grid", gap: 14, gridTemplateRows: "auto 1fr auto" }}>
      <section>
        <button onClick={() => router.push("/origen-fondos/exchanges")} style={{ background: "transparent", border: "none", cursor: "pointer", color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 8 }}>← Volver a Exchanges</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={exchange.logoUrl} alt={exchange.name} style={{ width: 58, height: 42, objectFit: "contain" }} />
          <div>
            <h1 style={{ color: "#0F2A3D", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>Conexión {exchange.name}</h1>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13.5, fontFamily: fonts.body }}>Exchange</p>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, alignContent: "start" }}>
        {exchange.connectionMethods.map((method) => (
          <button key={method} type="button" style={{ minHeight: 150, borderRadius: 20, border: "1px solid #DDD6FE", background: "#FFFFFF", color: "#0F2A3D", cursor: "pointer", padding: 18, textAlign: "left", boxShadow: "0 10px 22px rgba(15,42,61,0.05)", fontFamily: fonts.body }}>
            <strong style={{ display: "block", fontSize: 17, fontWeight: 900, marginBottom: 8 }}>{method === "api" ? "Conexión por API" : "Subir historial"}</strong>
            <span style={{ display: "block", color: "#475569", fontSize: 13.5, lineHeight: 1.35 }}>{method === "api" ? "Conecta el exchange usando credenciales API de solo lectura." : "Carga CSV, Excel o reporte del exchange para normalizar movimientos."}</span>
          </button>
        ))}
      </section>

      <section style={{ border: "1px solid #DDD6FE", borderRadius: 18, background: "#FFFFFF", padding: 14, color: "#475569", fontSize: 13, fontFamily: fonts.body }}>
        Estás en la conexión con {exchange.name}. Selecciona el método de conexión para continuar.
      </section>
    </main>
  );
}
