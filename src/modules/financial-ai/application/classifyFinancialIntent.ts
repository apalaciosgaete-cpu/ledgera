import type {
  FinancialIntent, IntentClassification, IntentSignal, TransactionContext,
} from "../domain/FinancialIntent";
import { FINANCIAL_INTENT } from "../domain/FinancialIntent";
import { detectP2P }                  from "./detectP2P";
import { detectInternalTransfer }     from "./detectInternalTransfer";
import { detectStablecoinRouting }    from "./detectStablecoinRouting";
import { detectExchangeHiddenPattern } from "./detectExchangeHiddenPattern";
import { riskScoreTransaction }       from "./riskScoreTransaction";

type IntentCandidate = {
  intent:    FinancialIntent;
  signals:   IntentSignal[];
  totalWeight: number;
};

export function classifyFinancialIntent(
  ctx: TransactionContext & { symbol?: string | null; normalizedType?: string | null },
): IntentClassification {
  const candidates: IntentCandidate[] = [];

  // ── P2P ─────────────────────────────────────────────────────────────────────
  const p2pSignals = detectP2P(ctx);
  if (p2pSignals.length > 0) {
    candidates.push({
      intent:      FINANCIAL_INTENT.P2P,
      signals:     p2pSignals,
      totalWeight: p2pSignals.reduce((s, x) => s + x.weight, 0),
    });
  }

  // ── Internal / Exchange ──────────────────────────────────────────────────────
  const internalSignals = detectInternalTransfer(ctx);
  const exchangeSignals = internalSignals.filter((s) => s.code === "EXCHANGE_KEYWORD");
  const pureInternal    = internalSignals.filter((s) => s.code !== "EXCHANGE_KEYWORD");

  if (exchangeSignals.length > 0) {
    const intent = ctx.direction === "INFLOW"
      ? FINANCIAL_INTENT.EXCHANGE_WITHDRAW
      : FINANCIAL_INTENT.EXCHANGE_DEPOSIT;
    candidates.push({
      intent,
      signals:     exchangeSignals,
      totalWeight: exchangeSignals.reduce((s, x) => s + x.weight, 0),
    });
  }
  if (pureInternal.length > 0) {
    candidates.push({
      intent:      FINANCIAL_INTENT.INTERNAL_TRANSFER,
      signals:     pureInternal,
      totalWeight: pureInternal.reduce((s, x) => s + x.weight, 0),
    });
  }

  // ── Stablecoin ────────────────────────────────────────────────────────────────
  const stableSignals = detectStablecoinRouting(ctx);
  if (stableSignals.length > 0) {
    candidates.push({
      intent:      FINANCIAL_INTENT.STABLECOIN_ROUTE,
      signals:     stableSignals,
      totalWeight: stableSignals.reduce((s, x) => s + x.weight, 0),
    });
  }

  // ── Exchange hidden ───────────────────────────────────────────────────────────
  const hiddenSignals = detectExchangeHiddenPattern(ctx);
  if (hiddenSignals.length > 0) {
    const intent = ctx.direction === "INFLOW"
      ? FINANCIAL_INTENT.EXCHANGE_WITHDRAW
      : FINANCIAL_INTENT.EXCHANGE_DEPOSIT;
    const existing = candidates.find((c) => c.intent === intent);
    if (existing) {
      existing.signals.push(...hiddenSignals);
      existing.totalWeight += hiddenSignals.reduce((s, x) => s + x.weight, 0);
    } else {
      candidates.push({
        intent,
        signals:     hiddenSignals,
        totalWeight: hiddenSignals.reduce((s, x) => s + x.weight, 0),
      });
    }
  }

  // ── Pick best candidate ───────────────────────────────────────────────────────
  candidates.sort((a, b) => b.totalWeight - a.totalWeight);
  const best = candidates[0];

  if (!best || best.totalWeight < 0.3) {
    const riskScore = riskScoreTransaction(ctx);
    return {
      intent:     FINANCIAL_INTENT.NORMAL_BANKING,
      confidence: Math.max(0, 1 - (best?.totalWeight ?? 1)),
      signals:    [],
      risk:       riskScore.level,
    };
  }

  const confidence  = Math.min(best.totalWeight, 1);
  const riskScore   = riskScoreTransaction(ctx);

  return {
    intent:     best.intent,
    confidence,
    signals:    best.signals,
    risk:       riskScore.level,
  };
}
