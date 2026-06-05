"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  patrimonio: {
    totalCostClp: number;
    totalCostUsd: number;
    assetCount: number;
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
  };
  activos: {
    symbol: string;
    quantity: number;
    totalCostClp: number;
    totalCostUsd: number;
    portfolioSharePercent: number;
  }[];
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

const formatterClp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
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

function Metric({ label, value, note, accent = "neutral" }: { label: string; value: string; note: string; accent?: "neutral" | "good" | "warn" }) {
  const accentColor = accent === "good" ? "#15803D" : accent === "warn" ? "#B45309" : "#0F2A3D";

  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "16px", minHeight: 126 }}>
      <p style={{ margin: "0 0 8px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "0 0 6px", color: accentColor, fontSize: "1.55rem", lineHeight: 1.15, fontWeight: 850 }}>{value}</p>
      <p style={{ margin: 0, color: "#64748B", fontSize: 13, lineHeight: 1.45 }}>{note}</p>
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

  const taxAccent = data.tributario.status === "REVIEW_REQUIRED" ? "warn" : "good";
  const returnAccent = data.rentabilidad.totalReturnUsd >= 0 ? "good" : "warn";

  return (
    <div style={{ maxWidth: 1180 }}>
      <section style={{ alignItems: "flex-start", display: "flex", gap: "18px", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Investor Dashboard</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.9rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Patrimonio, inversión y próxima acción</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Vista simple para entender el estado actual de tus activos, rendimiento realizado y revisión tributaria.
          </p>
        </div>

        <Link href={data.proximaAccion.href} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontWeight: 850, minHeight: 42, padding: "11px 16px", textDecoration: "none" }}>
          {data.proximaAccion.label}
        </Link>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Metric label="Patrimonio" value={clp(data.patrimonio.totalCostClp)} note={`${usd(data.patrimonio.totalCostUsd)} valorizado a costo`} />
        <Metric label="Rentabilidad" value={clp(data.rentabilidad.totalReturnClp)} note={`${percent(data.rentabilidad.totalReturnPercent)} sobre capital aportado`} accent={returnAccent} />
        <Metric label="Activos" value={String(data.patrimonio.assetCount)} note="Posiciones abiertas con saldo actual" />
        <Metric label="Staking" value={usd(data.staking.rewardUsd)} note={data.staking.message} accent={data.staking.status === "WITH_DATA" ? "good" : "neutral"} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.85fr)", gap: 16, marginBottom: 24 }}>
        <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 4px" }}>Mis activos</h2>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Principales posiciones por costo en CLP.</p>
            </div>
            <Link href="/movements" style={{ color: "#0F766E", fontSize: 13, fontWeight: 850, textDecoration: "none" }}>Ver movimientos</Link>
          </div>

          {data.activos.length === 0 ? (
            <EmptyAssets />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {data.activos.map((asset) => (
                <div key={asset.symbol} style={{ alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "86px minmax(120px, 1fr) 120px", padding: "12px" }}>
                  <strong style={{ color: "#0F2A3D", fontSize: 15 }}>{asset.symbol}</strong>
                  <div>
                    <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, margin: "0 0 4px" }}>{clp(asset.totalCostClp)}</p>
                    <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{formatterNumber.format(asset.quantity)} unidades</p>
                  </div>
                  <p style={{ color: "#475569", fontSize: 13, fontWeight: 800, margin: 0, textAlign: "right" }}>{asset.portfolioSharePercent}%</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside style={{ display: "grid", gap: 16 }}>
          <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Estado tributario</h2>
              <StatusPill status={data.tributario.status} />
            </div>
            <p style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 6px" }}>{data.tributario.label}</p>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>{data.tributario.message}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Metric label="Ventas" value={String(data.tributario.totalSellMovements)} note="Movimientos SELL" accent={taxAccent} />
              <Metric label="Eventos" value={String(data.tributario.totalTaxEvents)} note="Eventos tributarios" accent={taxAccent} />
            </div>
          </article>

          <article style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, padding: 18 }}>
            <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }}>Próxima acción</p>
            <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, lineHeight: 1.25, margin: "0 0 8px" }}>{data.proximaAccion.label}</h2>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: "0 0 14px" }}>{data.proximaAccion.detail}</p>
            <Link href={data.proximaAccion.href} style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 12px", textDecoration: "none" }}>
              Abrir
            </Link>
          </article>
        </aside>
      </section>

      <section style={{ color: "#64748B", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12 }}>
        <span>FX: {clp(data.patrimonio.fx.usdToClp)}</span>
        <span>Fuente: {data.patrimonio.fx.source}</span>
        <span>Actualizado: {new Date(data.patrimonio.fx.asOf).toLocaleDateString("es-CL")}</span>
      </section>
    </div>
  );
}
