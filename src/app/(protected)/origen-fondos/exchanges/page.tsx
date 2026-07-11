"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { EXCHANGES } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type ConnectionStatus = {
  connected: boolean;
};

type ApiExchangeId = "binance" | "buda";

type ExchangeConnectionState = Record<ApiExchangeId, boolean> & {
  loading: boolean;
};

const INITIAL_CONNECTION_STATE: ExchangeConnectionState = {
  binance: false,
  buda: false,
  loading: true,
};

const API_EXCHANGE_META: Record<ApiExchangeId, { description: string; capability: string }> = {
  binance: {
    description: "Sincroniza operaciones e historial mediante una conexión API de solo lectura.",
    capability: "API · Operaciones, balances e historial",
  },
  buda: {
    description: "Importa operaciones y movimientos mediante una conexión API protegida.",
    capability: "API · Operaciones y movimientos",
  },
};

function isApiExchange(id: string): id is ApiExchangeId {
  return id === "binance" || id === "buda";
}

function ExchangeIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 42,
        height: 42,
        display: "block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
        WebkitMaskSize: "120px 42px",
        maskSize: "120px 42px",
      }}
    />
  );
}

function apiStatusLabel(connected: boolean, loading: boolean) {
  if (loading) return "Verificando…";
  return connected ? "Conectado" : "Disponible";
}

export default function ExchangesSourceFundsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<ExchangeConnectionState>(INITIAL_CONNECTION_STATE);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      httpClient<ApiResponse<ConnectionStatus>>("/api/integrations/binance/connection", { auth: true }),
      httpClient<ApiResponse<ConnectionStatus>>("/api/connectors/buda", { auth: true }),
    ]).then(([binanceResult, budaResult]) => {
      if (cancelled) return;

      setConnections({
        binance: binanceResult.status === "fulfilled" && Boolean(binanceResult.value.data.connected),
        buda: budaResult.status === "fulfilled" && Boolean(budaResult.value.data.connected),
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ minHeight: "calc(100vh - 100px)", paddingBottom: 72, fontFamily: fonts.body }}>
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push("/origen-fondos")}
            style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-soft)", fontSize: 13, fontFamily: fonts.body, padding: 0 }}
          >
            ← Volver a Origen de Fondos
          </button>

          <div style={{ display: "grid", gap: 6 }}>
            <h1 style={{ color: "var(--text)", fontSize: "clamp(1.65rem,3vw,2.25rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.045em", fontFamily: fonts.display }}>
              Exchanges
            </h1>
            <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: 0, maxWidth: 760 }}>
              Conecta una cuenta compatible o incorpora su historial para consolidar tus operaciones.
            </p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 14, alignItems: "stretch" }}>
          {EXCHANGES.map((exchange) => {
            const apiExchangeId = isApiExchange(exchange.id) ? exchange.id : null;
            const connected = apiExchangeId ? connections[apiExchangeId] : false;
            const meta = apiExchangeId
              ? API_EXCHANGE_META[apiExchangeId]
              : {
                  description: `Incorpora el historial de ${exchange.name} mediante archivos de operaciones y respaldo.`,
                  capability: "Archivo · Historial y documentos",
                };
            const status = apiExchangeId
              ? apiStatusLabel(connected, connections.loading)
              : "Disponible";

            return (
              <button
                key={exchange.id}
                type="button"
                onClick={() => router.push(`/origen-fondos/exchanges/${exchange.id}`)}
                style={{
                  minHeight: 238,
                  borderRadius: 22,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateRows: "auto auto 1fr auto",
                  gap: 13,
                  padding: 18,
                  textAlign: "left",
                  boxShadow: "var(--shadow-sm)",
                  fontFamily: fonts.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ width: 58, height: 58, borderRadius: 17, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                    <ExchangeIcon src={exchange.logoUrl} />
                  </span>

                  <span style={{ borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", padding: "6px 9px", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "center", lineHeight: 1.2 }}>
                    {status}
                  </span>
                </div>

                <strong style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 900, letterSpacing: "-.035em" }}>
                  {exchange.name}
                </strong>

                <div style={{ display: "grid", alignContent: "start", gap: 8 }}>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.25, lineHeight: 1.48, margin: 0 }}>
                    {meta.description}
                  </p>
                  <span style={{ color: "var(--text)", fontSize: 11.25, fontWeight: 800 }}>
                    {meta.capability}
                  </span>
                </div>

                <span style={{ color: "var(--accent)", fontSize: 12.25, fontWeight: 900 }}>
                  {apiExchangeId
                    ? connected
                      ? "Administrar conexión →"
                      : "Conectar cuenta →"
                    : "Importar historial →"}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
