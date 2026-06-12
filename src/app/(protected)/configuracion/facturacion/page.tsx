"use client";

import { BillingCancellationActions } from "@/components/billing/BillingCancellationActions";
import { BillingCheckoutStatusBanner } from "@/components/billing/BillingCheckoutStatusBanner";
import { BillingStatusPanel } from "@/components/billing/BillingStatusPanel";
import ConfiguracionShell from "../ConfiguracionShell";

export default function FacturacionPage() {
  return (
    <>
      <BillingCheckoutStatusBanner />
      <BillingStatusPanel />
      <BillingCancellationActions />
      <ConfiguracionShell forcedSection="facturacion" />
    </>
  );
}
