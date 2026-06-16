import { prisma } from "@/lib/prisma";
import type { TimelineEvent, EntityTimelineResult } from "../domain/TimelineEvent";
import { getExchangeTimelineEvents, getBankAuditTimelineEvents } from "../infrastructure/timelineRepository";

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
  ROLLBACK_APPLIED:           "Reversión aplicada",
  DOCUMENT_UPLOADED:          "Documento subido",
  DOCUMENT_ARCHIVED:          "Documento archivado",
  DOCUMENT_DOWNLOADED:        "Documento descargado",
  DOCUMENT_DELETED:           "Documento eliminado",
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

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

async function appendRollbackEvents(
  events:    TimelineEvent[],
  entityId:  string,
  entityType: string,
  userId:    string,
): Promise<void> {
  const rollbacks = await prisma.logicalRollback.findMany({
    where:   { userId, entityType, entityId },
    orderBy: { createdAt: "asc" },
    select:  { createdAt: true, rollbackReason: true, actorEmail: true },
  });
  for (const r of rollbacks) {
    events.push({
      at:       r.createdAt.toISOString(),
      type:     "ROLLBACK_APPLIED",
      label:    EVENT_LABEL.ROLLBACK_APPLIED,
      actor:    r.actorEmail ?? "Sistema",
      metadata: { reason: r.rollbackReason },
    });
  }
}

// ── Resolvers ─────────────────────────────────────────────────────────────────

async function buildStagingTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
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
    const from     = new Date(record.occurredAt.getTime() - windowMs);
    const to       = new Date(record.occurredAt.getTime() + windowMs);
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

  const recordIds    = group.map((r) => r.id);
  const auditEvents  = await getExchangeTimelineEvents(recordIds, userId);
  events.push(...auditEvents);

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

  await appendRollbackEvents(events, id, "STAGING", userId);

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

async function buildBankTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
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

  const auditEvents = await getBankAuditTimelineEvents(id, userId);
  events.push(...auditEvents);

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

  await appendRollbackEvents(events, id, "BANK", userId);

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

async function buildPortfolioTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
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
  await appendRollbackEvents(events, id, "PORTFOLIO", userId);

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function buildDocumentTimeline(id: string, userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) return [];

  events.push({
    at:       document.createdAt.toISOString(),
    type:     "DOCUMENT_UPLOADED",
    label:    EVENT_LABEL.DOCUMENT_UPLOADED,
    actor:    document.uploadedBy ?? "Usuario",
    metadata: { category: document.category, type: document.type, fileName: document.fileName, fileSize: document.fileSize },
  });

  const auditEvents = await prisma.auditEvent.findMany({
    where:   { entityType: "Document", entityId: id, userId },
    orderBy: { createdAt: "asc" },
    select:  { event: true, createdAt: true, actorId: true },
  });

  for (const ae of auditEvents) {
    if (ae.event === "document_archived") {
      events.push({
        at:       ae.createdAt.toISOString(),
        type:     "DOCUMENT_ARCHIVED",
        label:    EVENT_LABEL.DOCUMENT_ARCHIVED,
        actor:    ae.actorId ?? "Sistema",
        metadata: {},
      });
    } else if (ae.event === "document_downloaded") {
      events.push({
        at:       ae.createdAt.toISOString(),
        type:     "DOCUMENT_DOWNLOADED",
        label:    EVENT_LABEL.DOCUMENT_DOWNLOADED,
        actor:    ae.actorId ?? "Usuario",
        metadata: {},
      });
    } else if (ae.event === "document_deleted") {
      events.push({
        at:       ae.createdAt.toISOString(),
        type:     "DOCUMENT_DELETED",
        label:    EVENT_LABEL.DOCUMENT_DELETED,
        actor:    ae.actorId ?? "Usuario",
        metadata: {},
      });
    }
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function buildEntityTimeline(
  entityId:   string,
  entityType: "STAGING" | "BANK" | "PORTFOLIO" | "DOCUMENT",
  userId:     string,
): Promise<EntityTimelineResult> {
  let events: TimelineEvent[] = [];

  if      (entityType === "STAGING")   events = await buildStagingTimeline(entityId, userId);
  else if (entityType === "BANK")      events = await buildBankTimeline(entityId, userId);
  else if (entityType === "PORTFOLIO") events = await buildPortfolioTimeline(entityId, userId);
  else if (entityType === "DOCUMENT")  events = await buildDocumentTimeline(entityId, userId);

  return { entityId, entityType, events };
}
