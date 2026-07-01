"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clp, usd, percent, formatterNumber } from "@/shared/formatting";

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
  destacados: {
    bestAsset: {
      symbol: string;
      returnPercent: number;
      unrealizedPnlClp: number;
    } | null;
    worstAsset: {
      symbol: string;
      returnPercent: number;
      unrealizedPnlClp: number;
    } | null;
  };
};

type SortKey = "value" | "return" | "symbol" | "pnl";

function Metric({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "neutral" | "good" | "warn" }) {
  const color = tone === "good" ? "#3FA687" : tone === "warn" ? "#E8B84B" : "var(--text)";

  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

function HighlightAsset({ label, asset }: { label: string; asset: InvestmentsData["destacados"]["bestAsset"] }) {
  const isPositive = Number(asset?.returnPercent ?? 0) >= 0;

  return (
    <article style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 850, letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      {asset ? (
        <>
          <p style={{ color: "var(--text)", fontSize: "1.35rem", fontWeight: 850, margin: "0 0 6px" }}>{asset.symbol}</p>
          <p style={{ color: isPositive ? "var(--accent)" : "var(--warn)", fontSize: 14, fontWeight: 800, margin: 0 }}>
            {percent(asset.returnPercent)} · {clp(asset.unrealizedPnlClp)}
          </p>
        </>
      ) : (
        <p style={{ color: "var(--text-soft)", fontSize: 14, margin: 0 }}>Sin datos suficientes</p>
      )}
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
    <section style={{ background: "var(--bg-elev)", border: "1px dashed var(--border)", borderRadius: 8, padding: 28, textAlign: "center" }}>
      <h2 style={{ color: "var(--text)", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Todavia no hay inversiones</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
        Carga movimientos para ver cantidades, costo, valor actual y ganancia o perdida por activo.
      </p>
      <Link href="/importaciones" style={{ background: "var(--accent)", borderRadius: 8, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
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
      <div style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 8, color: "var(--loss)", fontWeight: 750, padding: 16 }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750 }}>Cargando inversiones...</p>;
  }

  const pnlTone = data.rentabilidad.unrealizedPnlClp >= 0 ? "good" : "warn";
  const marketNote = data.patrimonio.marketPricing.source === "COINGECKO"
    ? `${data.patrimonio.marketPricing.pricedAssets}/${data.patrimonio.marketPricing.totalAssets} activos con precio de mercado`
    : "Sin precio de mercado externo; se usa costo como referencia";

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Mis inversiones</p>
          <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Activos, valor actual y rendimiento</h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Tabla simple de posiciones abiertas para revisar tus inversiones sin entrar al libro financiero.
          </p>
        </div>

        <Link href="/panel" style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al dashboard
        </Link>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
        <Metric label="Valor actual" value={clp(data.patrimonio.totalMarketValueClp)} note={`${data.patrimonio.assetCount} activos con posicion`} />
        <Metric label="Costo estimado" value={clp(data.patrimonio.totalCostClp)} note="Suma de costos registrados. Puede variar si hay movimientos sin clasificar." />
        <Metric label="Ganancia / perdida" value={clp(data.rentabilidad.unrealizedPnlClp)} note={`${percent(data.rentabilidad.unrealizedPnlPercent)} no realizado`} tone={pnlTone} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <HighlightAsset label="Ganador principal" asset={data.destacados.bestAsset} />
        <HighlightAsset label="Perdedor principal" asset={data.destacados.worstAsset} />
      </section>

      <section style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>{marketNote}</p>
        <label style={{ alignItems: "center", color: "var(--text)", display: "inline-flex", fontSize: 13, fontWeight: 750, gap: 8 }}>
          Ordenar
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontWeight: 750, minHeight: 38, padding: "0 10px" }}
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
        <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
              <thead>
                <tr style={{ background: "var(--bg-elev)", color: "var(--text)", textAlign: "left" }}>
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
                    <tr key={asset.symbol} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ color: "var(--text)", fontSize: 14, fontWeight: 850, padding: "14px" }}>{asset.symbol}</td>
                      <td style={{ color: "var(--text)", fontSize: 13, padding: "14px", textAlign: "right" }}>{formatterNumber.format(asset.quantity)}</td>
                      <td style={{ color: "var(--text)", fontSize: 13, padding: "14px", textAlign: "right" }}>{usd(asset.currentPriceUsd)}</td>
                      <td style={{ color: "var(--text)", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(asset.marketValueClp)}</td>
                      <td style={{ color: "var(--text)", fontSize: 13, padding: "14px", textAlign: "right" }}>{clp(asset.totalCostClp)}</td>
                      <td style={{ color: positive ? "var(--accent)" : "var(--warn)", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(asset.unrealizedPnlClp)}</td>
                      <td style={{ color: positive ? "var(--accent)" : "var(--warn)", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{percent(asset.returnPercent)}</td>
                      <td style={{ color: "var(--text-soft)", fontSize: 13, fontWeight: 750, padding: "14px", textAlign: "right" }}>{asset.portfolioSharePercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ color: "var(--text-soft)", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12, marginTop: 14 }}>
        <span>FX: {clp(data.patrimonio.fx.usdToClp)}</span>
        <span>Fuente FX: {data.patrimonio.fx.source}</span>
        <span>Actualizado: {new Date(data.patrimonio.fx.asOf).toLocaleDateString("es-CL")}</span>
      </section>
    </div>
  );
}
