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
      return "Pagada";
    case "ISSUED":
      return "Emitida";
    case "VOID":
      return "Anulada";
    case "DRAFT":
      return "Borrador";
    default:
      return status;
  }
}

export function BillingInvoicesPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          setInvoices(response.data?.invoices ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No fue posible cargar las facturas.");
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
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "#0F2A3D", margin: "0 0 4px" }}>
          Facturas
        </h3>
        <p style={{ margin: 0, color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
          Historial de facturas comerciales. PDF y XML quedarán disponibles cuando el proveedor emita documentos reales.
        </p>
      </div>

      {loading && <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>Cargando facturas...</p>}
      {error && <p style={{ margin: 0, color: "#991B1B", fontSize: 13 }}>{error}</p>}

      {!loading && !error && invoices.length === 0 && (
        <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10, padding: "1rem", color: "#64748B", fontSize: 13 }}>
          Aún no hay facturas emitidas.
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Factura", "Fecha", "Proveedor", "Total", "Estado", "Documentos"].map((header) => (
                  <th key={header} style={{ textAlign: "left", padding: "8px 10px", color: "#64748B", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ padding: "10px", color: "#0F2A3D", borderBottom: "1px solid #F1F5F9", fontWeight: 800 }}>{invoice.invoiceNumber}</td>
                  <td style={{ padding: "10px", color: "#475569", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>{formatDate(invoice.issuedAt ?? invoice.createdAt)}</td>
                  <td style={{ padding: "10px", color: "#475569", borderBottom: "1px solid #F1F5F9", textTransform: "capitalize" }}>{invoice.provider ?? "—"}</td>
                  <td style={{ padding: "10px", color: "#0F2A3D", borderBottom: "1px solid #F1F5F9", fontWeight: 800 }}>{formatMoney(invoice.totalAmount, invoice.currency)}</td>
                  <td style={{ padding: "10px", color: "#475569", borderBottom: "1px solid #F1F5F9" }}>{statusLabel(invoice.status)}</td>
                  <td style={{ padding: "10px", color: "#64748B", borderBottom: "1px solid #F1F5F9" }}>
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
