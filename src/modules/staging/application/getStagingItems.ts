import { prisma } from "@/lib/prisma";
import { STAGING_STATUS, type StagingStatus } from "../domain/StagingStatus";
import { STAGING_SOURCE } from "../domain/StagingSource";

export type { StagingStatus } from "../domain/StagingStatus";

export type StagingItem = {
  id:                string;
  source:            "EXCHANGE" | "BANK";
  sources:           string[];
  allIds:            string[];
  provider:          string;
  status:            StagingStatus;
  occurredAt:        string;
  title:             string;
  subtitle:          string;
  amountLabel:       string;
  rawType:           string;
  linkedMovementId:  string | null;
  direction?:        "INFLOW" | "OUTFLOW";
  stagingConfidence?: number | null;
};

export type StagingItemsResult = {
  items:  StagingItem[];
  counts: { pending: number; review: number; confirmed: number; rejected: number };
};

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  SPOT_BUY:          "Compra Spot",
  SPOT_SELL:         "Venta Spot",
  EXTERNAL_DEPOSIT:  "Depósito externo",
  EXTERNAL_WITHDRAW: "Retiro externo",
  P2P:               "Operación P2P",
  INTERNAL_TRANSFER: "Transferencia interna",
  UNKNOWN:           "Evento desconocido",
};

const BANK_STATUS_MAP: Record<string, StagingStatus> = {
  IMPORTED: STAGING_STATUS.PENDING,
  REVIEW:   STAGING_STATUS.REVIEW,
  MATCHED:  STAGING_STATUS.CONFIRMED,
  IGNORED:  STAGING_STATUS.REJECTED,
};

const STATUS_RANK: Record<StagingStatus, number> = {
  [STAGING_STATUS.REVIEW]:       3,
  [STAGING_STATUS.PENDING]:      2,
  [STAGING_STATUS.CONFIRMED]:    1,
  [STAGING_STATUS.REJECTED]:     0,
  [STAGING_STATUS.ROLLED_BACK]:  0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(value);
}

function parseNormalizedJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

function exchangeAmountLabel(normalizedJson: string | null): string {
  const data     = parseNormalizedJson(normalizedJson);
  const qty      = typeof data.quantity === "number" ? data.quantity : null;
  const symbol   = typeof data.symbol   === "string" ? data.symbol   : null;
  if (qty !== null && symbol) return `${qty % 1 === 0 ? qty : qty.toFixed(6)} ${symbol}`;
  const priceUsd = typeof data.priceUsd === "number" ? data.priceUsd : null;
  if (qty !== null && priceUsd !== null) return `USD ${(qty * priceUsd).toFixed(2)}`;
  return "—";
}

function exchangeSubtitle(providers: string[], normalizedJson: string | null): string {
  const data   = parseNormalizedJson(normalizedJson);
  const symbol = typeof data.symbol === "string" ? data.symbol : null;
  const providerLabels = providers.map((p) =>
    p === "BINANCE_TAX" ? "Tax" : p === "BINANCE" ? "Spot" : p,
  );
  const label = `Binance ${providerLabels.join(" + ")}`;
  return symbol ? `${label} · ${symbol}` : label;
}

function makeDedupeKey(
  eventType:      string,
  normalizedJson: string | null,
  occurredAt:     Date,
): string {
  const data   = parseNormalizedJson(normalizedJson);
  const symbol = typeof data.symbol   === "string" ? data.symbol.toUpperCase() : "?";
  const qty    = typeof data.quantity === "number"  ? data.quantity.toFixed(8)  : "0";
  const bucket = Math.floor(occurredAt.getTime() / (5 * 60 * 1000));
  return `${eventType}:${symbol}:${qty}:${bucket}`;
}

type RawExchangeRecord = {
  id:                  string;
  provider:            string;
  status:              string;
  occurredAt:          Date;
  normalizedEventType: string | null;
  normalizedJson:      string | null;
  externalType:        string | null;
  movementId:          string | null;
};

