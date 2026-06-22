"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BankTabs } from "@/components/bank/BankTabs";
import { getSessionToken } from "@/modules/identity/client/authStorage";

type BankMovement = {
  id: string;
  uploadId: string;
  bankName: string | null;
  occurredAt: string;
  description: string;
  amountClp: number;
  direction: "INFLOW" | "OUTFLOW";
  balanceClp: number | null;
  status: string;
  bankCategory: string;
  categoryReason: string | null;
  matchedPortfolioMovementId: string | null;
  matchedConfidence: number | null;
  matchedAt: string | null;
  matchedReason: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
};

type MovementsPayload = {
  movements: BankMovement[];
  total: number;
  take: number;
};

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    IMPORTED: "Importado",
    REVIEW: "Revisión",
    MATCHED: "Conciliado",
    IGNORED: "Ignorado",
  };

  return map[status] ?? status;
}

function directionLabel(direction: string): string {
  return direction === "INFLOW" ? "Abono" : "Cargo";
}

export default function BankMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "ALL";
  const direction = searchParams.get("direction") ?? "ALL";
  const bankName = searchParams.get("bankName") ?? "";
  const take = searchParams.get("take") ?? "100";

  const [movements, setMovements] = useState<BankMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankFilterInput, setBankFilterInput] = useState(bankName);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (status !== "ALL") params.set("status", status);
    if (direction !== "ALL") params.set("direction", direction);
    if (bankName.trim()) params.set("bankName", bankName.trim());
    if (take !== "100") params.set("take", take);

    return params.toString();
  }, [status, direction, bankName, take]);

  useEffect(() => {
    setBankFilterInput(bankName);
  }, [bankName]);

  useEffect(() => {
    async function loadMovements() {
      setLoading(true);
      setError(null);

      try {
        const token = getSessionToken();
        const url = queryString
          ? `/api/bank/movements?${queryString}`
          : "/api/bank/movements";

        const res = await fetch(url, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const json = (await res.json()) as ApiResponse<MovementsPayload>;

        if (!res.ok || !json.ok) {
          throw new Error(json.message || "No se pudieron cargar los movimientos.");
        }

        setMovements(json.data.movements);
        setTotal(json.data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar movimientos.");
      } finally {
        setLoading(false);
      }
    }

    void loadMovements();
  }, [queryString]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "ALL" || (key === "take" && value === "100")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/bank/movements${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function applyBankNameFilter() {
    updateFilter("bankName", bankFilterInput.trim());
  }

  function clearFilters() {
    setBankFilterInput("");
    router.push("/bank/movements");
  }

  return (
    <div>
      <BankTabs />

      <div style={{ marginBottom: "26px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F2A3D" }}>
          Movimientos bancarios
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#64748B" }}>
          Listado persistente de movimientos importados desde cartolas bancarias.
        </p>
      </div>

      <div
        className="grid gap-3 md:grid-cols-5"
        style={{
          marginBottom: "18px",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "14px",
          padding: "16px",
        }}
      >
        <div>
          <Label>Estado</Label>
          <select
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
            style={inputStyle}
          >
            <option value="ALL">Todos</option>
            <option value="IMPORTED">Importado</option>
            <option value="REVIEW">Revisión</option>
            <option value="MATCHED">Conciliado</option>
            <option value="IGNORED">Ignorado</option>
          </select>
        </div>

        <div>
          <Label>Dirección</Label>
          <select
            value={direction}
            onChange={(event) => updateFilter("direction", event.target.value)}
            style={inputStyle}
          >
            <option value="ALL">Todas</option>
            <option value="INFLOW">Abono</option>
            <option value="OUTFLOW">Cargo</option>
          </select>
        </div>

        <div>
          <Label>Banco</Label>
          <input
            value={bankFilterInput}
            onChange={(event) => setBankFilterInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyBankNameFilter();
            }}
            placeholder="Ej: Santander"
            style={inputStyle}
          />
        </div>

        <div>
          <Label>Límite</Label>
          <select
            value={take}
            onChange={(event) => updateFilter("take", event.target.value)}
            style={inputStyle}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="150">150</option>
            <option value="250">250</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "end", gap: "8px" }}>
          <button type="button" onClick={applyBankNameFilter} style={buttonPrimary}>
            Filtrar
          </button>
          <button type="button" onClick={clearFilters} style={buttonSecondary}>
            Limpiar
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "12px", fontSize: "13px", color: "#64748B" }}>
        {loading ? "Cargando..." : `${movements.length} de ${total} movimiento${total !== 1 ? "s" : ""}`}
      </div>

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.22)",
            color: "#B91C1C",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "36px 20px", color: "#94A3B8", fontSize: "14px" }}>
            Cargando movimientos bancarios…
          </div>
        ) : movements.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
            No hay movimientos bancarios para los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Fecha", "Banco", "Descripción", "Monto", "Dirección", "Estado", "Conciliación"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "#64748B",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={tdStyle}>{formatDate(movement.occurredAt)}</td>
                    <td style={tdStyle}>{movement.bankName ?? "—"}</td>
                    <td
                      style={{
                        ...tdStyle,
                        maxWidth: "320px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={movement.description}
                    >
                      {movement.description}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 700,
                        color: movement.direction === "INFLOW" ? "#15803D" : "#B91C1C",
                      }}
                    >
                      {movement.direction === "INFLOW" ? "+" : "-"}
                      {formatClp(movement.amountClp)}
                    </td>
                    <td style={tdStyle}>{directionLabel(movement.direction)}</td>
                    <td style={tdStyle}>
                      <Badge label={statusLabel(movement.status)} tone={movement.status} />
                    </td>
                    <td style={tdStyle}>
                      {movement.matchedPortfolioMovementId ? (
                        <span style={{ color: "#15803D", fontWeight: 700 }}>
                          {movement.matchedConfidence !== null
                            ? `${Math.round(movement.matchedConfidence * 100)}%`
                            : "Conciliado"}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>Sin match</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "6px",
        color: "#64748B",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </label>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  const color =
    tone === "MATCHED" ? "#15803D" :
    tone === "IGNORED" ? "#64748B" :
    tone === "REVIEW" ? "#B45309" :
    "#2563EB";

  const background =
    tone === "MATCHED" ? "#F0FDF4" :
    tone === "IGNORED" ? "#F1F5F9" :
    tone === "REVIEW" ? "#FFFBEB" :
    "#EFF6FF";

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 9px",
        borderRadius: "999px",
        background,
        color,
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  padding: "0 10px",
  color: "#0F2A3D",
  fontSize: "13px",
  outline: "none",
};

const buttonPrimary: React.CSSProperties = {
  height: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #0F2A3D",
  background: "#0F2A3D",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonSecondary: React.CSSProperties = {
  height: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 16px",
  color: "#475569",
  whiteSpace: "nowrap",
};
