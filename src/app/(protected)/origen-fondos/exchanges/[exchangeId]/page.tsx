"use client";

import { notFound, useParams, useRouter } from "next/navigation";

import { fonts } from "@/styles/tokens";
import { findExchangeById } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { BinanceIntegrationPanel } from "@/modules/integrations/binance/client/BinanceIntegrationPanel";
import { BudaIntegrationPanel } from "@/modules/integrations/buda/client/BudaIntegrationPanel";

export default function ExchangeConnectionPage() {
  const router = useRouter();
  const params = useParams<{ exchangeId: string }>();
  const exchange = findExchangeById(params.exchangeId);

  if (!exchange) notFound();

  const isBinance = exchange.id === "binance";
  const isBuda = exchange.id === "buda";
  const isAvailable = exchange.status === "available";

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", display: "grid", gap: 16, alignContent: "start", paddingBottom: 72 }}>
      <section>
        <button onClick={() => router.push("/origen-fondos/exchanges")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0, marginBottom: 8 }}>← Volver a Exchanges</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={exchange.logoUrl} alt={exchange.name} style={{ width: 58, height: 42, objectFit: "contain" }} />
          <div>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.35rem,2.4vw,1.72rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.04em", fontFamily: fonts.display }}>Conexión {exchange.name}</h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-soft)", fontSize: 13.5, fontFamily: fonts.body }}>
              {isAvailable ? "Conector de solo lectura" : "Integración en preparación"}
            </p>
          </div>
        </div>
      </section>

      {isBinance && (
        <section style={{ display: "grid", gap: 14 }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 14, fontFamily: fonts.body }}>
            <strong style={{ color: "var(--text)", fontSize: 14.5 }}>Dos conexiones disponibles</strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.4 }}>Spot permite validar balances y operaciones. Tax Report permite recuperar el historial tributario multi-año. Ambas credenciales deben ser de solo lectura.</p>
          </div>
          <BinanceIntegrationPanel />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => router.push("/origen-fondos/documentacion?provider=BINANCE")} style={{ minHeight: 40, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 14px", fontFamily: fonts.body, fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}>
              Subir historial de Binance
            </button>
          </div>
        </section>
      )}

      {isBuda && <BudaIntegrationPanel />}

      {!isBinance && !isBuda && (
        <section style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 18, display: "grid", gap: 12, fontFamily: fonts.body }}>
          <div>
            <strong style={{ display: "block", color: "var(--text)", fontSize: 16, fontWeight: 900 }}>Integración API próximamente</strong>
            <p style={{ margin: "5px 0 0", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45 }}>La conexión de {exchange.name} todavía no está habilitada. No se solicitarán credenciales hasta que el conector pueda validar, cifrar y sincronizar información de forma segura.</p>
          </div>
          <div>
            <button type="button" onClick={() => router.push(`/origen-fondos/documentacion?provider=${encodeURIComponent(exchange.id.toUpperCase())}`)} style={{ minHeight: 40, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 14px", fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}>
              Subir documento de respaldo
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
