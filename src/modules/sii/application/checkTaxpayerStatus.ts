import type { SiiConnectionStatus } from "@/modules/sii/domain/sii";
import { getSiiStatus } from "./getSiiStatus";

/**
 * Verifica el estado real de la conexión del contribuyente con el SII.
 * Consulta las credenciales almacenadas y el estado del certificado.
 */
export async function checkTaxpayerStatus(
  issuerRut: string,
  environment: "CERTIFICACION" | "PRODUCCION" = "PRODUCCION",
): Promise<{
  status: SiiConnectionStatus;
}> {
  try {
    const result = await getSiiStatus(environment, issuerRut);
    return { status: result.status };
  } catch (error) {
    console.error("[sii] checkTaxpayerStatus failed:", error instanceof Error ? error.message : String(error));
    return { status: "DISCONNECTED" };
  }
}
