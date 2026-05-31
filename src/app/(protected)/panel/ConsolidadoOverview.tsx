"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AssetLogo } from "./AssetLogo";
import { AssetSearch } from "./AssetSearch";

type Position = {
  symbol: string;
  quantity: number;
  totalCostUsd: number;
  totalCostClp: number;
  boughtQuantity?: number;
  soldQuantity?: number;
  stakingRewardQuantity?: number;
  buyCostUsd?: number;
  sellProceedsUsd?: number;
  stakingRewardValueUsd?: number;
  capitalContributedUsd?: number;
};

type PageData = {
  patrimonioClp: number;
  activos: number;
  totalVentasUsd: number;
  totalCapitalAportadoUsd: number;
  totalRecompensasStakingUsd: number;
  dolar: number;
  estadoTributario: string;
  estadoAuditoria: string;
  posiciones: Position[];
};

function clp(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function number(value: number) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 8 }).format(value || 0);
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem" }}>
      <p style={{ margin: "0 0 6px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
      <p style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 800 }}>{value}</p>
      <p style={{ margin: 0, color: "#94A3B8", fontSize: 12 }}>{note}</p>
    </div>
  );
}

function Status({ title, value, note, href }: { title: string; value: string; note: string; href: string }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem" }}>
      <p style={{ margin: "0 0 6px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
      <p style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 800 }}>{value}</p>
      <p style={{ margin: "0 0 12px", color: "#475569", fontSize: "0.85rem" }}>{note}</p>
      <Link href={href} style={{ color: "#0F2A3D", fontSize: "0.85rem", fontWeight: 800, textDecoration: "none" }}>Ver detalle</Link>
    </section>
  );
}

function CardStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p style={{ margin: "0 0 4px", color: "#94A3B8", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, color: strong ? "#0F2A3D" : "#334155", fontSize: strong ? "1rem" : "0.92rem", fontWeight: strong ? 900 : 750 }}>{value}</p>
    </div>
  );
}

function AssetCard({ position }: { position: Position }) {
  const capitalUsd = position.capitalContributedUsd ?? position.buyCostUsd ?? 0;
  const stakingUsd = position.stakingRewardValueUsd || 0;

  return (
    <article style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, boxShadow: "0 14px 36px rgba(15, 42, 61, 0.06)", padding: "1.1rem" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          <AssetLogo symbol={position.symbol} />
          <div>
            <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontSize: "1.1rem", fontWeight: 900 }}>{position.symbol}</p>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.78rem", fontWeight: 700 }}>Activo consolidado</p>
          </div>
        </div>
        <strong style={{ color: "#0F2A3D", fontSize: "0.9rem" }}>{number(position.quantity)}</strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.9rem", marginBottom: "1rem" }}>
        <CardStat label="Comprado" value={number(position.boughtQuantity || 0)} />
        <CardStat label="Vendido" value={number(position.soldQuantity || 0)} />
        <CardStat label="Posicion actual" value={number(position.quantity)} strong />
        <CardStat label="Costo actual CLP" value={clp(position.totalCostClp)} strong />
      </div>

      <div style={{ borderTop: "1px solid #EEF2F7", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.9rem", paddingTop: "1rem" }}>
        <CardStat label="Capital aportado" value={usd(capitalUsd)} strong />
        <CardStat label="Staking" value={usd(stakingUsd)} />
        <CardStat label="Ventas acumuladas" value={usd(position.sellProceedsUsd || 0)} />
        <CardStat label="Costo compras" value={usd(position.buyCostUsd || 0)} />
      </div>
    </article>
  );
}

function resolveTaxStatus(status: string) {
  if (status === "OK") return "Al dia";
  if (status === "REVIEW") return "Revision recomendada";
  return "Atencion requerida";
}

