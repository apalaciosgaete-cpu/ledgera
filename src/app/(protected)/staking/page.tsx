"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp, usd, percent, formatterNumber, date } from "@/shared/formatting";

type StakingData = {
  status: "WITH_DATA" | "PLACEHOLDER";
  totals: {
    rewardUsd: number;
    rewardClp: number;
    quantity: number;
    eventCount: number;
    assetCount: number;
  };
  byAsset: {
    symbol: string;
    quantity: number;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
    lastRewardAt: string;
    sharePercent: number;
  }[];
  bySource: {
    source: string;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
  }[];
  byYear: {
    year: number;
    rewardUsd: number;
    rewardClp: number;
    eventCount: number;
  }[];
  recentRewards: {
    id: string;
    symbol: string;
    quantity: number;
    priceUsd: number;
    rewardUsd: number;
    rewardClp: number;
    source: string;
    executedAt: string;
  }[];
  taxNote: {
    label: string;
    detail: string;
  };
  fx: {
    usdToClp: number;
    source: string;
    asOf: string;
  };
};

function Metric({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "neutral" | "good" | "info" }) {
  const color = tone === "good" ? "#15803D" : tone === "info" ? "#0F766E" : "#0F2A3D";

  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

function EmptyState() {
  return (
    <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
      <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Todavia no hay staking registrado</h2>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 560 }}>
        Importa o registra movimientos STAKING_REWARD para ver recompensas por activo, fuente y periodo.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Importar rewards
        </Link>
        <Link href="/movements" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Ver movimientos
        </Link>
      </div>
    </section>
  );
}

function SmallBreakdown({ title, rows }: { title: string; rows: { key: string; label: string; amount: number; count: number }[] }) {
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
      <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Sin datos.</p>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {rows.map((row) => (
            <div key={row.key} style={{ alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, display: "flex", gap: 12, justifyContent: "space-between", padding: "11px 12px" }}>
              <div>
                <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 3px" }}>{row.label}</p>
                <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{row.count} eventos</p>
              </div>
              <strong style={{ color: "#15803D", fontSize: 14 }}>{clp(row.amount)}</strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function StakingPage() {
  const [data, setData] = useState<StakingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const response = await fetch("/api/investor/staking", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok || !json.ok) {
          throw new Error(json.message || "No se pudo cargar staking.");
        }

        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar staking.");
      }
    }

    void load();
  }, []);

  if (error) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando staking...</p>;
  }

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Staking simple</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Rewards, origen y monto tributable</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Vista directa de recompensas registradas como STAKING_REWARD para entender cuanto generaron y donde revisar.
          </p>
        </div>

        <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al dashboard
        </Link>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
        <Metric label="Rewards totales" value={clp(data.totals.rewardClp)} note={`${usd(data.totals.rewardUsd)} estimado`} tone={data.status === "WITH_DATA" ? "good" : "neutral"} />
        <Metric label="Eventos" value={String(data.totals.eventCount)} note="Movimientos STAKING_REWARD" tone="info" />
        <Metric label="Activos con staking" value={String(data.totals.assetCount)} note={`${formatterNumber.format(data.totals.quantity)} unidades recibidas`} />
      </section>

      <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, marginBottom: 20, padding: 16 }}>
        <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 5px" }}>{data.taxNote.label}</p>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{data.taxNote.detail}</p>
      </section>

      {data.status === "PLACEHOLDER" ? (
        <EmptyState />
      ) : (
        <>
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 18, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: 780, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Cantidad reward</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Valor CLP</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Eventos</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Peso</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px", textAlign: "right" }}>Ultimo reward</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byAsset.map((asset) => (
                    <tr key={asset.symbol} style={{ borderTop: "1px solid #E2E8F0" }}>
                      <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, padding: "14px" }}>{asset.symbol}</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{formatterNumber.format(asset.quantity)}</td>
                      <td style={{ color: "#15803D", fontSize: 13, fontWeight: 850, padding: "14px", textAlign: "right" }}>{clp(asset.rewardClp)}</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{asset.eventCount}</td>
                      <td style={{ color: "#64748B", fontSize: 13, fontWeight: 750, padding: "14px", textAlign: "right" }}>{asset.sharePercent}%</td>
                      <td style={{ color: "#334155", fontSize: 13, padding: "14px", textAlign: "right" }}>{date(asset.lastRewardAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", marginBottom: 18 }}>
            <SmallBreakdown
              title="Por periodo"
              rows={data.byYear.map((item) => ({ key: String(item.year), label: String(item.year), amount: item.rewardClp, count: item.eventCount }))}
            />
            <SmallBreakdown
              title="Por fuente"
              rows={data.bySource.map((item) => ({ key: item.source, label: item.source, amount: item.rewardClp, count: item.eventCount }))}
            />
          </section>

          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
            <h2 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 12px" }}>Ultimos rewards</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {data.recentRewards.map((reward) => (
                <div key={reward.id} style={{ alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "minmax(74px, 0.7fr) minmax(140px, 1fr) minmax(120px, 1fr) minmax(96px, 0.8fr)", padding: "12px" }}>
                  <strong style={{ color: "#0F2A3D", fontSize: 14 }}>{reward.symbol}</strong>
                  <span style={{ color: "#334155", fontSize: 13 }}>{formatterNumber.format(reward.quantity)} a {usd(reward.priceUsd)}</span>
                  <span style={{ color: "#15803D", fontSize: 13, fontWeight: 850 }}>{clp(reward.rewardClp)}</span>
                  <span style={{ color: "#64748B", fontSize: 12, textAlign: "right" }}>{date(reward.executedAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section style={{ color: "#64748B", display: "flex", flexWrap: "wrap", fontSize: 12, gap: 12, marginTop: 14 }}>
        <span>FX: {clp(data.fx.usdToClp)}</span>
        <span>Fuente FX: {data.fx.source}</span>
        <span>Actualizado: {date(data.fx.asOf)}</span>
      </section>
    </div>
  );
}
