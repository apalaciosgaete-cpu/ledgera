import Link from "next/link";

import { fonts } from "@/styles/tokens";

type BillingPayment = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

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

export type BillingAccountOverviewData = {
  role: string;
  billingLive: boolean;
  plan: {
    normalized: string;
    label: string;
    expiresAt: string | null;
  };
  subscription: {
    provider: string;
    status: string;
    amount: number;
    currency: string;
    currentPeriodEnd: string | null;
  } | null;
  payments: BillingPayment[];
  invoicesAvailable: boolean;
  invoices: BillingInvoice[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function subscriptionPresentation(data: BillingAccountOverviewData) {
  if (data.role === "admin") {
    return {
      label: "Cuenta administrativa",
      tone: "info" as const,
      description: "Esta cuenta es interna y no tiene cobros ni renovación asociados.",
    };
  }

  const status = data.subscription?.status;

  if (status === "ACTIVE") {
    return {
      label: "Activa",
      tone: "success" as const,
      description: "El acceso se encuentra vigente.",
    };
  }

  if (status === "CANCEL_AT_PERIOD_END") {
    return {
      label: "Renovación cancelada",
      tone: "warning" as const,
      description: `Mantendrás acceso hasta ${formatDate(data.subscription?.currentPeriodEnd)}.`,
    };
  }

  if (status === "PENDING") {
    return {
      label: "Pendiente de confirmación",
      tone: "warning" as const,
      description: "Existe una operación pendiente que todavía no constituye un cobro confirmado.",
    };
  }

  if (status === "PAST_DUE" || status === "FAILED") {
    return {
      label: "Requiere atención",
      tone: "danger" as const,
      description: "No existe una renovación confirmada para el período siguiente.",
    };
  }

  if (status === "CANCELLED" || status === "CANCELED" || status === "EXPIRED") {
    return {
      label: "Inactiva",
      tone: "neutral" as const,
      description: "No existe una suscripción pagada vigente.",
    };
  }

  if (data.plan.normalized === "FREE") {
    return {
      label: "Plan gratuito",
      tone: "neutral" as const,
      description: "La cuenta utiliza el acceso base sin cobros recurrentes.",
    };
  }

  return {
    label: "Sin suscripción asociada",
    tone: "warning" as const,
    description: "El plan registrado no tiene una suscripción comercial vinculada.",
  };
}

function statusColors(tone: "success" | "warning" | "danger" | "neutral" | "info") {
  switch (tone) {
    case "success":
      return { background: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.22)", color: "var(--accent)" };
    case "warning":
      return { background: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.24)", color: "var(--warn)" };
    case "danger":
      return { background: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.22)", color: "var(--loss)" };
    case "info":
      return { background: "rgba(14,165,233,0.09)", border: "rgba(14,165,233,0.22)", color: "var(--accent)" };
    default:
      return { background: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.22)", color: "var(--text-soft)" };
  }
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case "PAID":
    case "APPROVED":
    case "AUTHORIZED":
      return "Pagado";
    case "PENDING":
      return "Pendiente";
    case "FAILED":
    case "REJECTED":
      return "Fallido";
    case "REFUNDED":
      return "Reembolsado";
    case "CANCELED":
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function invoiceStatusLabel(status: string) {
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

const cardStyle = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem",
  marginBottom: "1rem",
} as const;

export function BillingAccountOverview({ data }: { data: BillingAccountOverviewData }) {
  const presentation = subscriptionPresentation(data);
  const colors = statusColors(presentation.tone);
  const isAdmin = data.role === "admin";
  const renewalDate = data.subscription?.currentPeriodEnd ?? data.plan.expiresAt;

  return (
    <>
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 5px" }}>
              Resumen de la cuenta
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", lineHeight: 1.5 }}>
              Estado contractual y vigencia del acceso a LEDGERA.
            </p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 10px", background: colors.background, border: `1px solid ${colors.border}`, color: colors.color, fontSize: 11, fontWeight: 800 }}>
            {presentation.label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 5px", color: "var(--text-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan</p>
            <p style={{ margin: 0, color: "var(--text)", fontSize: 16, fontWeight: 800 }}>{isAdmin ? "Interno" : data.plan.label}</p>
          </div>
          <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 5px", color: "var(--text-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estado</p>
            <p style={{ margin: 0, color: "var(--text)", fontSize: 16, fontWeight: 800 }}>{presentation.label}</p>
          </div>
          <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 5px", color: "var(--text-soft)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{data.subscription?.status === "CANCEL_AT_PERIOD_END" ? "Acceso hasta" : "Vigencia"}</p>
            <p style={{ margin: 0, color: "var(--text)", fontSize: 16, fontWeight: 800 }}>{isAdmin ? "Sin vencimiento comercial" : formatDate(renewalDate)}</p>
          </div>
        </div>

        <p style={{ margin: "14px 0 0", color: colors.color, fontSize: 12, lineHeight: 1.55 }}>
          {presentation.description}
        </p>

        {!isAdmin && !data.billingLive && (
          <div style={{ marginTop: 16, padding: 14, background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: 10 }}>
            <p style={{ margin: "0 0 4px", color: "var(--text)", fontSize: 13, fontWeight: 800 }}>
              Gestión de cobros en preparación
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.55 }}>
              Los cambios de plan, renovaciones y cancelaciones automáticas todavía no están habilitados. No se realizará ningún cargo desde esta pantalla.
            </p>
          </div>
        )}

        {!isAdmin && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/planes" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, padding: "10px 14px", background: "var(--accent)", color: "var(--text)", textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
              Ver opciones de planes
            </Link>
            <a href="mailto:admin@ledgera.cl?subject=Gestión%20de%20suscripción%20LEDGERA" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, padding: "10px 14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
              Contactar soporte
            </a>
          </div>
        )}
      </section>

      {!isAdmin && (
        <section style={cardStyle}>
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 5px" }}>Historial de pagos</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", lineHeight: 1.5 }}>Movimientos de cobro registrados para esta cuenta.</p>
          </div>

          {data.payments.length === 0 ? (
            <div style={{ background: "var(--bg-sunken)", border: "1px dashed var(--border)", borderRadius: 10, padding: "1rem", color: "var(--text-soft)", fontSize: 13 }}>
              No existen pagos registrados.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Fecha", "Concepto", "Monto", "Estado"].map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)" }}>{payment.description}</td>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", fontWeight: 800, whiteSpace: "nowrap" }}>{formatMoney(payment.amount, payment.currency)}</td>
                      <td style={{ padding: "10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)" }}>{paymentStatusLabel(payment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!isAdmin && (
        <section style={cardStyle}>
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 5px" }}>Documentos de cobro</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)", lineHeight: 1.5 }}>Comprobantes y documentos asociados a pagos confirmados.</p>
          </div>

          {!data.invoicesAvailable ? (
            <div style={{ background: "var(--bg-sunken)", border: "1px dashed var(--border)", borderRadius: 10, padding: "1rem", color: "var(--text-soft)", fontSize: 13, lineHeight: 1.55 }}>
              La emisión y descarga de documentos todavía no está habilitada. La sección se activará junto con la integración real de pagos.
            </div>
          ) : data.invoices.length === 0 ? (
            <div style={{ background: "var(--bg-sunken)", border: "1px dashed var(--border)", borderRadius: 10, padding: "1rem", color: "var(--text-soft)", fontSize: 13 }}>
              No existen documentos emitidos.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Documento", "Fecha", "Total", "Estado", "Archivos"].map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "8px 10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>{invoice.invoiceNumber}</td>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{formatDate(invoice.issuedAt ?? invoice.createdAt)}</td>
                      <td style={{ padding: "10px", color: "var(--text)", borderBottom: "1px solid var(--border)", fontWeight: 800 }}>{formatMoney(invoice.totalAmount, invoice.currency)}</td>
                      <td style={{ padding: "10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)" }}>{invoiceStatusLabel(invoice.status)}</td>
                      <td style={{ padding: "10px", color: "var(--text-soft)", borderBottom: "1px solid var(--border)" }}>
                        {invoice.pdfUrl || invoice.xmlUrl ? (
                          <span>{invoice.pdfUrl ? "PDF disponible" : ""}{invoice.pdfUrl && invoice.xmlUrl ? " · " : ""}{invoice.xmlUrl ? "XML disponible" : ""}</span>
                        ) : "Pendiente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
