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

type ImplementedExchangeId = "binance" | "buda";

type ExchangeConnectionState = Record<ImplementedExchangeId, boolean> & {
  loading: boolean;
};

const INITIAL_CONNECTION_STATE: ExchangeConnectionState = {
  binance: false,
  buda: false,
  loading: true,
};

const EXCHANGE_META: Record<ImplementedExchangeId, { description: string; capability: string }> = {
  binance: {
    description: "Sincroniza operaciones e historial mediante una conexión API de solo lectura.",
    capability: "Operaciones, balances e historial",
  },
  buda: {
    description: "Importa operaciones y movimientos mediante una conexión API protegida.",
    capability: "Operaciones y movimientos",
  },
};

function isImplementedExchange(id: string): id is ImplementedExchangeId {
  return id === "binance" || id === "buda";
}

function ExchangeLogo({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 94,
        height: 42,
        display: "block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function connectionLabel(connected: boolean, loading: boolean) {
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
              Conecta tus plataformas para sincronizar operaciones y consolidar tu historial tributario.
            </p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 14, alignItems: "stretch" }}>
          {EXCHANGES.map((exchange) => {
            const implemented = isImplementedExchange(exchange.id);
            const connected = implemented ? connections[exchange.id] : false;
            const enabled = implemented;
            const meta = implemented
              ? EXCHANGE_META[exchange.id]
              : {
                  description: `Integración prevista para sincronizar operaciones desde ${exchange.name}.`,
                  capability: "Conector en preparación",
                };
            const status = enabled
              ? connectionLabel(connected, connections.loading)
              : "No disponible aún";

            return (
              <button
                key={exchange.id}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && router.push(`/origen-fondos/exchanges/${exchange.id}`)}
                style={{
                  minHeight: 286,
                  borderRadius: 22,
                  border: `1px solid ${enabled ? "var(--border-strong)" : "var(--border)"}`,
                  background: enabled ? "var(--bg-elev)" : "var(--bg-sunken)",
                  color: "var(--text)",
                  cursor: enabled ? "pointer" : "not-allowed",
                  display: "grid",
                  gridTemplateRows: "auto auto 1fr auto",
                  gap: 16,
                  padding: 20,
                  textAlign: "left",
                  opacity: enabled ? 1 : 0.6,
                  boxShadow: enabled ? "var(--shadow-sm)" : "none",
                  fontFamily: fonts.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ width: 62, height: 62, borderRadius: 18, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                    <span style={{ transform: "scale(.54)", display: "grid", placeItems: "center" }}>
                      <ExchangeLogo src={exchange.logoUrl} />
                    </span>
                  </span>

                  <span style={{ maxWidth: 112, borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: enabled && connected ? "var(--accent)" : "var(--text-faint)", padding: "6px 9px", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "center", lineHeight: 1.25 }}>
                    {status}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 5 }}>
                  <span style={{ color: "var(--text-faint)", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Exchange
                  </span>
                  <strong style={{ fontFamily: fonts.display, fontSize: 21, fontWeight: 900, letterSpacing: "-.035em" }}>
                    {exchange.name}
                  </strong>
                </div>

                <div style={{ display: "grid", alignContent: "start", gap: 10 }}>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
                    {meta.description}
                  </p>
                  <span style={{ color: "var(--text)", fontSize: 11.5, fontWeight: 800 }}>
                    {meta.capability}
                  </span>
                </div>

                <span style={{ color: enabled ? "var(--accent)" : "var(--text-faint)", fontSize: 12.5, fontWeight: 900 }}>
                  {enabled
                    ? connected
                      ? "Administrar conexión →"
                      : "Conectar exchange →"
                    : "No disponible todavía"}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
