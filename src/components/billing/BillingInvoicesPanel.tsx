"use client";

import { useEffect, useState } from "react";

import { httpClient } from "@/shared/http/httpClient";
import { fonts } from "@/styles/tokens";

type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  provider: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  issuedAt: string | null;
  createdAt: string;
};

type BillingInvoicesResponse = {
  ok: boolean;
  message?: string;
  data?: {
    available?: boolean;
    invoices: BillingInvoice[];
  };
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "ISSUED":
      return "Emitido";
    case "VOID":
      return "Anulado";
    case "DRAFT":
      return "Borrador";
    default:
      return status;
  }
}

export function BillingInvoicesPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadInvoices() {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient<BillingInvoicesResponse>("/api/billing/invoices", {
          auth: true,
        });

        if (mounted) {
          setAvailable(response.data?.available !== false);
          setInvoices(response.data?.invoices ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No fue posible cargar los documentos de cobro.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
          Documentos de cobro
        </h3>
        <p style={{ margin: 0, color: "var(--text)", fontSize: 12, lineHeight: 1.5 }}>
          Comprobantes y documentos asociados a pagos efectivamente procesados por LEDGERA.
        </p>
      </div>

      {loading && <p style={{ margin: 0, color: "var(--text)", fontSize: 13 }}>Cargando documentos...</p>}
      {error && <p style={{ margin: 0, color: "var(--loss)", fontSize: 13 }}>{error}</p>}

      {!loading && !error && !available && (
        <div style={{ background: "var(--bg-sunken)", border: "1px dashed var(--border)", borderRadius: 10, padding: "1rem", color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55 }}>
          La emisión y descarga de documentos de cobro todavía no está habilitada. Esta sección se activará cuando exista una integración real de pagos y documentos.
        </div>
      )}

      {!loading && !error && available && invoices.length === 0 && (
        <div style={{ background: "var(--bg-sunken)", border: "1px dashed var(--border)", borderRadius: 10, padding: "1rem", color: "var(--text-soft)", fontSize: 13 }}>
          Aún no hay documentos emitidos.
        </div>
      )}

      {!loading && !error && available && invoices.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Documento", "Fecha", "Proveedor", "Total", "Estado", "Archivos"].map((header) => (
                  <th key={header} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>{invoice.invoiceNumber}</td>
                  <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{formatDate(invoice.issuedAt ?? invoice.createdAt)}</td>
                  <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", textTransform: "capitalize" }}>{invoice.provider ?? "—"}</td>
                  <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>{formatMoney(invoice.totalAmount, invoice.currency)}</td>
                  <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)" }}>{statusLabel(invoice.status)}</td>
                  <td style={{ padding: "10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)" }}>
                    {invoice.pdfUrl ? "PDF listo" : "PDF pendiente"} · {invoice.xmlUrl ? "XML listo" : "XML pendiente"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
