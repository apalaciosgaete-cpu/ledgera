"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PortfolioPosition = {
  symbol: string;
  quantity: number;
  averageCostUsd: number;
  totalCostUsd: number;
  averageCostClp: number;
  totalCostClp: number;
};

type PortfolioResponse = {
  ok: boolean;
  message?: string;
  data?: {
    positions: PortfolioPosition[];
    totals: {
      symbolCount: number;
      totalQuantity: number;
      totalCostUsd: number;
      totalCostClp: number;
    };
    fx: {
      usdToClp: number;
      source: string;
      asOf: string;
    };
  };
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value: number, digits = 8) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "1rem" }}>
      <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800, color: "#0F2A3D" }}>{value}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>{note}</p>
    </div>
  );
}

function CoinLogo({ symbol }: { symbol: string }) {
  const normalized = symbol.toLowerCase().replace(/usdt$|usdc$|busd$|fdusd$/, "");

  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/128/color/${normalized}.png`}
      alt={symbol}
      width="28"
      height="28"
      style={{ borderRadius: "999px", background: "#F1F5F9", flexShrink: 0 }}
      onError={(event) => {
        const target = event.currentTarget;
        target.style.display = "none";
      }}
    />
  );
}

export default function PortafolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/portfolio");
        const json = (await response.json()) as PortfolioResponse;

        if (!response.ok || !json.ok || !json.data) {
          throw new Error(json.message || "No fue posible cargar el portafolio.");
        }

        setPortfolio(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar portafolio.");
      } finally {
        setLoading(false);
      }
    }

    void loadPortfolio();
  }, []);

  if (loading) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
          <div style={{ width: 30, height: 30, border: "2px solid #E2E8F0", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>Calculando portafolio consolidado...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
        <p style={{ color: "#DC2626", fontWeight: 700, margin: "0 0 4px" }}>Error al cargar portafolio</p>
        <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  if (!portfolio) return null;

  const positions = portfolio.positions ?? [];
  const totals = portfolio.totals;
  const fx = portfolio.fx;

  return (
    <div style={{ maxWidth: "1180px", fontFamily: "var(--font-body)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 800, color: "#0F2A3D", margin: "0 0 4px" }}>
            Portafolio consolidado
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem", lineHeight: 1.55 }}>
            Vista de lectura calculada desde las fuentes conectadas. La ingesta de banco, exchange y wallets se administra desde Conexiones.
          </p>
        </div>

        <Link
          href="/integraciones"
          style={{
            background: "#0F2A3D",
            color: "#FFFFFF",
            borderRadius: "10px",
            padding: "0.7rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 800,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Ir a Conexiones
        </Link>
      </div>

      <div style={{ background: "rgba(15,42,61,0.04)", border: "1px solid rgba(15,42,61,0.1)", borderRadius: "14px", padding: "1rem 1.1rem", marginBottom: "1.25rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: "#0F2A3D" }}>Piscina de datos interna</p>
        <p style={{ margin: 0, color: "#64748B", fontSize: "13px", lineHeight: 1.55 }}>
          Los movimientos crudos no son el flujo principal del usuario. LEDGERA los normaliza internamente y expone aquí sólo la posición calculada, manteniendo trazabilidad para Tributario y Auditoría.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
        <MetricCard label="Activos" value={String(totals.symbolCount)} note="símbolos con posición" />
        <MetricCard label="Costo USD" value={formatUsd(totals.totalCostUsd)} note="base de costo consolidada" />
        <MetricCard label="Costo CLP" value={formatClp(totals.totalCostClp)} note="convertido con FX actual" />
        <MetricCard label="Dólar" value={formatClp(fx.usdToClp)} note={`${fx.source} · ${new Date(fx.asOf).toLocaleDateString("es-CL")}`} />
      </div>

      <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 800, color: "#0F2A3D", margin: "0 0 3px" }}>Posiciones calculadas</h2>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.8125rem" }}>Resultado derivado desde movimientos normalizados.</p>
          </div>
        </div>

        {positions.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 800, color: "#0F2A3D" }}>Aún no hay posiciones consolidadas</p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#64748B" }}>
              Conecta un banco, exchange o wallet para alimentar el motor de LEDGERA.
            </p>
            <Link href="/integraciones" style={{ color: "#16A34A", fontWeight: 800, textDecoration: "none", fontSize: "0.875rem" }}>
              Configurar conexiones →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr>
                  {["Activo", "Cantidad", "Costo promedio", "Costo total USD", "Costo total CLP"].map((heading) => (
                    <th key={heading} style={{ textAlign: "left", padding: "0.85rem 1rem", color: "#64748B", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((position, index) => (
                  <tr key={position.symbol} style={{ background: index % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid #EEF2F7" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CoinLogo symbol={position.symbol} />
                        <strong style={{ color: "#0F2A3D" }}>{position.symbol}</strong>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#475569", borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap" }}>{formatNumber(position.quantity)}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#475569", borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap" }}>{formatUsd(position.averageCostUsd)}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#0F2A3D", fontWeight: 700, borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap" }}>{formatUsd(position.totalCostUsd)}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#0F2A3D", fontWeight: 700, borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap" }}>{formatClp(position.totalCostClp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
