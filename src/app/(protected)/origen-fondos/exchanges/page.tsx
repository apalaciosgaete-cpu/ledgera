"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { EXCHANGES } from "@/modules/crypto/catalogs/sourceFundsCatalogs";
import { isApiConnectableExchange } from "@/modules/integrations/exchanges/shared/exchangeApiConfig";
import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type ConnectionSummary = {
  connections: Record<string, { connected: boolean; status: string; lastSyncAt?: string | null }>;
};

type ExchangeConnectionState = {
  connections: Record<string, boolean>;
  loading: boolean;
};

const INITIAL_CONNECTION_STATE: ExchangeConnectionState = {
  connections: {},
  loading: true,
};

function statusLabel(connected: boolean, loading: boolean) {
  if (loading) return "Verificando…";
  return connected ? "Conectado" : "Disponible";
}

export default function ExchangesSourceFundsPage() {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ExchangeConnectionState>(INITIAL_CONNECTION_STATE);

  useEffect(() => {
    let cancelled = false;

    httpClient<ApiResponse<ConnectionSummary>>("/api/connectors/exchanges/status", { auth: true })
      .then((response) => {
        if (cancelled) return;
        setConnectionState({
          connections: Object.fromEntries(
            Object.entries(response.data.connections).map(([exchangeId, connection]) => [exchangeId, connection.connected]),
          ),
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setConnectionState({ connections: {}, loading: false });
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
              Conecta una cuenta mediante API de solo lectura o incorpora su historial para consolidar tus operaciones.
            </p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 14, alignItems: "stretch" }}>
          {EXCHANGES.map((exchange) => {
            const apiConnectable = isApiConnectableExchange(exchange.id);
            const connected = Boolean(connectionState.connections[exchange.id]);
            const meta = apiConnectable
              ? {
                  description: `Conecta ${exchange.name} para sincronizar operaciones y movimientos mediante API de solo lectura.`,
                  capability: "API · Operaciones y movimientos",
                }
              : {
                  description: `Incorpora el historial de ${exchange.name} mediante archivos de operaciones y respaldo.`,
                  capability: "Archivo · Historial y documentos",
                };
            const status = statusLabel(connected, connectionState.loading);

            return (
              <button
                key={exchange.id}
                type="button"
                onClick={() => router.push(`/origen-fondos/exchanges/${exchange.id}`)}
                style={{
                  minHeight: 214,
                  borderRadius: 22,
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: 14,
                  padding: 18,
                  textAlign: "left",
                  boxShadow: "var(--shadow-sm)",
                  fontFamily: fonts.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ minWidth: 0, color: "var(--text)", fontFamily: fonts.display, fontSize: exchange.id === "crypto-mkt" ? 16.5 : 19, lineHeight: 1.15, fontWeight: 900, letterSpacing: "-.035em", whiteSpace: "nowrap" }}>
                    {exchange.name}
                  </strong>

                  <span style={{ flex: "0 0 auto", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-sunken)", color: connected ? "var(--accent)" : "var(--text-soft)", padding: "6px 9px", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "center", lineHeight: 1.2 }}>
                    {status}
                  </span>
                </div>

                <div style={{ display: "grid", alignContent: "start", gap: 8 }}>
                  <p style={{ color: "var(--text-soft)", fontSize: 12.25, lineHeight: 1.48, margin: 0 }}>
                    {meta.description}
                  </p>
                  <span style={{ color: "var(--text)", fontSize: 11.25, fontWeight: 800 }}>
                    {meta.capability}
                  </span>
                </div>

                <span style={{ color: "var(--accent)", fontSize: 12.25, fontWeight: 900 }}>
                  {apiConnectable
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
