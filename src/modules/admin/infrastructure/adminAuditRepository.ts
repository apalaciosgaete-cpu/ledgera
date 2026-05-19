import { prisma } from "@/lib/prisma";

export type AdminAuditLogDto = {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export type ListAdminAuditLogsInput = {
  limit?: number;
};

function parseMetadata(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function listAdminAuditLogs(
  input: ListAdminAuditLogsInput = {},
): Promise<AdminAuditLogDto[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id:              log.id,
    action:          log.action,
    actorId:         log.actorId,
    actorEmail:      log.actorEmail,
    targetUserId:    log.targetUserId,
    targetUserEmail: log.targetUserEmail,
    ipAddress:       log.ipAddress,
    userAgent:       log.userAgent,
    metadata:        parseMetadata(log.metadata),
    createdAt:       log.createdAt.toISOString(),
  }));
}
