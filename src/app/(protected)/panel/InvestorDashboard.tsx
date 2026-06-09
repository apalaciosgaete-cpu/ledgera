"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp, usd, percent, formatterNumber } from "@/shared/formatting";

type DashboardData = {
  patrimonio: {
    totalCostClp: number;
    totalCostUsd: number;
    totalMarketValueClp: number;
    totalMarketValueUsd: number;
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
    realizedPnlUsd: number;
    realizedPnlClp: number;
    stakingRewardUsd: number;
    stakingRewardClp: number;
    totalReturnUsd: number;
    totalReturnClp: number;
    totalReturnPercent: number | null;
    unrealizedPnlUsd: number;
    unrealizedPnlClp: number;
    unrealizedPnlPercent: number | null;
  };
  activos: {
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
  }[];
  distribucion: {
    symbol: string;
    percent: number;
    valueClp: number;
  }[];
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
  staking: {
    status: "WITH_DATA" | "PLACEHOLDER";
    rewardUsd: number;
    rewardClp: number;
    message: string;
  };
  tributario: {
    status: "EMPTY" | "READY" | "NO_TAX_EVENTS" | "REVIEW_REQUIRED";
    label: string;
    message: string;
    sellWithoutEvent: number;
    orphanEvents: number;
    totalSellMovements: number;
    totalTaxEvents: number;
  };
  proximaAccion: {
    code: string;
    label: string;
    href: string;
    detail: string;
  };
};

function Metric({ label, value, note, accent = "neutral", href }: { label: string; value: string; note: string; accent?: "neutral" | "good" | "warn"; href?: string }) {
  const accentColor = accent === "good" ? "#15803D" : accent === "warn" ? "#B45309" : "#0F2A3D";
  const content = (
    <>
      <p style={{ margin: "0 0 8px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "0 0 6px", color: accentColor, fontSize: "1.55rem", lineHeight: 1.15, fontWeight: 850 }}>{value}</p>
      <p style={{ margin: 0, color: "#64748B", fontSize: 13, lineHeight: 1.45 }}>{note}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "block", minHeight: 126, padding: "16px", textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "16px", minHeight: 126 }}>
      {content}
    </article>
  );
}

function StatusPill({ status }: { status: DashboardData["tributario"]["status"] }) {
  const token = status === "REVIEW_REQUIRED"
    ? { bg: "#FEF3C7", color: "#92400E", text: "Revisar" }
    : status === "EMPTY"
      ? { bg: "#E0F2FE", color: "#075985", text: "Inicial" }
      : { bg: "#DCFCE7", color: "#166534", text: "Operativo" };

  return (
    <span style={{ alignItems: "center", background: token.bg, borderRadius: 999, color: token.color, display: "inline-flex", fontSize: 12, fontWeight: 800, height: 28, padding: "0 10px" }}>
      {token.text}
    </span>
  );
}

function EmptyAssets() {
  return (
    <div style={{ border: "1px dashed #CBD5E1", borderRadius: 8, padding: "24px", textAlign: "center" }}>
      <p style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 800, margin: "0 0 6px" }}>Todavía no hay activos con posición</p>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.5, margin: 0 }}>Cuando cargues movimientos, LEDGERA mostrará acá tus principales posiciones.</p>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div style={{ border: "1px dashed #CBD5E1", borderRadius: 8, padding: "40px 24px", textAlign: "center" }}>
      <p style={{ color: "#0F2A3D", fontSize: "1.25rem", fontWeight: 850, margin: "0 0 10px" }}>Bienvenido a LEDGERA</p>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 auto 18px", maxWidth: 480 }}>
        Aún no tienes movimientos registrados. Carga tu primera operación para ver tu patrimonio, rentabilidad y estado tributario.
      </p>
      <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
        Cargar movimientos
      </Link>
    </div>
  );
}

function HighlightAsset({ label, asset }: { label: string; asset: DashboardData["destacados"]["bestAsset"] }) {
  const isPositive = Number(asset?.returnPercent ?? 0) >= 0;

  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      {asset ? (
        <>
          <p style={{ color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 850, margin: "0 0 6px" }}>{asset.symbol}</p>
          <p style={{ color: isPositive ? "#15803D" : "#B45309", fontSize: 14, fontWeight: 800, margin: 0 }}>
            {percent(asset.returnPercent)} · {clp(asset.unrealizedPnlClp)}
          </p>
        </>
      ) : (
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Sin datos suficientes</p>
      )}
    </article>
  );
}

