"use client";

import { BillingCheckoutStatusBanner } from "@/components/billing/BillingCheckoutStatusBanner";
import { BillingStatusPanel } from "@/components/billing/BillingStatusPanel";
import ConfiguracionShell from "../ConfiguracionShell";

export default function FacturacionPage() {
  return (
    <>
      <BillingCheckoutStatusBanner />
      <BillingStatusPanel />
      <ConfiguracionShell forcedSection="facturacion" />
    </>
  );
}
