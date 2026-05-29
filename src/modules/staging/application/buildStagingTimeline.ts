import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimelineEvent = {
  at:              string;
  type:            string;
  label:           string;
  actor:           string | null;
  metadata?:       Record<string, unknown>;
  validationCode?: string | null;
};

// ── Labels ────────────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  IMPORT_SYNCED:              "Importado desde exchange",
  STAGING_NORMALIZED:         "Registro normalizado",
  STAGING_CONFIRMED:          "Confirmado desde staging",
  STAGING_REJECTED:           "Rechazado desde staging",
  BANK_IMPORTED:              "Movimiento bancario importado",
  BANK_REVIEWED:              "Enviado a revisión",
  BANK_MATCH_CONFIRMED:       "Conciliado con portafolio",
  BANK_MATCH_REJECTED:        "Match rechazado",
  BANK_IMPORT_REJECTED:       "Movimiento ignorado",
  PORTFOLIO_MOVEMENT_CREATED: "Movimiento de portafolio creado",
  TAX_EVENT_GENERATED:        "Evento tributario generado",
  TAX_PERIOD_CLOSED:          "Período tributario cerrado",
  REPORT_ISSUED:              "Reporte emitido",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

async function appendTaxAndReport(
  events:     TimelineEvent[],
  movementId: string,
  userId:     string,
): Promise<void> {
  const taxEvent = await prisma.taxEvent.findFirst({
    where:  { movementId, userId },
    select: { id: true, eventType: true, executedAt: true, taxYear: true, realizedPnlUsd: true },
  });
  if (!taxEvent) return;

  events.push({
    at:       taxEvent.executedAt.toISOString(),
    type:     "TAX_EVENT_GENERATED",
    label:    EVENT_LABEL.TAX_EVENT_GENERATED,
    actor:    "Sistema",
    metadata: { eventType: taxEvent.eventType, taxYear: taxEvent.taxYear, realizedPnlUsd: taxEvent.realizedPnlUsd },
  });

  const periodClose = await prisma.taxPeriodClose.findFirst({
    where:  { userId, periodYear: taxEvent.taxYear, status: "CLOSED" },
    select: { closedAt: true, periodYear: true },
  });
  if (periodClose) {
    events.push({
      at:       periodClose.closedAt.toISOString(),
      type:     "TAX_PERIOD_CLOSED",
      label:    EVENT_LABEL.TAX_PERIOD_CLOSED,
      actor:    null,
      metadata: { year: periodClose.periodYear },
    });
  }

  const report = await prisma.reportValidation.findFirst({
    where:   { year: taxEvent.taxYear },
    orderBy: { issuedAt: "asc" },
    select:  { issuedAt: true, type: true, hash: true },
  });
  if (report) {
    events.push({
      at:             report.issuedAt.toISOString(),
      type:           "REPORT_ISSUED",
      label:          EVENT_LABEL.REPORT_ISSUED,
      actor:          null,
      metadata:       { reportType: report.type, year: taxEvent.taxYear },
      validationCode: report.hash,
    });
  }
}

// ── Resolvers ─────────────────────────────────────────────────────────────────

