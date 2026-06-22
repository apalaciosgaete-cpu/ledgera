import type { SiiConnectionStatus, SiiEnvironment } from "@/modules/sii/domain/sii";
import { getActiveCredential } from "@/modules/sii/infrastructure/siiCredentialRepository";
import { validateCertificate } from "./validateCertificate";

export async function getSiiStatus(
  environment: SiiEnvironment,
  issuerRut: string,
): Promise<{
  environment: SiiEnvironment;
  status: SiiConnectionStatus;
}> {
  const credential = await getActiveCredential(environment, issuerRut);

  if (!credential) {
    return { environment, status: "NOT_CONFIGURED" };
  }

  const certificate = await validateCertificate(credential);

  if (!certificate.valid) {
    return { environment, status: "CERTIFICATE_EXPIRED" };
  }

  return { environment, status: "CONNECTED" };
}
