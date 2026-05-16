import crypto from "node:crypto";

type VerifyDeclarationHashInput = {
  payloadJson: unknown;
  expectedHash: string;
};

export type VerifyDeclarationHashResult = {
  valid: boolean;
  computedHash: string;
  expectedHash: string;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    return `{${entries
      .map(([key, val]) => `"${key}":${stableStringify(val)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function computeDeclarationHash(payloadJson: unknown): string {
  const normalized = stableStringify(payloadJson);

  return crypto.createHash("sha256").update(normalized).digest("hex");
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