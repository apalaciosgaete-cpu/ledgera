import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  AuditCategory,
  AuditEvent,
  AuditResult,
  AuditSeverity,
  CreateAuditEventInput,
} from "@/modules/audit/domain/audit";

export async function createAuditEvent(
  input: CreateAuditEventInput,
): Promise<AuditEvent> {
  const row = await prisma.auditEvent.create({
    data: {
      userId: input.userId ?? null,
      actorId: input.actorId ?? null,
      category: input.category,
      severity: input.severity,
      event: input.event,
      description: input.description,
      result: input.result ?? "SUCCESS",
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });

  return mapAuditEvent(row);
}

export async function getAuditEventById(id: string): Promise<AuditEvent | null> {
  const row = await prisma.auditEvent.findUnique({ where: { id } });
  return row ? mapAuditEvent(row) : null;
}

export async function listAuditEvents(filters?: {
  category?: AuditCategory;
  severity?: AuditSeverity;
  result?: AuditResult;
  userId?: string;
  actorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}): Promise<AuditEvent[]> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      category: filters?.category,
      severity: filters?.severity,
      result: filters?.result,
      userId: filters?.userId,
      actorId: filters?.actorId,
      createdAt: {
        gte: filters?.dateFrom,
        lte: filters?.dateTo,
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return rows.map(mapAuditEvent);
}

export async function listUserAuditEvents(userId: string): Promise<AuditEvent[]> {
  const rows = await prisma.auditEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map(mapAuditEvent);
}

export async function listCategoryAuditEvents(
  category: AuditCategory,
): Promise<AuditEvent[]> {
  const rows = await prisma.auditEvent.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map(mapAuditEvent);
}

function mapAuditEvent(row: {
  id: string;
  userId: string | null;
  actorId: string | null;
  category: string;
  severity: string;
  event: string;
  description: string;
  result: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}): AuditEvent {
  return {
    id: row.id,
    userId: row.userId,
    actorId: row.actorId,
    category: row.category as AuditCategory,
    severity: row.severity as AuditSeverity,
    event: row.event,
    description: row.description,
    result: row.result as AuditResult,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}
