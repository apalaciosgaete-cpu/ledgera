import type { DigitalOperatingSnapshot } from "../infrastructure/digitalOperatingRepository";

export type DigitalOperatingSummary = {
  status: "EMPTY" | "PARTIAL" | "IN_REVIEW" | "VALIDATED" | "REQUIRES_ACTION";
  counts: {
    cryptoAssets: number;
    exchanges: number;
    wallets: number;
    sourcesOfFunds: number;
    taxObligations: number;
    documents: number;
    events: number;
  };
  readiness: number;
  missing: string[];
};

export function deriveOperatingSummary(snapshot: DigitalOperatingSnapshot): DigitalOperatingSummary {
  const counts = {
    cryptoAssets: snapshot.cryptoAssets.length,
    exchanges: snapshot.exchangeAccounts.length,
    wallets: snapshot.wallets.length,
    sourcesOfFunds: snapshot.sourcesOfFunds.length,
    taxObligations: snapshot.taxObligations.length,
    documents: snapshot.documents.length,
    events: snapshot.events.length,
  };

  const missing: string[] = [];
  if (counts.cryptoAssets === 0) missing.push("cryptoactivos");
  if (counts.exchanges === 0) missing.push("exchanges");
  if (counts.wallets === 0) missing.push("wallets");
  if (counts.sourcesOfFunds === 0) missing.push("origen de fondos");
  if (counts.documents === 0) missing.push("documentacion");

  const completed = 5 - missing.length;
  const readiness = Math.round((completed / 5) * 100);
  const status = readiness === 0 ? "EMPTY" : readiness < 100 ? "PARTIAL" : "VALIDATED";

  return { status, counts, readiness, missing };
}
