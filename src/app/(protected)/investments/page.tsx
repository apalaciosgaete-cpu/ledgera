"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InvestmentAsset = {
  symbol: string;
  quantity: number;
  totalCostClp: number;
  totalCostUsd: number;
  currentPriceUsd: number;
  marketValueClp: number;
  marketValueUsd: number;
  unrealizedPnlClp: number;
  unrealizedPnlUsd: number;
  returnPercent: number | null;
  portfolioSharePercent: number;
};

type InvestmentsData = {
  patrimonio: {
    totalCostClp: number;
    totalMarketValueClp: number;
    assetCount: number;
    marketPricing: {
      source: "COINGECKO" | "COST_FALLBACK";
      pricedAssets: number;
      totalAssets: number;
    };
    fx: {
      usdToClp: number;
      source: string;
      asOf: string;
    };
  };
  rentabilidad: {
    unrealizedPnlClp: number;
    unrealizedPnlPercent: number | null;
  };
  activos: InvestmentAsset[];
};

type SortKey = "value" | "return" | "symbol" | "pnl";

const formatterClp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatterNumber = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 8,
});

function clp(value: number) {
  return formatterClp.format(value || 0);
}

function usd(value: number) {
  return formatterUsd.format(value || 0);
}

function percent(value: number | null) {
  if (value === null) return "Sin base";
  return `${value.toLocaleString("es-CL", { maximumFractionDigits: 2 })}%`;
}

function Metric({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "neutral" | "good" | "warn" }) {
  const color = tone === "good" ? "#15803D" : tone === "warn" ? "#B45309" : "#0F2A3D";

  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

function sortAssets(assets: InvestmentAsset[], sortKey: SortKey) {
  return [...assets].sort((a, b) => {
    if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol);
    if (sortKey === "return") return Number(b.returnPercent ?? -Infinity) - Number(a.returnPercent ?? -Infinity);
    if (sortKey === "pnl") return b.unrealizedPnlClp - a.unrealizedPnlClp;
    return b.marketValueClp - a.marketValueClp;
  });
}

function EmptyState() {
  return (
    <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
      <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Todavia no hay inversiones</h2>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
        Carga movimientos para ver cantidades, costo, valor actual y ganancia o perdida por activo.
      </p>
      <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
        Cargar movimientos
      </Link>
    </section>
  );
}

export default function InvestmentsPage() {
  const [data, setData] = useState<InvestmentsData | null>(null);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const response = await fetch("/api/investor/dashboard", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok || !json.ok) {
          throw new Error(json.message || "No se pudieron cargar tus inversiones.");
        }

        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus inversiones.");
      }
    }

    void load();
  }, []);

  const assets = useMemo(() => sortAssets(data?.activos ?? [], sortKey), [data?.activos, sortKey]);

  if (error) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando inversiones...</p>;
  }

  const pnlTone = data.rentabilidad.unrealizedPnlClp >= 0 ? "good" : "warn";
  const marketNote = data.patrimonio.marketPricing.source === "COINGECKO"
    ? `${data.patrimonio.marketPricing.pricedAssets}/${data.patrimonio.marketPricing.totalAssets} activos con precio de mercado`
    : "Sin precio de mercado externo; se usa costo como referencia";

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Mis inversiones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Activos, valor actual y rendimiento</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Tabla simple de posiciones abiertas para revisar tus inversiones sin entrar al libro financiero.
          </p>
        </div>

        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al dashboard
        </Link>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
        <Metric label="Valor actual" value={clp(data.patrimonio.totalMarketValueClp)} note={`${data.patrimonio.assetCount} activos con posicion`} />
        <Metric label="Costo estimado" value={clp(data.patrimonio.totalCostClp)} note="Base de costo derivada de movimientos" />
        <Metric label="Ganancia / perdida" value={clp(data.rentabilidad.unrealizedPnlClp)} note={`${percent(data.rentabilidad.unrealizedPnlPercent)} no realizado`} tone={pnlTone} />
      </section>

      <section style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{marketNote}</p>
        <label style={{ alignItems: "center", color: "#475569", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
          Ordenar
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
          >
            <option value="value">Mayor valor</option>
            <option value="return">Mayor rentabilidad</option>
            <option value="pnl">Mayor ganancia</option>
            <option value="symbol">Activo A-Z</option>
          </select>
        </label>
      </section>

      {assets.length === 0 ? (
        <EmptyState />
      ) : (
        <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
              <thead>
                <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Cantidad</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Precio actual</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Valor actual CLP</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Costo estimado</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Ganancia / perdida</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Rentabilidad</th>
                  <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Peso</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const positive = asset.unrealizedPnlClp >= 0;
                  return (
                    <tr key={asset.symbol} style={{ borderTop: "1px solid #E2E8F0" }}>
                      <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{asset.symbol}</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{formatterNumber.format(asset.quantity)}</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(asset.currentPriceUsd)}</td>
                      <td style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(asset.marketValueClp)}</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{clp(asset.totalCostClp)}</td>
                      <td style={{ color: positive ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(asset.unrealizedPnlClp)}</td>
                      <td style={{ color: positive ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{percent(asset.returnPercent)}</td>
                      <td style={{ color: "#64748B", fontSize: 13, fontWeight: 750, padding: "14px", textAlign: "right" }}>{asset.portfolioSharePercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ color: "#64748B", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12, marginTop: 14 }}>
        <span>FX: {clp(data.patrimonio.fx.usdToClp)}</span>
        <span>Fuente FX: {data.patrimonio.fx.source}</span>
        <span>Actualizado: {new Date(data.patrimonio.fx.asOf).toLocaleDateString("es-CL")}</span>
      </section>
    </div>
  );
}
