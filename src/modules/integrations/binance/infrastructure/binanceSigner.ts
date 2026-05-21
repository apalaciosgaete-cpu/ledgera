import crypto from "crypto";

export function signQuery(queryString: string, apiSecret: string): string {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

export function buildSignedParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const timestamp  = Date.now();
  const base       = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
    timestamp: String(timestamp),
  }).toString();
  const signature  = signQuery(base, apiSecret);
  return `${base}&signature=${signature}`;
}
