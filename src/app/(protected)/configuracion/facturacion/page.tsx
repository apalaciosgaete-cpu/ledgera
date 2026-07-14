import { cookies } from "next/headers";

import {
  BillingAccountOverview,
  type BillingAccountOverviewData,
} from "@/components/billing/BillingAccountOverview";
import { getBillingInvoices } from "@/modules/billing/application/getBillingInvoices";
import { getBillingStatus } from "@/modules/billing/application/getBillingStatus";
import { isLiveBillingEnabled } from "@/modules/billing/domain/billingAvailability";
import { getSessionWithUserByToken } from "@/modules/identity/infrastructure/sessionRepository";
import { fonts } from "@/styles/tokens";

export const dynamic = "force-dynamic";

function isMissingInvoicesTable(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; message?: unknown };
  };

  return (
    candidate.code === "P2010" &&
    candidate.meta?.code === "42P01" &&
    typeof candidate.meta?.message === "string" &&
    candidate.meta.message.includes("billing_invoices")
  );
}

async function loadBillingAccount(): Promise<BillingAccountOverviewData | null> {
  const token = cookies().get("session_token")?.value;
  if (!token) return null;

  const auth = await getSessionWithUserByToken(token);
  if (!auth || auth.session.expiresAt.getTime() <= Date.now()) return null;

  const billingLive = isLiveBillingEnabled();
  const invoicePromise = billingLive
    ? getBillingInvoices(auth.user.id)
        .then((invoices) => ({ available: true, invoices }))
        .catch((error: unknown) => {
          if (isMissingInvoicesTable(error)) {
            return { available: false, invoices: [] };
          }

          throw error;
        })
    : Promise.resolve({ available: false, invoices: [] });

  const [status, invoiceResult] = await Promise.all([
    getBillingStatus(auth.user.id),
    invoicePromise,
  ]);

  if (!status) return null;

  return {
    role: auth.user.role,
    billingLive,
    plan: {
      normalized: status.plan.normalized,
      label: status.plan.label,
      expiresAt: status.plan.expiresAt,
    },
    subscription: status.subscription
      ? {
          provider: status.subscription.provider,
          status: status.subscription.status,
          amount: status.subscription.amount,
          currency: status.subscription.currency,
          currentPeriodEnd: status.subscription.currentPeriodEnd,
        }
      : null,
    payments: status.payments,
    invoicesAvailable: invoiceResult.available,
    invoices: invoiceResult.invoices,
  };
}

export default async function FacturacionPage() {
  const data = await loadBillingAccount();

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 4px",
          }}
        >
          Suscripción y pagos
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-soft)",
            margin: 0,
          }}
        >
          Estado del acceso, pagos registrados y documentos de cobro.
        </p>
      </div>

      {data ? (
        <BillingAccountOverview data={data} />
      ) : (
        <div
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "1.25rem",
            color: "var(--text-soft)",
            fontSize: 13,
          }}
        >
          No fue posible cargar la información de la cuenta. Vuelve a iniciar sesión e inténtalo nuevamente.
        </div>
      )}
    </>
  );
}
