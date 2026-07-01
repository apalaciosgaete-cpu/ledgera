"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/styles/design-system";

type DeclarationStatus =
  | "DRAFT"
  | "REVIEW"
  | "CONFIRMED"
  | "EXPORTED"
  | "VOIDED";

type DeclarationItem = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: DeclarationStatus;
  source: string;
  contentHash: string;
  generatedAt: string;
  confirmedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DeclarationsResponse = {
  ok: boolean;
  message: string;
  data: { declarations: DeclarationItem[] };
};

type VerifyResponse = {
  ok: boolean;
  message: string;
  data: { verification: { valid: boolean; computedHash: string; expectedHash: string } };
};

type VerificationResult = {
  declarationId: string;
  valid: boolean;
  computedHash: string;
  expectedHash: string;
};

const DECLARATION_TYPES = [
  { value: "DJ_CRYPTO_SUMMARY", label: "Resumen cripto" },
  { value: "DJ_REALIZED_GAINS", label: "Ganancias realizadas" },
  { value: "DJ_FOREIGN_EXCHANGE_ACTIVITY", label: "Exchanges extranjeros" },
  { value: "DJ_TAX_SUPPORTING_LEDGER", label: "Libro auxiliar tributario" },
];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

async function resolveCsrfToken() {
  await fetch("/api/csrf", { method: "GET", credentials: "include", cache: "no-store" });
  return readCookie("ledgera_csrf");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CL");
}

function statusLabel(status: DeclarationStatus) {
  switch (status) {
    case "DRAFT": return "Borrador";
    case "REVIEW": return "En revisión";
    case "CONFIRMED": return "Confirmada";
    case "EXPORTED": return "Exportada";
    case "VOIDED": return "Anulada";
    default: return status;
  }
}

function statusClass(status: DeclarationStatus) {
  if (status === "CONFIRMED" || status === "EXPORTED") return ui.badgeOk;
  if (status === "VOIDED") return ui.badgeRisk;
  if (status === "REVIEW") return ui.badgeWarning;
  return "border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]";
}

function typeLabel(type: string) {
  return DECLARATION_TYPES.find((item) => item.value === type)?.label ?? type;
}

function MoreMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-alt)]"
        title="Más acciones"
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[170px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`w-full px-4 py-2 text-left text-sm transition hover:bg-[var(--color-surface-alt)] ${item.danger ? "text-red-600" : "text-[var(--color-text-primary)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TributarioPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(String(currentYear));
  const [declarationType, setDeclarationType] = useState("DJ_CRYPTO_SUMMARY");
  const [declarations, setDeclarations] = useState<DeclarationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const sorted = useMemo(
    () => [...declarations].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()),
    [declarations],
  );

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tax/declarations?year=${year}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as DeclarationsResponse;
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al cargar.");
      setDeclarations(json.data.declarations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar declaraciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    try {
      setProcessing("generate"); setMessage(null); setError(null); setVerification(null);
      const csrf = await resolveCsrfToken();
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tax/declarations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json", "x-ledgera-csrf": csrf },
        credentials: "include",
        body: JSON.stringify({ year, type: declarationType }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al generar.");
      setMessage(json.data?.reused ? "Ya existe un borrador activo con el mismo contenido." : "Borrador generado correctamente.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el borrador.");
    } finally {
      setProcessing(null);
    }
  }

  async function changeStatus(id: string, status: DeclarationStatus) {
    try {
      setProcessing(`${id}:${status}`); setMessage(null); setError(null); setVerification(null);
      const csrf = await resolveCsrfToken();
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tax/declarations/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json", "x-ledgera-csrf": csrf },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al actualizar.");
      setMessage("Declaración actualizada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setProcessing(null);
    }
  }

  async function verify(decl: DeclarationItem) {
    try {
      setProcessing(`${decl.id}:verify`); setMessage(null); setError(null); setVerification(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tax/declarations/${decl.id}/verify`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as VerifyResponse;
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al verificar.");
      setVerification({
        declarationId: decl.id,
        valid: json.data.verification.valid,
        computedHash: json.data.verification.computedHash,
        expectedHash: json.data.verification.expectedHash,
      });
      setMessage(json.data.verification.valid ? "Integridad verificada correctamente." : "Inconsistencia de integridad detectada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar.");
    } finally {
      setProcessing(null);
    }
  }

  async function download(decl: DeclarationItem) {
    try {
      setProcessing(`${decl.id}:export`); setMessage(null); setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tax/declarations/${decl.id}/export`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Error al exportar.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgera-ddjj-${decl.taxYear}-${decl.declarationType.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage("CSV descargado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar.");
    } finally {
      setProcessing(null);
    }
  }

  const busy = processing !== null;

  return (
    <section className="space-y-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Declaraciones Juradas</h1>
        <p style={{ color: "var(--text-soft)", margin: 0, fontSize: "0.875rem" }}>Borradores tributarios auditables por año.</p>
      </div>

      <div className={`${ui.card} p-4`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className={ui.label}>Año</span>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-24 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="min-w-0 flex-1 space-y-1">
            <span className={ui.label}>Tipo</span>
            <select
              value={declarationType}
              onChange={(e) => setDeclarationType(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              {DECLARATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={generate} disabled={busy} className={ui.buttonPrimary}>
              {processing === "generate" ? "Generando…" : "Generar borrador"}
            </button>
            <button type="button" onClick={load} disabled={loading || busy} className={ui.buttonSecondary}>
              {loading ? "…" : "↺"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className={`${ui.alertRisk} rounded-md p-3 text-sm`}>{error}</div>}
      {message && <div className={`${ui.alertOk} rounded-md p-3 text-sm`}>{message}</div>}

      {verification && (
        <div className={`${verification.valid ? ui.alertOk : ui.alertRisk} rounded-md p-3 text-sm space-y-1`}>
          <p className="font-semibold">{verification.valid ? "Integridad OK" : "Integridad INVÁLIDA"}</p>
          <p className="font-mono text-[11px] break-all opacity-80">Hash esperado: {verification.expectedHash}</p>
          <p className="font-mono text-[11px] break-all opacity-80">Hash calculado: {verification.computedHash}</p>
        </div>
      )}

      <div className="space-y-2">
        {loading && (
          <div className={`${ui.card} p-4 text-sm text-[var(--color-text-secondary)]`}>Cargando…</div>
        )}

        {!loading && sorted.length === 0 && (
          <div className={`${ui.card} p-4 text-sm text-[var(--color-text-secondary)]`}>
            No hay declaraciones para {year}.
          </div>
        )}

        {!loading && sorted.map((decl) => {
          const voided = decl.status === "VOIDED";
          const confirmed = decl.status === "CONFIRMED";
          const exported = decl.status === "EXPORTED";
          const review = decl.status === "REVIEW";

          const primaryAction = !voided && !confirmed && !exported ? (
            <button
              type="button"
              onClick={() => changeStatus(decl.id, "CONFIRMED")}
              disabled={busy}
              className={ui.buttonPrimary}
            >
              {processing === `${decl.id}:CONFIRMED` ? "Confirmando…" : "Confirmar"}
            </button>
          ) : null;

          const moreItems: { label: string; onClick: () => void; danger?: boolean }[] = [];
          if (!voided && !review && !confirmed && !exported) {
            moreItems.push({ label: "Marcar en revisión", onClick: () => changeStatus(decl.id, "REVIEW") });
          }
          moreItems.push({ label: "Verificar integridad", onClick: () => verify(decl) });
          if (!voided && !exported) {
            moreItems.push({ label: "Anular", onClick: () => changeStatus(decl.id, "VOIDED"), danger: true });
          }

          return (
            <div
              key={decl.id}
              className={`${ui.card} flex items-center gap-4 px-4 py-3 ${voided ? "opacity-50" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {typeLabel(decl.declarationType)}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(decl.status)}`}>
                    {statusLabel(decl.status)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{decl.taxYear}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>{formatDate(decl.generatedAt)}</span>
                  <code className="font-mono text-[10px]">🔒 {decl.contentHash.slice(0, 10)}…</code>
                </div>
              </div>

              {!voided ? (
                <div className="flex shrink-0 items-center gap-2">
                  {primaryAction}
                  <button
                    type="button"
                    onClick={() => download(decl)}
                    disabled={busy}
                    title="Descargar CSV"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold transition hover:bg-[var(--color-surface-alt)]"
                  >
                    {processing === `${decl.id}:export` ? "…" : "↓"}
                  </button>
                  <MoreMenu items={moreItems} />
                </div>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">Anulada</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
