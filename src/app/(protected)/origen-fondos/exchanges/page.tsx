"use client";

import { useEffect, useMemo, useState } from "react";
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

type ExchangeConnectionState = {
  binance: boolean;
  buda: boolean;
  loading: boolean;
};

const INITIAL_CONNECTION_STATE: ExchangeConnectionState = {
  binance: false,
  buda: false,
  loading: true,
};

const AVAILABLE_META: Record<"binance" | "buda", { description: string; capability: string }> = {
  binance: {
    description: "Sincroniza operaciones e historial tributario mediante credenciales API de solo lectura.",
    capability: "Operaciones, balances e historial",
  },
  buda: {
    description: "Importa operaciones desde Buda.com mediante una conexión API protegida y de solo lectura.",
    capability: "Operaciones y movimientos",
  },
};

function connectionLabel(connected: boolean, loading: boolean) {
  if (loading) return "Verificando estado…";
  return connected ? "Conectado" : "Disponible para conectar";
}

export default function ExchangesSourceFundsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<ExchangeConnectionState>(INITIAL_CONNECTION_STATE);

  const availableExchanges = useMemo(
    () => EXCHANGES.filter((exchange) => exchange.status === "available"),
    [],
  );
  const upcomingExchanges = useMemo(
    () => EXCHANGES.filter((exchange) => exchange.status === "coming_soon"),
    [],
  );

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
      <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", display: "grid", gap: 28 }}>
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
              Conecta las plataformas compatibles para sincronizar operaciones y consolidar tu historial tributario.
            </p>
            <span style={{ color: "var(--text-faint)", fontSize: 12.5, fontWeight: 700 }}>
              {availableExchanges.length} integraciones disponibles · {upcomingExchanges.length} en preparación
            </span>
          </div>
        </header>

        <section style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 900, margin: 0, fontFamily: fonts.display }}>Disponibles</h2>
              <p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>Conectores funcionales con acceso de solo lectura.</p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/origen-fondos/documentacion")}
              style={{ minHeight: 38, borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--text)", padding: "0 14px", fontSize: 12.5, fontWeight: 900, cursor: "pointer", fontFamily: fonts.body }}
            >
              Importar historial desde archivo
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: 16 }}>
            {availableExchanges.map((exchange) => {
              const id = exchange.id as "binance" | "buda";
              const connected = connections[id];
              const meta = AVAILABLE_META[id];

              return (
                <button
                  key={exchange.id}
                  type="button"
                  onClick={() => router.push(`/origen-fondos/exchanges/${exchange.id}`)}
                  style={{ minHeight: 230, borderRadius: 22, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)", cursor: "pointer", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18, padding: 22, textAlign: "left", boxShadow: "var(--shadow-sm)", fontFamily: fonts.body }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                    <span style={{ width: 118, height: 58, borderRadius: 15, background: "rgba(255,255,255,.96)", display: "grid", placeItems: "center", padding: "0 14px", boxSizing: "border-box" }}>
                      <img src={exchange.logoUrl} alt={exchange.name} style={{ width: "100%", maxWidth: 88, height: 38, objectFit: "contain", display: "block" }} />
                    </span>
                    <span style={{ borderRadius: 999, border: `1px solid ${connected ? "var(--accent)" : "var(--border)"}`, background: connected ? "var(--accent-soft)" : "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", padding: "7px 10px", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".045em", textAlign: "center" }}>
                      {connectionLabel(connected, connections.loading)}
                    </span>
                  </div>

                  <div style={{ display: "grid", alignContent: "start", gap: 8 }}>
                    <strong style={{ fontFamily: fonts.display, fontSize: 23, fontWeight: 900, letterSpacing: "-.035em" }}>{exchange.name}</strong>
                    <p style={{ color: "var(--text-soft)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{meta.description}</p>
                    <span style={{ color: "var(--text)", fontSize: 12.5, fontWeight: 800 }}>{meta.capability}</span>
                  </div>

                  <span style={{ color: "var(--accent)", fontSize: 13, fontWeight: 900 }}>
                    {connected ? "Administrar conexión →" : "Conectar exchange →"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <h2 style={{ color: "var(--text)", fontSize: 17, fontWeight: 900, margin: 0, fontFamily: fonts.display }}>Próximamente</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>Integraciones contempladas, todavía no habilitadas para solicitar credenciales.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,185px),1fr))", gap: 12 }}>
            {upcomingExchanges.map((exchange) => (
              <article
                key={exchange.id}
                aria-label={`${exchange.name}, próximamente`}
                style={{ minHeight: 142, borderRadius: 18, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: "var(--text)", display: "grid", gridTemplateRows: "1fr auto", gap: 12, padding: 16, opacity: 0.72, fontFamily: fonts.body }}
              >
                <div style={{ display: "grid", placeItems: "center" }}>
                  <span style={{ width: 112, height: 52, borderRadius: 13, background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", padding: "0 12px", boxSizing: "border-box" }}>
                    <img src={exchange.logoUrl} alt={exchange.name} style={{ width: "100%", maxWidth: 82, height: 34, objectFit: "contain", display: "block" }} />
                  </span>
                </div>

                <div style={{ display: "grid", justifyItems: "center", gap: 3, textAlign: "center" }}>
                  <strong style={{ fontSize: 12.5, fontWeight: 900 }}>{exchange.shortName}</strong>
                  <span style={{ color: "var(--text-faint)", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".045em" }}>Próximamente</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
