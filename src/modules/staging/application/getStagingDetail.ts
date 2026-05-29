import { prisma } from "@/lib/prisma";
import { StagingError } from "../domain/StagingError";
import { STAGING_SOURCE } from "../domain/StagingSource";

// ── Types ─────────────────────────────────────────────────────────────────────

type ExchangeRecordDetail = {
  id:                  string;
  provider:            string;
  status:              string;
  occurredAt:          string;
  normalizedEventType: string | null;
  externalType:        string | null;
  normalizedJson:      string | null;
  rawPayloadPreview:   string | null;
  taxTreatment:        string | null;
  inventoryEffect:     string | null;
  economicEffect:      string | null;
  movementId:          string | null;
};

type PortfolioMovementDetail = {
  id:         string;
  type:       string;
  symbol:     string | null;
  quantity:   number | null;
  priceUsd:   number | null;
  feeUsd:     number | null;
  executedAt: string;
  source:     string;
};

type AuditLogEntry = {
  id:          string;
  action:      string;
  confidence?: number | null;
  reason:      string | null;
  createdAt:   string;
};

export type StagingDetailResult = {
  itemId:            string;
  source:            "EXCHANGE" | "BANK";
  exchangeRecords:   ExchangeRecordDetail[];
  bankMovement: {
    id:                         string;
    bankName:                   string | null;
    occurredAt:                 string;
    description:                string;
    amountClp:                  number;
    direction:                  string;
    status:                     string;
    bankCategory:               string | null;
    matchedPortfolioMovementId: string | null;
    matchedConfidence:          number | null;
    matchedReason:              string | null;
    matchedAt:                  string | null;
  } | null;
  portfolioMovement: PortfolioMovementDetail | null;
  auditLogs:         AuditLogEntry[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PM_SELECT = {
  id: true, type: true, symbol: true, quantity: true,
  priceUsd: true, feeUsd: true, executedAt: true, source: true,
} as const;

function mapPortfolioMovement(pm: {
  id: string; type: string; symbol: string | null; quantity: number | null;
  priceUsd: number | null; feeUsd: number | null; executedAt: Date; source: string;
}): PortfolioMovementDetail {
  return {
    id:         pm.id,
    type:       pm.type,
    symbol:     pm.symbol,
    quantity:   pm.quantity,
    priceUsd:   pm.priceUsd,
    feeUsd:     pm.feeUsd,
    executedAt: pm.executedAt.toISOString(),
    source:     pm.source,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function getStagingDetail(id: string, userId: string): Promise<StagingDetailResult> {

  // ── Try EXCHANGE first ────────────────────────────────────────────────────
  const primaryRecord = await prisma.exchangeImportRecord.findFirst({
    where: { id, userId },
  });

  if (primaryRecord) {
    let groupRecords = [primaryRecord];

    if (primaryRecord.movementId) {
      groupRecords = await prisma.exchangeImportRecord.findMany({
        where:   { userId, movementId: primaryRecord.movementId },
        orderBy: { occurredAt: "asc" },
      });
    } else {
      const windowMs = 5 * 60 * 1000;
      const from     = new Date(primaryRecord.occurredAt.getTime() - windowMs);
      const to       = new Date(primaryRecord.occurredAt.getTime() + windowMs);
      groupRecords   = await prisma.exchangeImportRecord.findMany({
        where:   { userId, normalizedEventType: primaryRecord.normalizedEventType, occurredAt: { gte: from, lte: to } },
        orderBy: { occurredAt: "asc" },
      });
    }

    const portfolioMovement = primaryRecord.movementId
      ? await prisma.portfolioMovement.findFirst({
          where:  { id: primaryRecord.movementId, userId, deletedAt: null },
          select: PM_SELECT,
        })
      : null;

    const recordIds   = groupRecords.map((r) => r.id);
    const recentAudit = await prisma.adminAuditLog.findMany({
      where:   { targetUserId: userId, action: { in: ["BINANCE_IMPORT_CONFIRMED", "BINANCE_IMPORT_REJECTED"] } },
      orderBy: { createdAt: "desc" },
      take:    200,
    });

    const auditLogs: AuditLogEntry[] = recentAudit
      .filter((log) => {
        if (!log.metadata) return false;
        try {
          const meta           = JSON.parse(log.metadata) as Record<string, unknown>;
          const importRecordId = meta.importRecordId as string | undefined;
          return importRecordId ? recordIds.includes(importRecordId) : false;
        } catch { return false; }
      })
      .map((log) => ({ id: log.id, action: log.action, reason: null, createdAt: log.createdAt.toISOString() }));

    return {
      itemId:  id,
      source:  STAGING_SOURCE.EXCHANGE,
      exchangeRecords: groupRecords.map((r) => ({
        id:                  r.id,
        provider:            r.provider,
        status:              r.status,
        occurredAt:          r.occurredAt.toISOString(),
        normalizedEventType: r.normalizedEventType,
        externalType:        r.externalType,
        normalizedJson:      r.normalizedJson,
        rawPayloadPreview:   r.rawPayload?.slice(0, 1500) ?? null,
        taxTreatment:        r.taxTreatment,
        inventoryEffect:     r.inventoryEffect,
        economicEffect:      r.economicEffect,
        movementId:          r.movementId,
      })),
      bankMovement:      null,
      portfolioMovement: portfolioMovement ? mapPortfolioMovement(portfolioMovement) : null,
      auditLogs,
    };
  }

  // ── Try BANK ──────────────────────────────────────────────────────────────
  const bankMovement = await prisma.bankMovement.findFirst({ where: { id, userId } });

  if (bankMovement) {
    const portfolioMovement = bankMovement.matchedPortfolioMovementId
      ? await prisma.portfolioMovement.findFirst({
          where:  { id: bankMovement.matchedPortfolioMovementId, userId, deletedAt: null },
          select: PM_SELECT,
        })
      : null;

    const rawAuditLogs = await prisma.bankReconciliationAuditLog.findMany({
      where:   { bankMovementId: id, userId },
      orderBy: { createdAt: "desc" },
      take:    50,
    });

    return {
      itemId:  id,
      source:  STAGING_SOURCE.BANK,
      exchangeRecords: [],
      bankMovement: {
        id:                         bankMovement.id,
        bankName:                   bankMovement.bankName,
        occurredAt:                 bankMovement.occurredAt.toISOString(),
        description:                bankMovement.description,
        amountClp:                  bankMovement.amountClp,
        direction:                  bankMovement.direction,
        status:                     bankMovement.status,
        bankCategory:               bankMovement.bankCategory,
        matchedPortfolioMovementId: bankMovement.matchedPortfolioMovementId,
        matchedConfidence:          bankMovement.matchedConfidence,
        matchedReason:              bankMovement.matchedReason,
        matchedAt:                  bankMovement.matchedAt?.toISOString() ?? null,
      },
      portfolioMovement: portfolioMovement ? mapPortfolioMovement(portfolioMovement) : null,
      auditLogs: rawAuditLogs.map((log) => ({
        id:         log.id,
        action:     log.action,
        confidence: log.confidence,
        reason:     log.reason,
        createdAt:  log.createdAt.toISOString(),
      })),
    };
  }

  throw new StagingError("NOT_FOUND");
}
