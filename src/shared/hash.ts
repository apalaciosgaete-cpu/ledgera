import crypto from "crypto";

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function createStableSha256Hash(payload: unknown) {
  const stablePayload = sortObject(payload);

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stablePayload))
    .digest("hex");
}