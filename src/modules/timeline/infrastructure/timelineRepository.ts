import { prisma } from "@/lib/prisma";
import type {
  CreateTimelineEventInput,
  TimelineEvent,
  TimelineCategory,
  TimelineSeverity,
} from "@/modules/timeline/domain/timeline";
import type { TimelineEvent as EntityTimelineEvent } from "../domain/TimelineEvent";

// ── Persistent timeline events ────────────────────────────────────────────────

export async function createTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEvent> {
  const row = await prisma.timelineEvent.create({
    data: {
      userId: input.userId,
      category: input.category,
      severity: input.severity,
      title: input.title,
      description: input.description,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: (input.metadata as any) ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });

  return mapTimelineEvent(row);
}

export async function getTimelineEventById(id: string): Promise<TimelineEvent | null> {
  const row = await prisma.timelineEvent.findUnique({ where: { id } });
  return row ? mapTimelineEvent(row) : null;
}

export async function listUserTimeline(
  userId: string,
  options: {
    category?: TimelineCategory;
    severity?: TimelineSeverity;
    from?: Date;
    to?: Date;
    limit?: number;
    cursor?: string;
  } = {},
): Promise<TimelineEvent[]> {
  return listTimeline({ ...options, userId });
}

export async function listTimeline(options: {
  userId?: string;
  category?: TimelineCategory;
  severity?: TimelineSeverity;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  cursor?: string;
} = {}): Promise<TimelineEvent[]> {
  const limit = options.limit ?? 50;

  const rows = await prisma.timelineEvent.findMany({
    where: {
      userId: options.userId,
      category: options.category,
      severity: options.severity,
      entityType: options.entityType,
      entityId: options.entityId,
      occurredAt: {
        gte: options.from,
        lte: options.to,
      },
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: limit,
    // Implementación estándar de cursor pagination en Prisma
    ...(options.cursor ? {
      cursor: { id: options.cursor },
      skip: 1,
    } : {}),
  });

  return rows.map(mapTimelineEvent);
}

export async function countTimelineEvents(options: {
  userId?: string;
  category?: TimelineCategory;
  severity?: TimelineSeverity;
  from?: Date;
  to?: Date;
} = {}): Promise<number> {
  return prisma.timelineEvent.count({
    where: {
      userId: options.userId,
      category: options.category,
      severity: options.severity,
      occurredAt: {
        gte: options.from,
        lte: options.to,
      },
    },
  });
}

export async function getTimelineMetrics(options: { userId?: string } = {}) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalToday, totalLast30Days, criticalEvents] = await Promise.all([
    prisma.timelineEvent.count({
      where: {
        ...options,
        occurredAt: { gte: startOfToday },
      },
    }),
    prisma.timelineEvent.count({
      where: {
        ...options,
        occurredAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.timelineEvent.count({
      where: {
        ...options,
        severity: "CRITICAL",
      },
    }),
  ]);

  return { totalToday, totalLast30Days, criticalEvents };
}

function mapTimelineEvent(row: {
  id: string;
  userId: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}): TimelineEvent {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as TimelineCategory,
    severity: row.severity as TimelineSeverity,
    title: row.title,
    description: row.description,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

// ── Entity-derived timeline helpers ───────────────────────────────────────────

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

export async function getExchangeTimelineEvents(
  recordIds: string[],
  userId:    string,
): Promise<EntityTimelineEvent[]> {
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
): Promise<EntityTimelineEvent[]> {
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
