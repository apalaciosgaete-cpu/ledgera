"use client";

import { BillingCheckoutStatusBanner } from "@/components/billing/BillingCheckoutStatusBanner";
import ConfiguracionShell from "../ConfiguracionShell";

export default function FacturacionPage() {
  return (
    <>
      <BillingCheckoutStatusBanner />
      <ConfiguracionShell forcedSection="facturacion" />
    </>
  );
}
