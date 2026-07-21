import { prisma } from "@/lib/prisma";

export type AdminAuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "ADMIN_REAUTHENTICATED"
  | "USER_SUBSCRIPTION_UPDATED"
  | "USER_SUSPENDED"
  | "USER_REACTIVATED"
  | "USER_DELETED"
  | "USER_LEGAL_CONSENT_RECORDED"
  | "BINANCE_CONNECTED"
  | "BINANCE_CONNECTION_TESTED"
  | "BINANCE_TAX_CONNECTED"
  | "BINANCE_TAX_CONNECTION_TESTED"
  | "BINANCE_SYNC_STARTED"
  | "BINANCE_SYNC_COMPLETED"
  | "BINANCE_SYNC_FAILED"
  | "BINANCE_IMPORT_CONFIRMED"
  | "BINANCE_IMPORT_REJECTED"
  | "TAX_LEDGER_REBUILT"
  | "ANNUAL_SUMMARY_REBUILT"
  | "PROFESSIONAL_CLIENT_INVITED"
  | "PROFESSIONAL_CLIENT_ACCESS_ACCEPTED"
  | "PROFESSIONAL_CLIENT_ACCESS_DECLINED"
  | "PROFESSIONAL_CLIENT_ACCESS_REVOKED"
  | "PROFESSIONAL_ACCESS_REVOKED_BY_CLIENT"
  | "PROFESSIONAL_CLIENT_DATA_ACCESSED"
  | "PROFESSIONAL_CLIENT_WORKFLOW_UPDATED";

export type AdminAuditLogRow = {
  id: string;
  action: AdminAuditAction;
  actor_id: string | null;
  actor_email: string | null;
  target_user_id: string | null;
  target_user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: Date | string;
};

type CreateAdminAuditLogInput = {
  action: AdminAuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ListAdminAuditLogsInput = {
  limit?:        number;
  action?:       string | null;
  actionPrefix?: string | null;
};

export function getAuditRequestContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ipAddress, userAgent };
}

export async function createAdminAuditLog(input: CreateAdminAuditLogInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        action:          input.action,
        actorId:         input.actorId ?? null,
        actorEmail:      input.actorEmail ?? null,
        targetUserId:    input.targetUserId ?? null,
        targetUserEmail: input.targetUserEmail ?? null,
        ipAddress:       input.ipAddress ?? null,
        userAgent:       input.userAgent ?? null,
        metadata:        input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[adminAuditLog] No se pudo registrar auditoría:", error);
  }
}

export async function listAdminAuditLogs(
  input: ListAdminAuditLogsInput = {},
): Promise<AdminAuditLogRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);

  const where = input.action
    ? { action: input.action }
    : input.actionPrefix
      ? { action: { startsWith: input.actionPrefix } }
      : undefined;

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id:                log.id,
    action:            log.action as AdminAuditAction,
    actor_id:          log.actorId,
    actor_email:       log.actorEmail,
    target_user_id:    log.targetUserId,
    target_user_email: log.targetUserEmail,
    ip_address:        log.ipAddress,
    user_agent:        log.userAgent,
    metadata:          log.metadata,
    created_at:        log.createdAt,
  }));
}