function groupExchangeRecords(records: RawExchangeRecord[]): StagingItem[] {
  const groups = new Map<string, RawExchangeRecord[]>();

  for (const r of records) {
    const eventType = r.normalizedEventType ?? "UNKNOWN";
    const key = makeDedupeKey(eventType, r.normalizedJson, r.occurredAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const items: StagingItem[] = [];
  const validStatuses: StagingStatus[] = Object.values(STAGING_STATUS);

  for (const [, group] of groups) {
    const primary = group.find((r) => r.provider === "BINANCE") ?? group[0];
    const rest    = group.filter((r) => r.id !== primary.id);
    const allIds  = [primary.id, ...rest.map((r) => r.id)];
    const sources = [...new Set(group.map((r) => r.provider))];

    const groupStatus = group.reduce<StagingStatus>((best, r) => {
      const s = (validStatuses.includes(r.status as StagingStatus) ? r.status : "PENDING") as StagingStatus;
      return STATUS_RANK[s] > STATUS_RANK[best] ? s : best;
    }, "REJECTED");

    const eventType = primary.normalizedEventType ?? "UNKNOWN";

    items.push({
      id:               primary.id,
      source:           STAGING_SOURCE.EXCHANGE,
      sources,
      allIds,
      provider:         primary.provider,
      status:           groupStatus,
      occurredAt:       primary.occurredAt.toISOString(),
      title:            EVENT_LABELS[eventType] ?? eventType,
      subtitle:         exchangeSubtitle(sources, primary.normalizedJson),
      amountLabel:      exchangeAmountLabel(primary.normalizedJson),
      rawType:          primary.externalType ?? eventType,
      linkedMovementId: primary.movementId ?? null,
    });
  }

  return items;
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function getStagingItems(userId: string): Promise<StagingItemsResult> {
  const [exchangeRecords, bankMovements] = await Promise.all([
    prisma.exchangeImportRecord.findMany({
      where:   { userId },
      orderBy: { occurredAt: "desc" },
      select: {
        id:                  true,
        provider:            true,
        status:              true,
        occurredAt:          true,
        normalizedEventType: true,
        normalizedJson:      true,
        externalType:        true,
        movementId:          true,
      },
    }),
    prisma.bankMovement.findMany({
      where:   { userId },
      orderBy: { occurredAt: "desc" },
      select: {
        id:                         true,
        bankName:                   true,
        occurredAt:                 true,
        description:                true,
        amountClp:                  true,
        direction:                  true,
        status:                     true,
        bankCategory:               true,
        matchedPortfolioMovementId: true,
        matchedConfidence:          true,
      },
    }),
  ]);

  const exchangeItems = groupExchangeRecords(exchangeRecords);
  const items: StagingItem[] = [...exchangeItems];

  for (const m of bankMovements) {
    const status = BANK_STATUS_MAP[m.status] ?? "PENDING";
    const dir    = m.direction === "INFLOW" ? "+" : "-";

    items.push({
      id:                m.id,
      source:            STAGING_SOURCE.BANK,
      sources:           [m.bankName ?? "Banco"],
      allIds:            [m.id],
      provider:          "BANK_FILE",
      status,
      occurredAt:        m.occurredAt.toISOString(),
      title:             m.description.length > 60 ? `${m.description.slice(0, 60)}…` : m.description,
      subtitle:          m.bankName ?? "Banco",
      amountLabel:       `${dir}${formatClp(m.amountClp)}`,
      rawType:           m.bankCategory ?? "BANK_MOVEMENT",
      linkedMovementId:  m.matchedPortfolioMovementId ?? null,
      direction:         m.direction as "INFLOW" | "OUTFLOW",
      stagingConfidence: m.matchedConfidence ?? null,
    });
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const counts = {
    pending:   items.filter((i) => i.status === "PENDING").length,
    review:    items.filter((i) => i.status === "REVIEW").length,
    confirmed: items.filter((i) => i.status === "CONFIRMED").length,
    rejected:  items.filter((i) => i.status === "REJECTED").length,
  };

  return { items, counts };
}
