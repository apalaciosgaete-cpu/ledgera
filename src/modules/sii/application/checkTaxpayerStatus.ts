import type { SiiConnectionStatus } from "@/modules/sii/domain/sii";

export async function checkTaxpayerStatus(): Promise<{
  status: SiiConnectionStatus;
}> {
  // Placeholder: en producción consulta el estado del contribuyente al SII.
  return { status: "CONNECTED" };
}
