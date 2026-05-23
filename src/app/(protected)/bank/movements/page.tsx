"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionToken } from "@/modules/identity/client/authStorage";

// ── Types ─────────────────────────────────────────────────────────────────────
type Direction = "INFLOW" | "OUTFLOW";
type Status    = "IMPORTED" | "REVIEWED" | "IGNORED";

type BankMovement = {
  id:          string;
  bankName:    string | null;
  occurredAt:  string;
  description: string;
  amountClp:   number;
  direction:   Direction;
  balanceClp:  number | null;
  status:      Status;
};

type MovementsResponse = {
  movements:  BankMovement[];
  total:      number;
  page:       number;
  totalPages: number;
};

type Filters = {
  direction: string;
  status:    string;
  bankName:  string;
  q:         string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style:                 "currency",
    currency:              "CLP",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchMovements(
  filters: Filters,
  page:    number,
  limit:   number,
): Promise<MovementsResponse> {
  const params = new URLSearchParams();
  params.set("page",  String(page));
  params.set("limit", String(limit));
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.status)    params.set("status",    filters.status);
  if (filters.bankName)  params.set("bankName",  filters.bankName);
  if (filters.q)         params.set("q",         filters.q);

  const token = getSessionToken();
  const res   = await fetch(`/api/bank/movements?${params.toString()}`, {
    credentials: "include",
    headers: { "Authorization": token ? `Bearer ${token}` : "" },
  });
  const json = await res.json() as { ok: boolean; data: MovementsResponse };
  if (!json.ok) throw new Error("Error al cargar movimientos");
  return json.data;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const LIMIT = 50;

const DIRECTION_META: Record<Direction, { label: string; color: string; bg: string }> = {
  INFLOW:  { label: "ABONO", color: "#16A34A", bg: "rgba(22,163,74,0.1)"  },
  OUTFLOW: { label: "CARGO", color: "#DC2626", bg: "rgba(220,38,38,0.1)"  },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  IMPORTED: { label: "Importado", color: "#64748B", bg: "#F1F5F9" },
  REVIEWED: { label: "Revisado",  color: "#2563EB", bg: "rgba(59,130,246,0.1)" },
  IGNORED:  { label: "Ignorado",  color: "#94A3B8", bg: "#F8FAFC" },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BankMovementsPage() {
  const [filters,  setFilters]  = useState<Filters>({ direction: "", status: "", bankName: "", q: "" });
  const [draft,    setDraft]    = useState("");
  const [page,     setPage]     = useState(1);
  const [data,     setData]     = useState<MovementsResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMovements(f, p, LIMIT);
      setData(res);
    } catch {
      setError("No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

  function applyFilter(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter({ q: draft.trim() });
  }

  const movements = data?.movements ?? [];
  const total     = data?.total     ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div style={{
      minHeight:  "100vh",
      background: "#E8EEF5",
      padding:    "40px 24px",
      fontFamily: "var(--font-body, system-ui, sans-serif)",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{
              fontSize:   "22px",
              fontWeight: 700,
              color:      "#0F2A3D",
              margin:     "0 0 4px",
              fontFamily: "var(--font-display, system-ui, sans-serif)",
            }}>
              Movimientos bancarios
            </h1>
            <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
              {loading ? "Cargando…" : `${total.toLocaleString("es-CL")} movimientos`}
            </p>
          </div>

          <a href="/import/bank" style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          "6px",
            height:       "38px",
            padding:      "0 18px",
            background:   "#16A34A",
            color:        "#FFFFFF",
            borderRadius: "8px",
            fontSize:     "13px",
            fontWeight:   600,
            textDecoration: "none",
          }}>
            + Importar cartola
          </a>
        </div>

        {/* ── Filtros ────────────────────────────────────────────────────────── */}
        <div style={{
          background:   "#FFFFFF",
          border:       "1px solid #E2E8F0",
          borderRadius: "10px",
          padding:      "14px 20px",
          marginBottom: "16px",
          display:      "flex",
          gap:          "12px",
          flexWrap:     "wrap",
          alignItems:   "center",
        }}>

          {/* Búsqueda */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "6px", flex: 1, minWidth: "200px" }}>
            <input
              type="text"
              placeholder="Buscar descripción…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{
                flex:         1,
                height:       "36px",
                border:       "1px solid #E2E8F0",
                borderRadius: "6px",
                padding:      "0 12px",
                fontSize:     "13px",
                color:        "#0F2A3D",
                background:   "#F8FAFC",
                outline:      "none",
              }}
            />
            <button type="submit" style={{
              height:       "36px",
              padding:      "0 14px",
              background:   "#0F2A3D",
              color:        "#FFF",
              border:       "none",
              borderRadius: "6px",
              fontSize:     "13px",
              fontWeight:   600,
              cursor:       "pointer",
            }}>
              Buscar
            </button>
          </form>

          {/* Dirección */}
          <FilterSelect
            value={filters.direction}
            onChange={v => applyFilter({ direction: v })}
            options={[
              { value: "",        label: "Todas las direcciones" },
              { value: "INFLOW",  label: "Abonos"  },
              { value: "OUTFLOW", label: "Cargos"  },
            ]}
          />

          {/* Estado */}
          <FilterSelect
            value={filters.status}
            onChange={v => applyFilter({ status: v })}
            options={[
              { value: "",         label: "Todos los estados" },
              { value: "IMPORTED", label: "Importado" },
              { value: "REVIEWED", label: "Revisado"  },
              { value: "IGNORED",  label: "Ignorado"  },
            ]}
          />

          {/* Limpiar */}
          {(filters.direction || filters.status || filters.bankName || filters.q) && (
            <button
              onClick={() => { setFilters({ direction: "", status: "", bankName: "", q: "" }); setDraft(""); setPage(1); }}
              style={{
                height:       "36px",
                padding:      "0 12px",
                background:   "transparent",
                color:        "#64748B",
                border:       "1px solid #E2E8F0",
                borderRadius: "6px",
                fontSize:     "12px",
                cursor:       "pointer",
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── Tabla ──────────────────────────────────────────────────────────── */}
        <div style={{
          background:   "#FFFFFF",
          border:       "1px solid #E2E8F0",
          borderRadius: "12px",
          overflow:     "hidden",
        }}>

          {error && (
            <div style={{ padding: "20px 24px", color: "#DC2626", fontSize: "13px" }}>{error}</div>
          )}

          {!error && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F8FAFC" }}>
                    {["Fecha", "Banco", "Descripción", "Monto", "Dirección", "Estado"].map(h => (
                      <th key={h} style={{
                        padding:       "11px 16px",
                        textAlign:     "left",
                        fontSize:      "11px",
                        fontWeight:    700,
                        color:         "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        whiteSpace:    "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading && movements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
                        Cargando…
                      </td>
                    </tr>
                  )}

                  {!loading && movements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🏦</div>
                        <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 4px", fontWeight: 500 }}>
                          Sin movimientos bancarios
                        </p>
                        <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>
                          {filters.q || filters.direction || filters.status
                            ? "No hay resultados para los filtros aplicados."
                            : "Importa una cartola para comenzar."}
                        </p>
                      </td>
                    </tr>
                  )}

                  {movements.map(m => {
                    const dir = DIRECTION_META[m.direction] ?? DIRECTION_META.OUTFLOW;
                    const st  = STATUS_META[m.status]       ?? STATUS_META.IMPORTED;
                    return (
                      <tr key={m.id} style={{
                        borderBottom: "1px solid #F1F5F9",
                        opacity:      loading ? 0.5 : 1,
                        transition:   "opacity 0.1s",
                      }}>
                        <td style={{ padding: "11px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                          {fmtDate(m.occurredAt)}
                        </td>
                        <td style={{ padding: "11px 16px", color: "#64748B", whiteSpace: "nowrap" }}>
                          {m.bankName ?? "—"}
                        </td>
                        <td style={{
                          padding:      "11px 16px",
                          color:        "#0F2A3D",
                          maxWidth:     "320px",
                          overflow:     "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:   "nowrap",
                        }}>
                          {m.description}
                        </td>
                        <td style={{
                          padding:    "11px 16px",
                          fontWeight: 600,
                          color:      dir.color,
                          whiteSpace: "nowrap",
                        }}>
                          {m.direction === "INFLOW" ? "+" : "−"}{fmtClp(m.amountClp)}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{
                            fontSize:     "11px",
                            fontWeight:   700,
                            padding:      "3px 9px",
                            borderRadius: "6px",
                            background:   dir.bg,
                            color:        dir.color,
                          }}>
                            {dir.label}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{
                            fontSize:     "11px",
                            fontWeight:   500,
                            padding:      "3px 9px",
                            borderRadius: "6px",
                            background:   st.bg,
                            color:        st.color,
                          }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Paginación ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div style={{
              borderTop:      "1px solid #E2E8F0",
              padding:        "14px 20px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              gap:            "12px",
              flexWrap:       "wrap",
            }}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Página {page} de {totalPages} · {total.toLocaleString("es-CL")} registros
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <PageBtn label="← Anterior" disabled={page <= 1}         onClick={() => setPage(p => p - 1)} />
                <PageBtn label="Siguiente →" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FilterSelect({ value, onChange, options }: {
  value:   string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height:       "36px",
        border:       "1px solid #E2E8F0",
        borderRadius: "6px",
        padding:      "0 12px",
        fontSize:     "13px",
        color:        "#0F2A3D",
        background:   "#F8FAFC",
        cursor:       "pointer",
        outline:      "none",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PageBtn({ label, disabled, onClick }: {
  label:    string;
  disabled: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height:       "32px",
        padding:      "0 14px",
        background:   disabled ? "#F1F5F9" : "#FFFFFF",
        color:        disabled ? "#CBD5E1" : "#0F2A3D",
        border:       "1px solid #E2E8F0",
        borderRadius: "6px",
        fontSize:     "12px",
        fontWeight:   500,
        cursor:       disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