export function ConsolidadoOverview() {
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const loadSecondaryStatus = useCallback(async () => {
    setSecondaryLoading(true);

    try {
      const [taxResult, integrityResult] = await Promise.allSettled([
        fetch("/api/tax/health", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/tax/events/integrity", { cache: "no-store" }).then((response) => response.json()),
      ]);

      setData((current) => {
        if (!current) return current;
        let estadoTributario = current.estadoTributario;
        let estadoAuditoria = current.estadoAuditoria;

        if (taxResult.status === "fulfilled" && taxResult.value?.ok) {
          estadoTributario = resolveTaxStatus(String(taxResult.value.data.status));
        }

        if (integrityResult.status === "fulfilled" && integrityResult.value?.ok) {
          const auditIssues = Number(integrityResult.value.data.summary.orphanEvents || 0) + Number(integrityResult.value.data.summary.sellWithoutEvent || 0);
          estadoAuditoria = auditIssues > 0 ? "Revision pendiente" : "Consistente";
        }

        return { ...current, estadoTributario, estadoAuditoria };
      });
    } finally {
      setSecondaryLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setError("");
      const portfolioRes = await fetch("/api/portfolio", { cache: "no-store" });
      const portfolioJson = await portfolioRes.json();

      if (!portfolioJson.ok) throw new Error(portfolioJson.message || "No se pudo cargar el patrimonio.");

      setData({
        patrimonioClp: portfolioJson.data.totals.totalCostClp,
        activos: portfolioJson.data.totals.symbolCount,
        totalVentasUsd: portfolioJson.data.totals.totalSellProceedsUsd || 0,
        totalCapitalAportadoUsd: portfolioJson.data.totals.totalCapitalContributedUsd || portfolioJson.data.totals.totalBuyCostUsd || 0,
        totalRecompensasStakingUsd: portfolioJson.data.totals.totalStakingRewardValueUsd || 0,
        dolar: portfolioJson.data.fx.usdToClp,
        estadoTributario: "Calculando...",
        estadoAuditoria: "Calculando...",
        posiciones: [...portfolioJson.data.positions].sort((a: Position, b: Position) => (b.totalCostClp || 0) - (a.totalCostClp || 0)),
      });

      void loadSecondaryStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el consolidado.");
    }
  }, [loadSecondaryStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p style={{ color: "#DC2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return <p style={{ color: "#64748B" }}>Cargando consolidado...</p>;

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 800 }}>Consolidado</h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>Vista financiera agregada desde el Libro Financiero.</p>
        </div>
        <Link href="/integraciones" style={{ background: "#0F2A3D", color: "#fff", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, textDecoration: "none" }}>Administrar conexiones</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <Metric title="Patrimonio estimado" value={clp(data.patrimonioClp)} note="Posicion actual valorizada a costo." />
        <Metric title="Activos" value={String(data.activos)} note="Activos con posicion actual." />
        <Metric title="Capital aportado" value={usd(data.totalCapitalAportadoUsd)} note="Compras y depositos valorizados." />
        <Metric title="Staking" value={usd(data.totalRecompensasStakingUsd)} note="Rendimientos separados del capital." />
        <Metric title="Ventas USD" value={usd(data.totalVentasUsd)} note="Total vendido desde la ingesta." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <Status title="Estado tributario" value={data.estadoTributario} note={secondaryLoading ? "Validando estado tributario..." : "Revision general de tu situacion tributaria."} href="/tributario" />
        <Status title="Estado de auditoria" value={data.estadoAuditoria} note={secondaryLoading ? "Validando consistencia..." : "Consistencia de la informacion procesada."} href="/auditoria" />
        <Status title="Dolar usado" value={clp(data.dolar)} note="Referencia para mostrar valores en pesos." href="/consolidado" />
      </div>

      <AssetSearch onMovementCreated={load} />

      <section id="activos-principales" style={{ scrollMarginTop: "96px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Activos consolidados</h2>
          <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>Cards agregadas por activo, sin detalle transaccional ni calculo tributario.</p>
        </div>

        {data.posiciones.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "3rem 1.5rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", color: "#0F2A3D", fontWeight: 800 }}>Aun no hay informacion financiera cargada</p>
            <Link href="/integraciones" style={{ color: "#16A34A", fontWeight: 800, textDecoration: "none" }}>Configurar conexiones</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {data.posiciones.map((position) => (
              <AssetCard key={position.symbol} position={position} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