export function InvestorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const response = await fetch("/api/investor/dashboard", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok || !json.ok) {
          throw new Error(json.message || "No se pudo cargar el dashboard.");
        }

        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard.");
      }
    }

    void load();
  }, []);

  if (error) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 700, padding: "16px" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "#64748B", fontSize: 14, fontWeight: 700 }}>Cargando dashboard de inversionista...</p>;
  }

  if (data.tributario.status === "EMPTY") {
    return (
      <div style={{ maxWidth: 1180, width: "100%" }}>
        <section style={{ marginBottom: 24 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Panel de inversiones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.9rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Patrimonio, inversión y próxima acción</h1>
        </section>
        <EmptyDashboard />
      </div>
    );
  }

  const taxAccent = data.tributario.status === "REVIEW_REQUIRED" ? "warn" : "good";
  const returnAccent = data.rentabilidad.totalReturnUsd >= 0 ? "good" : "warn";
  const unrealizedAccent = data.rentabilidad.unrealizedPnlUsd >= 0 ? "good" : "warn";
  const marketSourceNote = data.patrimonio.marketPricing.source === "COINGECKO"
    ? `${data.patrimonio.marketPricing.pricedAssets}/${data.patrimonio.marketPricing.totalAssets} activos con precio de mercado`
    : "Sin precio de mercado externo; se usa costo como referencia";

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", gap: "18px", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Panel de inversiones</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.9rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Patrimonio, inversión y próxima acción</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Vista simple para entender el estado actual de tus activos, rendimiento realizado y revisión tributaria.
          </p>
        </div>
      </section>

      <section style={{ background: "#FFFFFF", border: "2px solid #0F766E", borderRadius: 12, marginBottom: 24, padding: "24px" }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 10px", textTransform: "uppercase" }}>Tu siguiente paso</p>
        <h2 style={{ color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 850, lineHeight: 1.2, margin: "0 0 8px" }}>{data.proximaAccion.label}</h2>
        <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: "0 0 18px", maxWidth: 720 }}>{data.proximaAccion.detail}</p>
        <Link href={data.proximaAccion.href} style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 18px", textDecoration: "none" }}>
          {data.proximaAccion.label} →
        </Link>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Metric label="Patrimonio total" value={clp(data.patrimonio.totalMarketValueClp)} note={`${usd(data.patrimonio.totalMarketValueUsd)} valor actual estimado`} />
        <Metric label="Rentabilidad total" value={percent(data.rentabilidad.totalReturnPercent)} note={`${clp(data.rentabilidad.totalReturnClp)} realizado + staking`} accent={returnAccent} />
        <Metric label="No realizada" value={clp(data.rentabilidad.unrealizedPnlClp)} note={`${percent(data.rentabilidad.unrealizedPnlPercent)} vs costo estimado`} accent={unrealizedAccent} />
        <Metric label="Activos" value={String(data.patrimonio.assetCount)} note="Posiciones abiertas con saldo actual" />
        <Metric label="Staking" value={usd(data.staking.rewardUsd)} note={data.staking.message} accent={data.staking.status === "WITH_DATA" ? "good" : "neutral"} href="/staking" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, marginBottom: 24 }}>
        <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 4px" }}>Mis activos</h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Principales posiciones por valor actual en CLP.</p>
            </div>
            <Link href="/inversiones" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>Ver inversiones</Link>
          </div>

          {data.activos.length === 0 ? (
            <EmptyAssets />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {data.activos.slice(0, 8).map((asset) => (
                <div key={asset.symbol} style={{ alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "minmax(64px, 0.7fr) minmax(130px, 1.4fr) minmax(96px, 0.8fr)", padding: "12px" }}>
                  <strong style={{ color: "#0F2A3D", fontSize: 15 }}>{asset.symbol}</strong>
                  <div>
                    <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 4px" }}>{clp(asset.marketValueClp)}</p>
                    <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{formatterNumber.format(asset.quantity)} unidades · {usd(asset.currentPriceUsd)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: Number(asset.returnPercent ?? 0) >= 0 ? "#15803D" : "#B45309", fontSize: 13, fontWeight: 850, margin: "0 0 4px" }}>{percent(asset.returnPercent)}</p>
                    <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{asset.portfolioSharePercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <HighlightAsset label="Mejor activo" asset={data.destacados.bestAsset} />
            <HighlightAsset label="Peor activo" asset={data.destacados.worstAsset} />
          </div>

          <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Distribución</h2>
            {data.distribucion.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Sin activos para distribuir.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {data.distribucion.map((item) => (
                  <div key={item.symbol}>
                    <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                      <span style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850 }}>{item.symbol}</span>
                      <span style={{ color: "#64748B", fontSize: 12, fontWeight: 750 }}>{item.percent}%</span>
                    </div>
                    <div style={{ background: "#E2E8F0", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div style={{ background: "#0F766E", borderRadius: 999, height: "100%", width: `${Math.min(Math.max(item.percent, 0), 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Estado tributario</h2>
              <StatusPill status={data.tributario.status} />
            </div>
            <p style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 6px" }}>{data.tributario.label}</p>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>{data.tributario.message}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Metric label="Ventas" value={String(data.tributario.totalSellMovements)} note="Operaciones de venta" accent={taxAccent} />
              <Metric label="Eventos" value={String(data.tributario.totalTaxEvents)} note="Ventas con resultado calculado" accent={taxAccent} />
            </div>
          </article>

        </aside>
      </section>

      <section style={{ color: "#64748B", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12 }}>
        <span>FX: {clp(data.patrimonio.fx.usdToClp)}</span>
        <span>Fuente: {data.patrimonio.fx.source}</span>
        <span>Mercado: {marketSourceNote}</span>
        <span>Actualizado: {new Date(data.patrimonio.fx.asOf).toLocaleDateString("es-CL")}</span>
      </section>
    </div>
  );
}
