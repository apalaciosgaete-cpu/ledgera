"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppScreen from "@/shared/components/AppScreen";
import { httpClient, isHttpClientError } from "@/shared/http/httpClient";

type Log = {
  id: string;
  action: string;
  actorEmail: string | null;
  actorId: string | null;
  targetUserEmail: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

type AuditResponse = {
  ok: boolean;
  message: string;
  data: Log[];
};

type BinanceMeta = {
  provider?: string;
  status?: "SUCCESS" | "FAILED";
  connectionId?: string;
  importRecordId?: string;
  externalId?: string;
  externalType?: string;
  apiKeyHint?: string;
  accountType?: string;
  canTrade?: boolean;
  permissionsCount?: number;
  balancesWithFunds?: number;
  stats?: { imported: number; skipped: number; errors: number };
  error?: string;
};

type FilterGroup = {
  label: string;
  prefix: string | null;
  action?: string;
  color: string;
  disabled?: boolean;
};

const FILTER_GROUPS: FilterGroup[] = [
  { label: "Todas",          prefix: null,         color: "#334155" },
  { label: "Binance",        prefix: "BINANCE_",   color: "#B45309" },
  { label: "Usuarios",       prefix: "USER_",      color: "#1D4ED8" },
  { label: "Admin",          prefix: "ADMIN_",     color: "#B91C1C" },
  { label: "Declaraciones",  prefix: null,         color: "#6B7280", disabled: true },
  { label: "Configuración",  prefix: null,         color: "#6B7280", disabled: true },
];

function actionBadgeStyle(action: string): { background: string; color: string } {
  if (action.startsWith("BINANCE_")) return { background: "#FEF9C3", color: "#92400E" };
  if (action.startsWith("USER_"))    return { background: "#DBEAFE", color: "#1E3A8A" };
  if (action.startsWith("ADMIN_"))   return { background: "#FEE2E2", color: "#991B1B" };
  return { background: "#F1F5F9", color: "#334155" };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CL");
}

function stringifyMetadata(value: unknown): string {
  if (!value) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildCsvValue(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function exportLogsToCsv(logs: Log[]) {
  const rows = [
    ["Fecha", "Acción", "Actor email", "Actor ID", "Target email", "Target ID", "IP", "User agent", "Metadata"],
    ...logs.map((log) => [
      log.createdAt,
      log.action,
      log.actorEmail ?? "",
      log.actorId ?? "",
      log.targetUserEmail ?? "",
      log.targetUserId ?? "",
      log.ipAddress ?? "",
      log.userAgent ?? "",
      stringifyMetadata(log.metadata),
    ]),
  ];

  const csv = "﻿" + rows.map((row) => row.map(buildCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ledgera-admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function BinanceMetaSummary({ meta }: { meta: BinanceMeta }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {meta.status && (
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            background: meta.status === "SUCCESS" ? "#D1FAE5" : "#FEE2E2",
            color: meta.status === "SUCCESS" ? "#065F46" : "#991B1B",
          }}
        >
          {meta.status}
        </span>
      )}
      {meta.externalType && (
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{meta.externalType}</span>
      )}
      {meta.accountType && (
        <span style={{ fontSize: 11, color: "#475569" }}>tipo: {meta.accountType}</span>
      )}
      {meta.canTrade !== undefined && (
        <span style={{ fontSize: 11, color: "#475569" }}>
          trade: {meta.canTrade ? "sí" : "no"}
        </span>
      )}
      {meta.stats && (
        <span style={{ fontSize: 11, color: "#475569" }}>
          +{meta.stats.imported} / skip {meta.stats.skipped} / err {meta.stats.errors}
        </span>
      )}
      {meta.connectionId && (
        <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
          conn …{meta.connectionId.slice(-6)}
        </span>
      )}
      {meta.externalId && (
        <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
          {meta.externalId.length > 24 ? `${meta.externalId.slice(0, 24)}…` : meta.externalId}
        </span>
      )}
      {meta.error && (
        <span style={{ fontSize: 11, color: "#991B1B" }} title={meta.error}>
          {meta.error.length > 60 ? `${meta.error.slice(0, 60)}…` : meta.error}
        </span>
      )}
    </div>
  );
}

function MetadataCell({ log, expanded, onToggle }: { log: Log; expanded: boolean; onToggle: () => void }) {
  const isBinance = log.action.startsWith("BINANCE_");
  const meta = isBinance && log.metadata && typeof log.metadata === "object"
    ? (log.metadata as BinanceMeta)
    : null;

  return (
    <td style={{ padding: "12px 14px", minWidth: 320 }}>
      {meta && <div style={{ marginBottom: 6 }}><BinanceMetaSummary meta={meta} /></div>}

      <button
        type="button"
        onClick={onToggle}
        style={{
          border: "1px solid #CBD5E1",
          background: "#FFFFFF",
          borderRadius: 6,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 12,
          marginBottom: expanded ? 8 : 0,
        }}
      >
        {expanded ? "Ocultar metadata" : "Ver metadata"}
      </button>

      {expanded && (
        <pre
          style={{
            margin: 0,
            maxWidth: 520,
            maxHeight: 260,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            background: "#0F172A",
            color: "#E2E8F0",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
          }}
        >
          {stringifyMetadata(log.metadata)}
        </pre>
      )}
    </td>
  );
}

function buildUrl(group: FilterGroup): string {
  const base = "/api/admin/audit?limit=250";
  if (group.action)  return `${base}&action=${group.action}`;
  if (group.prefix)  return `${base}&actionPrefix=${group.prefix}`;
  return base;
}

export default function AdminAuditPage() {
  const router = useRouter();

  const [logs,       setLogs]       = useState<Log[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [query,      setQuery]      = useState("");
  const [groupIdx,   setGroupIdx]   = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedGroup = FILTER_GROUPS[groupIdx];

  const loadLogs = useCallback(async (group: FilterGroup) => {
    try {
      setLoading(true);
      setError(null);
      setExpandedId(null);

      const payload = await httpClient<AuditResponse>(buildUrl(group));
      setLogs(payload.data ?? []);
    } catch (err) {
      if (isHttpClientError(err)) {
        if (err.status === 401) { router.push("/login"); return; }
        if (err.status === 403) { setError("Acceso denegado. Se requiere rol administrador."); return; }
        if (err.status === 429) {
          setError(
            err.retryAfterSeconds
              ? `Demasiadas solicitudes. Intenta en ${err.retryAfterSeconds}s.`
              : "Demasiadas solicitudes. Intenta más tarde.",
          );
          return;
        }
        setError(err.message);
        return;
      }
      setError("Error inesperado al cargar auditoría.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!selectedGroup.disabled) {
      void loadLogs(selectedGroup);
    }
  }, [loadLogs, groupIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const searchable = [
        log.action,
        log.actorEmail,
        log.actorId,
        log.targetUserEmail,
        log.targetUserId,
        log.ipAddress,
        log.userAgent,
        stringifyMetadata(log.metadata),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [logs, query]);

  return (
    <AppScreen
      title="Auditoría administrativa"
      description="Trazabilidad operacional de eventos administrativos críticos."
    >
      <div style={{ display: "grid", gap: 16 }}>

        {/* Category filter bar */}
        <section style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTER_GROUPS.map((group, idx) => {
            const active = idx === groupIdx;
            return (
              <button
                key={group.label}
                type="button"
                disabled={group.disabled}
                onClick={() => { setGroupIdx(idx); setQuery(""); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: active ? `2px solid ${group.color}` : "2px solid transparent",
                  background: active ? group.color : "#F1F5F9",
                  color: active ? "#FFFFFF" : group.disabled ? "#9CA3AF" : "#334155",
                  cursor: group.disabled ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  opacity: group.disabled ? 0.55 : 1,
                  transition: "all 0.15s",
                }}
              >
                {group.label}
              </button>
            );
          })}
        </section>

        {/* Search + CSV */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por actor, target, IP, user agent o metadata"
            style={{
              minWidth: 340,
              padding: "10px 12px",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              fontSize: 14,
            }}
          />

          <button
            type="button"
            onClick={() => exportLogsToCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
            style={{
              padding: "10px 14px",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              background: "#FFFFFF",
              cursor: filteredLogs.length === 0 ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            Exportar CSV
          </button>
        </section>

        <section style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 13 }}>
          <span>Total cargado: {logs.length}</span>
          <span>Filtrado: {filteredLogs.length}</span>
        </section>

        {loading && <div>Cargando auditoría...</div>}

        {error && (
          <div
            style={{
              border: "1px solid #FCA5A5",
              background: "#FEF2F2",
              color: "#991B1B",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 12 }}>
            <table
              style={{ width: "100%", minWidth: 1400, borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Fecha", "Acción", "Actor", "Target", "IP", "User agent", "Metadata"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderBottom: "1px solid #E2E8F0",
                        color: "#334155",
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, color: "#64748B" }}>
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const expanded = expandedId === log.id;
                    const badge = actionBadgeStyle(log.action);

                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {formatDate(log.createdAt)}
                        </td>

                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: badge.background,
                              color: badge.color,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td style={{ padding: "12px 14px" }}>
                          <div>{log.actorEmail ?? "-"}</div>
                          <div style={{ color: "#94A3B8", fontSize: 11 }}>{log.actorId ?? "-"}</div>
                        </td>

                        <td style={{ padding: "12px 14px" }}>
                          <div>{log.targetUserEmail ?? "-"}</div>
                          <div style={{ color: "#94A3B8", fontSize: 11 }}>{log.targetUserId ?? "-"}</div>
                        </td>

                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {log.ipAddress ?? "-"}
                        </td>

                        <td style={{ padding: "12px 14px", maxWidth: 300 }}>
                          <div
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={log.userAgent ?? undefined}
                          >
                            {log.userAgent ?? "-"}
                          </div>
                        </td>

                        <MetadataCell
                          log={log}
                          expanded={expanded}
                          onToggle={() => setExpandedId(expanded ? null : log.id)}
                        />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppScreen>
  );
}
