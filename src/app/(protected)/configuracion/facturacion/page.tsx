"use client";

import { BillingCancellationActions } from "@/components/billing/BillingCancellationActions";
import { BillingCheckoutStatusBanner } from "@/components/billing/BillingCheckoutStatusBanner";
import { BillingInvoicesPanel } from "@/components/billing/BillingInvoicesPanel";
import { BillingStatusPanel } from "@/components/billing/BillingStatusPanel";
import { SubscriptionPortalPanel } from "@/components/billing/SubscriptionPortalPanel";
import ConfiguracionShell from "../ConfiguracionShell";

export default function FacturacionPage() {
  return (
    <>
      <BillingCheckoutStatusBanner />
      <BillingStatusPanel />
      <SubscriptionPortalPanel />
      <BillingInvoicesPanel />
      <BillingCancellationActions />
      <ConfiguracionShell forcedSection="facturacion" />
    </>
  );
}