export async function buildStagingTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const record = await prisma.exchangeImportRecord.findFirst({ where: { id, userId } });
  if (!record) return [];

  let group = [record];
  if (record.movementId) {
    group = await prisma.exchangeImportRecord.findMany({
      where:   { userId, movementId: record.movementId },
      orderBy: { occurredAt: "asc" },
    });
  } else {
    const windowMs = 5 * 60 * 1000;
    const from = new Date(record.occurredAt.getTime() - windowMs);
    const to   = new Date(record.occurredAt.getTime() + windowMs);
    group = await prisma.exchangeImportRecord.findMany({
      where:   { userId, normalizedEventType: record.normalizedEventType, occurredAt: { gte: from, lte: to } },
      orderBy: { occurredAt: "asc" },
    });
  }

  for (const r of group) {
    events.push({
      at:       r.createdAt.toISOString(),
      type:     "IMPORT_SYNCED",
      label:    EVENT_LABEL.IMPORT_SYNCED,
      actor:    r.provider,
      metadata: { externalType: r.externalType, externalId: r.externalId },
    });
    if (r.normalizedJson) {
      events.push({
        at:       r.createdAt.toISOString(),
        type:     "STAGING_NORMALIZED",
        label:    EVENT_LABEL.STAGING_NORMALIZED,
        actor:    "Sistema",
        metadata: { normalizedEventType: r.normalizedEventType },
      });
    }
  }

  const recordIds = group.map((r) => r.id);
  const auditLogs = await prisma.adminAuditLog.findMany({
    where:   { targetUserId: userId, action: { in: ["BINANCE_IMPORT_CONFIRMED", "BINANCE_IMPORT_REJECTED"] } },
    orderBy: { createdAt: "asc" },
    take:    200,
  });
  for (const log of auditLogs) {
    const meta           = parseMeta(log.metadata);
    const importRecordId = meta.importRecordId as string | undefined;
    if (!importRecordId || !recordIds.includes(importRecordId)) continue;
    const type = log.action === "BINANCE_IMPORT_CONFIRMED" ? "STAGING_CONFIRMED" : "STAGING_REJECTED";
    events.push({
      at:       log.createdAt.toISOString(),
      type,
      label:    EVENT_LABEL[type],
      actor:    log.actorEmail ?? null,
      metadata: { decisionHash: meta.decisionHash ?? null, beforeStatus: meta.beforeStatus ?? null, afterStatus: meta.afterStatus ?? null },
    });
  }

  const movementId = group.find((r) => r.movementId)?.movementId ?? null;
  if (movementId) {
    const pm = await prisma.portfolioMovement.findFirst({
      where:  { id: movementId, userId, deletedAt: null },
      select: { id: true, type: true, symbol: true, quantity: true, executedAt: true, source: true },
    });
    if (pm) {
      events.push({
        at:       pm.executedAt.toISOString(),
        type:     "PORTFOLIO_MOVEMENT_CREATED",
        label:    EVENT_LABEL.PORTFOLIO_MOVEMENT_CREATED,
        actor:    pm.source,
        metadata: { movementId: pm.id, movementType: pm.type, symbol: pm.symbol, quantity: pm.quantity },
      });
      await appendTaxAndReport(events, pm.id, userId);
    }
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function buildBankTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const bm = await prisma.bankMovement.findFirst({ where: { id, userId } });
  if (!bm) return [];

  events.push({
    at:       bm.createdAt.toISOString(),
    type:     "BANK_IMPORTED",
    label:    EVENT_LABEL.BANK_IMPORTED,
    actor:    bm.bankName ?? "Banco",
    metadata: { bankName: bm.bankName, direction: bm.direction, amountClp: bm.amountClp },
  });

  const AUDIT_TYPE_MAP: Record<string, string> = {
    BANK_IMPORT_REJECTED:   "BANK_IMPORT_REJECTED",
    BANK_MATCH_CONFIRMED:   "BANK_MATCH_CONFIRMED",
    BANK_MATCH_REJECTED:    "BANK_MATCH_REJECTED",
    BANK_MOVEMENT_REVIEWED: "BANK_REVIEWED",
  };

  const auditLogs = await prisma.bankReconciliationAuditLog.findMany({
    where:   { bankMovementId: id, userId },
    orderBy: { createdAt: "asc" },
  });
  for (const log of auditLogs) {
    const type = AUDIT_TYPE_MAP[log.action] ?? log.action;
    const meta = parseMeta(log.metadata);
    events.push({
      at:       log.createdAt.toISOString(),
      type,
      label:    EVENT_LABEL[type] ?? log.action,
      actor:    null,
      metadata: { ...meta, confidence: log.confidence ?? null, reason: log.reason ?? null },
    });
  }

  if (bm.matchedPortfolioMovementId) {
    const pm = await prisma.portfolioMovement.findFirst({
      where:  { id: bm.matchedPortfolioMovementId, userId, deletedAt: null },
      select: { id: true, type: true, symbol: true, quantity: true, executedAt: true, source: true },
    });
    if (pm) {
      events.push({
        at:       pm.executedAt.toISOString(),
        type:     "PORTFOLIO_MOVEMENT_CREATED",
        label:    EVENT_LABEL.PORTFOLIO_MOVEMENT_CREATED,
        actor:    pm.source,
        metadata: { movementId: pm.id, movementType: pm.type, symbol: pm.symbol, quantity: pm.quantity },
      });
      await appendTaxAndReport(events, pm.id, userId);
    }
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function buildPortfolioTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const pm = await prisma.portfolioMovement.findFirst({ where: { id, userId, deletedAt: null } });
  if (!pm) return [];

  const importRecord = await prisma.exchangeImportRecord.findFirst({
    where:  { movementId: id, userId },
    select: { provider: true, externalType: true, normalizedEventType: true, createdAt: true },
  });
  if (importRecord) {
    events.push({
      at:       importRecord.createdAt.toISOString(),
      type:     "IMPORT_SYNCED",
      label:    EVENT_LABEL.IMPORT_SYNCED,
      actor:    importRecord.provider,
      metadata: { externalType: importRecord.externalType, normalizedEventType: importRecord.normalizedEventType },
    });
  }

  const bankMovement = await prisma.bankMovement.findFirst({
    where:  { matchedPortfolioMovementId: id, userId },
    select: { id: true, bankName: true, matchedAt: true, matchedConfidence: true },
  });
  if (bankMovement?.matchedAt) {
    events.push({
      at:       bankMovement.matchedAt.toISOString(),
      type:     "BANK_MATCH_CONFIRMED",
      label:    EVENT_LABEL.BANK_MATCH_CONFIRMED,
      actor:    null,
      metadata: { bankMovementId: bankMovement.id, bankName: bankMovement.bankName, confidence: bankMovement.matchedConfidence },
    });
  }

  events.push({
    at:       pm.executedAt.toISOString(),
    type:     "PORTFOLIO_MOVEMENT_CREATED",
    label:    EVENT_LABEL.PORTFOLIO_MOVEMENT_CREATED,
    actor:    pm.source,
    metadata: { type: pm.type, symbol: pm.symbol, quantity: pm.quantity },
  });

  await appendTaxAndReport(events, pm.id, userId);

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
