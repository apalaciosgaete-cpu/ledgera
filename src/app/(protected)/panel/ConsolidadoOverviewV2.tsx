"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AssetSearch } from "./AssetSearch";

type Position = { symbol: string; quantity: number; totalCostUsd: number; totalCostClp: number };
type Data = {
  patrimonioClp: number;
  activos: number;
  costoUsd: number;
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

function num(value: number) {
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

function AssetsTable({ positions }: { positions: Position[] }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", marginBottom: "1.5rem" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #E2E8F0" }}>
        <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Activos principales</h2>
        <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>Detalle resumido de los saldos calculados.</p>
      </div>
      {positions.length === 0 ? (
        <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", color: "#0F2A3D", fontWeight: 800 }}>Aún no hay información financiera cargada</p>
          <Link href="/integraciones" style={{ color: "#16A34A", fontWeight: 800, textDecoration: "none" }}>Configurar conexiones</Link>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead><tr>{["Activo", "Cantidad", "Costo USD", "Costo CLP"].map((h) => <th key={h} style={{ textAlign: "left", padding: "0.85rem 1rem", color: "#64748B", fontSize: "0.75rem" }}>{h}</th>)}</tr></thead>
          <tbody>{positions.map((p) => <tr key={p.symbol}><td style={{ padding: "0.85rem 1rem", fontWeight: 800 }}>{p.symbol}</td><td style={{ padding: "0.85rem 1rem" }}>{num(p.quantity)}</td><td style={{ padding: "0.85rem 1rem" }}>{usd(p.totalCostUsd)}</td><td style={{ padding: "0.85rem 1rem", fontWeight: 800 }}>{clp(p.totalCostClp)}</td></tr>)}</tbody>
        </table>
      )}
    </section>
  );
}

export function ConsolidadoOverviewV2() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [portfolioRes, taxRes, integrityRes] = await Promise.all([fetch("/api/portfolio"), fetch("/api/tax/health"), fetch("/api/tax/events/integrity")]);
        const [portfolioJson, taxJson, integrityJson] = await Promise.all([portfolioRes.json(), taxRes.json(), integrityRes.json()]);
        if (!portfolioJson.ok) throw new Error(portfolioJson.message || "No se pudo cargar el patrimonio.");
        if (!taxJson.ok) throw new Error(taxJson.message || "No se pudo cargar el estado tributario.");
        if (!integrityJson.ok) throw new Error(integrityJson.message || "No se pudo cargar auditoría.");
        const taxStatus = taxJson.data.status === "OK" ? "Al día" : taxJson.data.status === "REVIEW" ? "Revisión recomendada" : "Atención requerida";
        const auditIssues = Number(integrityJson.data.summary.orphanEvents || 0) + Number(integrityJson.data.summary.sellWithoutEvent || 0);
        setData({ patrimonioClp: portfolioJson.data.totals.totalCostClp, activos: portfolioJson.data.totals.symbolCount, costoUsd: portfolioJson.data.totals.totalCostUsd, dolar: portfolioJson.data.fx.usdToClp, estadoTributario: taxStatus, estadoAuditoria: auditIssues > 0 ? "Revisión pendiente" : "Consistente", posiciones: [...portfolioJson.data.positions].sort((a, b) => b.totalCostClp - a.totalCostClp).slice(0, 8) });
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
        <div><h1 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 800 }}>Consolidado</h1><p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>Resumen general de tu patrimonio, actividad financiera y estado tributario.</p></div>
        <Link href="/integraciones" style={{ background: "#0F2A3D", color: "#fff", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, textDecoration: "none" }}>Administrar conexiones</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}><Metric title="Patrimonio estimado" value={clp(data.patrimonioClp)} note="Valor calculado con la información disponible." /><Metric title="Activos" value={String(data.activos)} note="Activos con saldo registrado." /><Metric title="Costo total USD" value={usd(data.costoUsd)} note="Base de costo histórica." /><Metric title="Dólar usado" value={clp(data.dolar)} note="Referencia para mostrar valores en pesos." /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "1.5rem" }}><Status title="Estado tributario" value={data.estadoTributario} note="Revisión general de tu situación tributaria." href="/tributario" /><Status title="Estado de auditoría" value={data.estadoAuditoria} note="Consistencia de la información procesada." href="/auditoria" /><Status title="Conexiones" value="Fuentes de datos" note="Bancos, exchanges y billeteras conectadas." href="/integraciones" /></div>
      <AssetsTable positions={data.posiciones} />
      <AssetSearch />
    </div>
  );
}
