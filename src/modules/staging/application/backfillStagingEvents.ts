import { prisma } from "@/lib/prisma";
import { makeDedupeKey } from "../utils/deduplicateNormalizedEvents";
import { STAGING_STATUS } from "../domain/StagingStatus";
import { STAGING_SOURCE } from "../domain/StagingSource";

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  SPOT_BUY:          "Compra Spot",
  SPOT_SELL:         "Venta Spot",
  EXTERNAL_DEPOSIT:  "Depósito externo",
  EXTERNAL_WITHDRAW: "Retiro externo",
  P2P:               "Operación P2P",
  INTERNAL_TRANSFER: "Transferencia interna",
  UNKNOWN:           "Evento desconocido",
};

const BANK_STATUS_MAP: Record<string, string> = {
  IMPORTED: STAGING_STATUS.PENDING,
  REVIEW:   STAGING_STATUS.REVIEW,
  MATCHED:  STAGING_STATUS.CONFIRMED,
  IGNORED:  STAGING_STATUS.REJECTED,
};

const STATUS_RANK: Record<string, number> = {
  REVIEW: 3, PENDING: 2, CONFIRMED: 1, REJECTED: 0,
};

function parseJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

function exchangeAmountLabel(normalizedJson: string | null): string {
  const d    = parseJson(normalizedJson);
  const qty  = typeof d.quantity === "number" ? d.quantity : null;
  const sym  = typeof d.symbol   === "string" ? d.symbol   : null;
  if (qty !== null && sym) return `${qty % 1 === 0 ? qty : qty.toFixed(6)} ${sym}`;
  const usd  = typeof d.priceUsd === "number" ? d.priceUsd : null;
  if (qty !== null && usd !== null) return `USD ${(qty * usd).toFixed(2)}`;
  return "—";
}

function exchangeSubtitle(providers: string[], normalizedJson: string | null): string {
  const d   = parseJson(normalizedJson);
  const sym = typeof d.symbol === "string" ? d.symbol : null;
  const labels = providers.map((p) =>
    p === "BINANCE_TAX" ? "Tax" : p === "BINANCE" ? "Spot" : p,
  );
  const label = `Binance ${labels.join(" + ")}`;
  return sym ? `${label} · ${sym}` : label;
}

function formatClp(v: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(v);
}

function groupStatus(records: { status: string }[]): string {
  let best = STAGING_STATUS.REJECTED as string;
  for (const r of records) {
    const s = r.status in STATUS_RANK ? r.status : STAGING_STATUS.PENDING;
    if ((STATUS_RANK[s] ?? 0) > (STATUS_RANK[best] ?? 0)) best = s;
  }
  return best;
}

// ── Result type ───────────────────────────────────────────────────────────────

export type BackfillResult = {
  exchangeGroups:  number;
  exchangeCreated: number;
  exchangeSkipped: number;
  bankTotal:       number;
  bankCreated:     number;
  bankSkipped:     number;
};

// ── Service ───────────────────────────────────────────────────────────────────

export async function backfillStagingEvents(userId: string): Promise<BackfillResult> {
  const result: BackfillResult = {
    exchangeGroups: 0, exchangeCreated: 0, exchangeSkipped: 0,
    bankTotal: 0, bankCreated: 0, bankSkipped: 0,
  };

  // ── Exchange records ──────────────────────────────────────────────────────
  const records = await prisma.exchangeImportRecord.findMany({
    where:   { userId },
    orderBy: { occurredAt: "asc" },
  });

  const groups = new Map<string, typeof records>();
  for (const r of records) {
    const key = makeDedupeKey(r.normalizedEventType ?? "UNKNOWN", r.normalizedJson, r.occurredAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  result.exchangeGroups = groups.size;

  for (const [, group] of groups) {
    const primary = group.find((r) => r.provider === "BINANCE") ?? group[0];
    const allIds  = group.map((r) => r.id);
    const sources = [...new Set(group.map((r) => r.provider))];

    // Idempotency: check if any StagingEventSource links to this group
    const exists = await prisma.stagingEventSource.findFirst({
      where: { recordId: { in: allIds } },
    });
    if (exists) { result.exchangeSkipped++; continue; }

    const evType = primary.normalizedEventType ?? "UNKNOWN";

    await prisma.stagingEvent.create({
      data: {
        userId,
        source:          STAGING_SOURCE.EXCHANGE,
        provider:        primary.provider,
        status:          groupStatus(group),
        normalizedType:  evType,
        title:           EVENT_LABELS[evType] ?? evType,
        subtitle:        exchangeSubtitle(sources, primary.normalizedJson),
        amountLabel:     exchangeAmountLabel(primary.normalizedJson),
        occurredAt:      primary.occurredAt,
        linkedMovementId: primary.movementId ?? null,
        sources: {
          create: group.map((r) => ({
            provider: r.provider,
            recordId: r.id,
            rawType:  r.externalType,
          })),
        },
      },
    });
    result.exchangeCreated++;
  }

  // ── Bank movements ────────────────────────────────────────────────────────
  const bankMovements = await prisma.bankMovement.findMany({
    where:   { userId },
    orderBy: { occurredAt: "asc" },
  });
  result.bankTotal = bankMovements.length;

  // Fetch already-backfilled bank record IDs in one query
  const existingBankSources = await prisma.stagingEventSource.findMany({
    where: {
      stagingEvent: { userId, source: STAGING_SOURCE.BANK },
      recordId: { in: bankMovements.map((b) => b.id) },
    },
    select: { recordId: true },
  });
  const alreadyBackfilled = new Set(existingBankSources.map((s) => s.recordId));

  for (const bm of bankMovements) {
    if (alreadyBackfilled.has(bm.id)) { result.bankSkipped++; continue; }

    const dir    = bm.direction === "INFLOW" ? "+" : "-";
    const status = BANK_STATUS_MAP[bm.status] ?? STAGING_STATUS.PENDING;

    await prisma.stagingEvent.create({
      data: {
        userId,
        source:          STAGING_SOURCE.BANK,
        provider:        "BANK_FILE",
        status,
        normalizedType:  bm.bankCategory ?? "BANK_MOVEMENT",
        title:           bm.description.length > 60 ? `${bm.description.slice(0, 60)}…` : bm.description,
        subtitle:        bm.bankName ?? "Banco",
        amountLabel:     `${dir}${formatClp(bm.amountClp)}`,
        occurredAt:      bm.occurredAt,
        linkedMovementId: bm.matchedPortfolioMovementId ?? null,
        metadata:        JSON.stringify({ bankMovementId: bm.id }),
        sources: {
          create: [{
            provider: "BANK_FILE",
            recordId: bm.id,
            rawType:  bm.bankCategory ?? "BANK_MOVEMENT",
          }],
        },
      },
    });
    result.bankCreated++;
  }

  return result;
}
