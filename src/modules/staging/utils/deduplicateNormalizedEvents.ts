export type NormalizedRecord = {
  id:                  string;
  provider:            string;
  status:              string;
  occurredAt:          Date;
  normalizedEventType: string | null;
  normalizedJson:      string | null;
  externalType:        string | null;
  movementId:          string | null;
};

export type DedupeGroup = {
  key:     string;
  records: NormalizedRecord[];
};

export function makeDedupeKey(
  eventType:      string,
  normalizedJson: string | null,
  occurredAt:     Date,
): string {
  let symbol = "?";
  let qty    = "0";
  if (normalizedJson) {
    try {
      const data = JSON.parse(normalizedJson) as Record<string, unknown>;
      symbol = typeof data.symbol   === "string" ? data.symbol.toUpperCase() : "?";
      qty    = typeof data.quantity === "number"  ? data.quantity.toFixed(8)  : "0";
    } catch { /* non-JSON payload */ }
  }
  const bucket = Math.floor(occurredAt.getTime() / (5 * 60 * 1000));
  return `${eventType}:${symbol}:${qty}:${bucket}`;
}

export function deduplicateNormalizedEvents(records: NormalizedRecord[]): DedupeGroup[] {
  const groups = new Map<string, NormalizedRecord[]>();
  for (const r of records) {
    const key = makeDedupeKey(r.normalizedEventType ?? "UNKNOWN", r.normalizedJson, r.occurredAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries()).map(([key, recs]) => ({ key, records: recs }));
}
