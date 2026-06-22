import { createStableSha256Hash } from "@/shared/hash";

type VerifyDeclarationHashInput = {
  payloadJson: unknown;
  expectedHash: string;
};

export type VerifyDeclarationHashResult = {
  valid: boolean;
  computedHash: string;
  expectedHash: string;
};

export function computeDeclarationHash(payloadJson: unknown): string {
  return createStableSha256Hash({
    algorithm: "LEDGERA_DDJJ_CONTENT_V1",
    payloadJson,
  });
}

export function verifyDeclarationHash(
  input: VerifyDeclarationHashInput,
): VerifyDeclarationHashResult {
  const computedHash = computeDeclarationHash(input.payloadJson);

  return {
    valid: computedHash === input.expectedHash,
    computedHash,
    expectedHash: input.expectedHash,
  };
}
