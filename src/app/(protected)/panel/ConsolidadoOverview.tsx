"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/shared/http/httpClient";
import { AssetSearch } from "./AssetSearch";

type PageData = {
  patrimonioClp: number;
  activos: number;
  costoUsd: number;
  dolar: number;
  estadoTributario: string;
  estadoAuditoria: string;
  hiddenAssets: string[];
  posiciones: Array<{
    symbol: string;
    quantity: number;
    totalCostUsd: number;
    totalCostClp: number;
  }>;
};

type AssetVisibilityResponse = {
  ok: boolean;
  message: string;
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

function resolveTaxStatus(status: string) {
  if (status === "OK") return "Al día";
  if (status === "REVIEW") return "Revisión recomendada";
  return "Atención requerida";
}

export function ConsolidadoOverview() {
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actingSymbol, setActingSymbol] = useState<string | null>(null);

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
          estadoAuditoria = auditIssues > 0 ? "Revisión pendiente" : "Consistente";
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
        costoUsd: portfolioJson.data.totals.totalCostUsd,
        dolar: portfolioJson.data.fx.usdToClp,
        estadoTributario: "Calculando...",
        estadoAuditoria: "Calculando...",
        hiddenAssets: Array.isArray(portfolioJson.data.hiddenAssets) ? portfolioJson.data.hiddenAssets : [],
        posiciones: [...portfolioJson.data.positions].sort((a, b) => b.totalCostClp - a.totalCostClp).slice(0, 8),
      });

      void loadSecondaryStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el consolidado.");
    }
  }, [loadSecondaryStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function hideAsset(symbol: string) {
    if (actingSymbol) return;
    const reason = window.prompt(`Motivo para ocultar ${symbol} del consolidado:`);
    const normalizedReason = String(reason ?? "").trim();
    if (!normalizedReason) {
      setActionMessage("Acción cancelada. El motivo es obligatorio.");
      return;
    }
    setActingSymbol(symbol);
    setActionMessage("");
    try {
      const response = await httpClient<AssetVisibilityResponse>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, {
        method: "DELETE",
        body: { reason: normalizedReason },
      });
      setActionMessage(response.message || `Activo ${symbol} ocultado.`);
      await load();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : `No fue posible ocultar ${symbol}.`);
    } finally {
      setActingSymbol(null);
    }
  }

  async function restoreAsset(symbol: string) {
    if (actingSymbol) return;
    setActingSymbol(symbol);
    setActionMessage("");
    try {
      const response = await httpClient<AssetVisibilityResponse>(`/api/portfolio/assets/${encodeURIComponent(symbol)}`, { method: "PATCH" });
      setActionMessage(response.message || `Activo ${symbol} restaurado.`);
      await load();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : `No fue posible restaurar ${symbol}.`);
    } finally {
      setActingSymbol(null);
    }
  }

  if (error) return <p style={{ color: "#DC2626", fontWeight: 700 }}>{error}</p>;
  if (!data) return <p style={{ color: "#64748B" }}>Cargando consolidado...</p>;

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 800 }}>Consolidado</h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>Resumen general de tu patrimonio, actividad financiera y estado tributario.</p>
        </div>
        <Link href="/integraciones" style={{ background: "#0F2A3D", color: "#fff", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, textDecoration: "none" }}>Administrar conexiones</Link>
      </div>

      {actionMessage && <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 12, color: "#334155", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem", padding: "0.85rem 1rem" }}>{actionMessage}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <Metric title="Patrimonio estimado" value={clp(data.patrimonioClp)} note="Valor calculado con la información disponible." />
        <Metric title="Activos" value={String(data.activos)} note="Activos visibles en el consolidado." />
        <Metric title="Costo total USD" value={usd(data.costoUsd)} note="Base de costo histórica visible." />
        <Metric title="Dólar usado" value={clp(data.dolar)} note="Referencia para mostrar valores en pesos." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <Status title="Estado tributario" value={data.estadoTributario} note={secondaryLoading ? "Validando estado tributario..." : "Revisión general de tu situación tributaria."} href="/tributario" />
        <Status title="Estado de auditoría" value={data.estadoAuditoria} note={secondaryLoading ? "Validando consistencia..." : "Consistencia de la información procesada."} href="/auditoria" />
        <Status title="Conexiones" value="Fuentes de datos" note="Bancos, exchanges y billeteras conectadas." href="/integraciones" />
      </div>

      <AssetSearch onMovementCreated={load} />

      <section id="activos-principales" style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden", scrollMarginTop: "96px", boxShadow: "0 10px 30px rgba(15, 42, 61, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "1rem 1.25rem", borderBottom: "1px solid #E2E8F0", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Activos principales</h2>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>Activos visibles en tu consolidado patrimonial.</p>
          </div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.78rem", fontWeight: 700 }}>Ocultar no modifica el libro financiero.</p>
        </div>

        {data.posiciones.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", color: "#0F2A3D", fontWeight: 800 }}>No hay activos visibles en el consolidado</p>
            <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>Agrega activos o restaura activos ocultos para verlos nuevamente.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead style={{ background: "#F8FAFC" }}><tr>{["Activo", "Cantidad", "Costo USD", "Costo CLP", "Acción"].map((heading) => <th key={heading} style={{ textAlign: heading === "Acción" ? "right" : "left", padding: "0.9rem 1rem", color: "#64748B", fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>{heading}</th>)}</tr></thead>
            <tbody>{data.posiciones.map((position) => {
              const isActing = actingSymbol === position.symbol;
              return (
                <tr key={position.symbol} style={{ borderTop: "1px solid #EEF2F7" }}>
                  <td style={{ padding: "0.95rem 1rem", fontWeight: 900, color: "#0F2A3D" }}>{position.symbol}</td>
                  <td style={{ padding: "0.95rem 1rem", color: "#334155" }}>{number(position.quantity)}</td>
                  <td style={{ padding: "0.95rem 1rem", color: "#334155" }}>{usd(position.totalCostUsd)}</td>
                  <td style={{ padding: "0.95rem 1rem", color: "#0F2A3D", fontWeight: 800 }}>{clp(position.totalCostClp)}</td>
                  <td style={{ padding: "0.95rem 1rem", textAlign: "right" }}><button type="button" onClick={() => void hideAsset(position.symbol)} disabled={Boolean(actingSymbol)} style={{ background: isActing ? "#E2E8F0" : "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 999, color: isActing ? "#94A3B8" : "#0F2A3D", cursor: actingSymbol ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 900, padding: "0.5rem 0.85rem" }}>{isActing ? "Ocultando..." : "Ocultar"}</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </section>

      {data.hiddenAssets.length > 0 && (
        <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, marginTop: "1rem", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #E2E8F0" }}>
            <h2 style={{ margin: "0 0 3px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Activos ocultos</h2>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.82rem" }}>Puedes restaurarlos sin alterar movimientos históricos.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, padding: "1rem" }}>{data.hiddenAssets.map((symbol) => {
            const isActing = actingSymbol === symbol;
            return <div key={symbol} style={{ alignItems: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, display: "flex", justifyContent: "space-between", gap: 10, padding: "0.85rem" }}><span style={{ color: "#0F2A3D", fontWeight: 900 }}>{symbol}</span><button type="button" onClick={() => void restoreAsset(symbol)} disabled={Boolean(actingSymbol)} style={{ background: isActing ? "#E2E8F0" : "#0F2A3D", border: "none", borderRadius: 999, color: "#fff", cursor: actingSymbol ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 900, padding: "0.45rem 0.75rem" }}>{isActing ? "Restaurando..." : "Restaurar"}</button></div>;
          })}</div>
        </section>
      )}
    </div>
  );
}
