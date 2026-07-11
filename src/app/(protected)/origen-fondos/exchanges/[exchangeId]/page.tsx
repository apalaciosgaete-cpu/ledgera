"use client";

import { notFound, useParams, useRouter } from "next/navigation";

import { fonts } from "@/styles/tokens";
import { findExchangeById } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { BinanceIntegrationPanel } from "@/modules/integrations/binance/client/BinanceIntegrationPanel";
import { BudaIntegrationPanel } from "@/modules/integrations/buda/client/BudaIntegrationPanel";

function ExchangeIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        display: "block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
        WebkitMaskSize: "126px 44px",
        maskSize: "126px 44px",
      }}
    />
  );
}

export default function ExchangeConnectionPage() {
  const router = useRouter();
  const params = useParams<{ exchangeId: string }>();
  const exchange = findExchangeById(params.exchangeId);

  if (!exchange) notFound();

  const isBinance = exchange.id === "binance";
  const isBuda = exchange.id === "buda";
  const hasApiConnection = isBinance || isBuda;
  const documentUrl = `/origen-fondos/documentacion?provider=${encodeURIComponent(exchange.id.toUpperCase())}`;

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 22 }}>
        <header style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos/exchanges")}
            style={{ width: "fit-content", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}
          >
            ← Volver a Exchanges
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 64, height: 64, flex: "0 0 auto", borderRadius: 18, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", overflow: "hidden" }}>
              <ExchangeIcon src={exchange.logoUrl} />
            </span>

            <div style={{ display: "grid", gap: 4 }}>
              <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
                {hasApiConnection ? `Conectar ${exchange.name}` : `Importar desde ${exchange.name}`}
              </h1>
              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.5 }}>
                {hasApiConnection
                  ? "Conexión protegida para consultar operaciones en modo de solo lectura."
                  : "Incorpora el historial exportado desde tu cuenta para procesar y revisar sus operaciones."}
              </p>
            </div>
          </div>
        </header>

        {isBinance && (
          <section style={{ display: "grid", gap: 14 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg-elev)", padding: 14 }}>
              <strong style={{ color: "var(--text)", fontSize: 14.5 }}>Conexiones de solo lectura</strong>
              <p style={{ margin: "4px 0 0", color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45 }}>
                Spot permite validar balances y operaciones. Tax Report permite recuperar el historial tributario multi-año.
              </p>
            </div>
            <BinanceIntegrationPanel />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => router.push("/origen-fondos/documentacion?provider=BINANCE")}
                style={{ minHeight: 40, borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-elev)", color: "var(--text)", padding: "0 14px", fontFamily: fonts.body, fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}
              >
                Importar historial de Binance
              </button>
            </div>
          </section>
        )}

        {isBuda && <BudaIntegrationPanel />}

        {!hasApiConnection && (
          <section style={{ maxWidth: 720, border: "1px solid var(--border-strong)", borderRadius: 22, background: "var(--bg-elev)", padding: 22, display: "grid", gap: 18, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <strong style={{ color: "var(--text)", fontFamily: fonts.display, fontSize: 20, fontWeight: 900 }}>
                Historial de {exchange.name}
              </strong>
              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55 }}>
                Carga el archivo exportado desde el exchange. LEDGERA lo conservará como respaldo y enviará sus registros al flujo de revisión e importación.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => router.push(documentUrl)}
                style={{ minHeight: 42, borderRadius: 12, border: "1px solid var(--accent)", background: "var(--accent)", color: "var(--accent-contrast, #00131f)", padding: "0 16px", fontFamily: fonts.body, fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}
              >
                Seleccionar archivo
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
