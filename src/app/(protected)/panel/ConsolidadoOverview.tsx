"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PageData = {
  costoActualClp: number;
  activosConPosicion: number;
  totalCapitalAportadoUsd: number;
  totalRecompensasStakingUsd: number;
  totalVentasUsd: number;
  dolar: number;
  estadoTributario: string;
  estadoAuditoria: string;
};

function clp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
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

function ActionCard({ title, value, note, href }: { title: string; value: string; note: string; href: string }) {
  return (
    <Link href={href} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, display: "block", padding: "1rem", textDecoration: "none" }}>
      <p style={{ margin: "0 0 6px", color: "#64748B", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</p>
      <p style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 850 }}>{value}</p>
      <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>{note}</p>
    </Link>
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

  useEffect(() => {
    async function load() {
      try {
        setError("");

        const [portfolioRes, taxRes, integrityRes] = await Promise.all([
          fetch("/api/portfolio", { cache: "no-store" }),
          fetch("/api/tax/health", { cache: "no-store" }),
          fetch("/api/tax/events/integrity", { cache: "no-store" }),
        ]);

        const [portfolioJson, taxJson, integrityJson] = await Promise.all([
          portfolioRes.json(),
          taxRes.json(),
          integrityRes.json(),
        ]);

        if (!portfolioJson.ok) throw new Error(portfolioJson.message || "No se pudo cargar el consolidado.");

        const totals = portfolioJson.data.totals;
        const auditIssues = integrityJson.ok
          ? Number(integrityJson.data.summary.orphanEvents || 0) + Number(integrityJson.data.summary.sellWithoutEvent || 0)
          : 0;

        setData({
          costoActualClp: totals.totalCostClp || 0,
          activosConPosicion: totals.symbolCount || 0,
          totalCapitalAportadoUsd: totals.totalCapitalContributedUsd || totals.totalBuyCostUsd || 0,
          totalRecompensasStakingUsd: totals.totalStakingRewardValueUsd || 0,
          totalVentasUsd: totals.totalSellProceedsUsd || 0,
          dolar: portfolioJson.data.fx.usdToClp || 0,
          estadoTributario: taxJson.ok ? resolveTaxStatus(String(taxJson.data.status)) : "No disponible",
          estadoAuditoria: auditIssues > 0 ? "Revision pendiente" : "Consistente",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el consolidado.");
      }
    }

    void load();
  }, []);

  if (error) return <p style={{ color: "#DC2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return <p style={{ color: "#64748B" }}>Cargando consolidado...</p>;

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 800 }}>Consolidado</h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>
            Resumen financiero ejecutivo derivado del Libro Financiero. No muestra movimientos, activos individuales ni calculos tributarios.
          </p>
        </div>

        <Link href="/integraciones" style={{ background: "#0F2A3D", color: "#fff", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, textDecoration: "none" }}>
          Administrar conexiones
        </Link>
      </div>

      <section style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <Metric title="Costo actual consolidado" value={clp(data.costoActualClp)} note="Posicion actual valorizada a costo, no a mercado." />
          <Metric title="Capital aportado" value={usd(data.totalCapitalAportadoUsd)} note="Compras y depositos valorizados desde movimientos." />
          <Metric title="Recompensas staking" value={usd(data.totalRecompensasStakingUsd)} note="Rendimientos separados del capital aportado." />
          <Metric title="Ventas acumuladas" value={usd(data.totalVentasUsd)} note="Ventas brutas; no equivalen a utilidad." />
          <Metric title="Activos con posicion" value={String(data.activosConPosicion)} note="Cantidad de activos actualmente abiertos." />
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Estado operativo</h2>
          <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>
            El Consolidado solo resume. La revision transaccional, tributaria y de auditoria vive en sus modulos correspondientes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          <Metric title="Tributario" value={data.estadoTributario} note="Estado general de revision fiscal." />
          <Metric title="Auditoria" value={data.estadoAuditoria} note="Consistencia operacional derivada de eventos." />
          <Metric title="Tipo de cambio" value={clp(data.dolar)} note="Referencia tecnica usada para convertir USD a CLP." />
        </div>
      </section>

      <section>
        <div style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Acciones</h2>
          <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>
            Usa cada modulo para operar, declarar o demostrar. El Consolidado no recibe datos manuales.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          <ActionCard title="Libro financiero" value="Revisar movimientos" note="Origen operativo de todos los calculos." href="/libro-financiero" />
          <ActionCard title="Tributario" value="Preparar declaracion" note="Clasificacion y revision fiscal." href="/tributario" />
          <ActionCard title="Auditoria" value="Ver trazabilidad" note="Consistencia, evidencia y control." href="/auditoria" />
          <ActionCard title="Conexiones" value="Gestionar fuentes" note="Exchanges, bancos y billeteras." href="/integraciones" />
        </div>
      </section>
    </div>
  );
}
