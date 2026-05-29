import { prisma } from "@/lib/prisma";
import type { TimelineEvent } from "../domain/TimelineEvent";

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

export async function getExchangeTimelineEvents(
  recordIds: string[],
  userId:    string,
): Promise<TimelineEvent[]> {
  const auditLogs = await prisma.adminAuditLog.findMany({
    where:   { targetUserId: userId, action: { in: ["BINANCE_IMPORT_CONFIRMED", "BINANCE_IMPORT_REJECTED"] } },
    orderBy: { createdAt: "asc" },
    take:    200,
  });
  return auditLogs
    .filter((log) => {
      const meta = parseMeta(log.metadata);
      const id   = meta.importRecordId as string | undefined;
      return id ? recordIds.includes(id) : false;
    })
    .map((log) => {
      const meta = parseMeta(log.metadata);
      const type = log.action === "BINANCE_IMPORT_CONFIRMED" ? "STAGING_CONFIRMED" : "STAGING_REJECTED";
      return {
        at:       log.createdAt.toISOString(),
        type,
        label:    type === "STAGING_CONFIRMED" ? "Confirmado desde staging" : "Rechazado desde staging",
        actor:    log.actorEmail ?? null,
        metadata: {
          decisionHash: meta.decisionHash ?? null,
          beforeStatus: meta.beforeStatus ?? null,
          afterStatus:  meta.afterStatus  ?? null,
        },
      };
    });
}

export async function getBankAuditTimelineEvents(
  bankMovementId: string,
  userId:         string,
): Promise<TimelineEvent[]> {
  const LABEL: Record<string, string> = {
    BANK_IMPORT_REJECTED:   "Movimiento ignorado",
    BANK_MATCH_CONFIRMED:   "Conciliado con portafolio",
    BANK_MATCH_REJECTED:    "Match rechazado",
    BANK_MOVEMENT_REVIEWED: "Enviado a revisión",
  };
  const logs = await prisma.bankReconciliationAuditLog.findMany({
    where:   { bankMovementId, userId },
    orderBy: { createdAt: "asc" },
  });
  return logs.map((log) => {
    const type = log.action === "BANK_MOVEMENT_REVIEWED" ? "BANK_REVIEWED" : log.action;
    const meta = parseMeta(log.metadata);
    return {
      at:       log.createdAt.toISOString(),
      type,
      label:    LABEL[log.action] ?? log.action,
      actor:    null,
      metadata: { ...meta, confidence: log.confidence ?? null, reason: log.reason ?? null },
    };
  });
}

export async function getStagingDecisionsByValidationCode(
  validationCode: string,
) {
  return prisma.stagingDecision.findUnique({
    where: { validationCode },
  });
}
