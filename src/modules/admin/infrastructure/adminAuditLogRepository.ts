import { randomUUID } from "crypto";
import { db } from "@/infrastructure/db/client";

export type AdminAuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "USER_SUBSCRIPTION_UPDATED"
  | "USER_SUSPENDED"
  | "USER_REACTIVATED"
  | "USER_DELETED";

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
  limit?: number;
  action?: string | null;
};

export function getAuditRequestContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return {
    ipAddress,
    userAgent,
  };
}

export async function createAdminAuditLog(input: CreateAdminAuditLogInput) {
  try {
    await db.query(
      `
        insert into admin_audit_logs (
          id,
          action,
          actor_id,
          actor_email,
          target_user_id,
          target_user_email,
          ip_address,
          user_agent,
          metadata,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      `,
      [
        randomUUID(),
        input.action,
        input.actorId ?? null,
        input.actorEmail ?? null,
        input.targetUserId ?? null,
        input.targetUserEmail ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    );
  } catch (error) {
    console.error("[adminAuditLog] No se pudo registrar auditoría:", error);
  }
}

export async function listAdminAuditLogs(
  input: ListAdminAuditLogsInput = {},
): Promise<AdminAuditLogRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 250);

  const values: unknown[] = [limit];

  let query = `
    select
      id,
      action,
      actor_id,
      actor_email,
      target_user_id,
      target_user_email,
      ip_address,
      user_agent,
      metadata,
      created_at
    from admin_audit_logs
  `;

  if (input.action) {
    values.push(input.action);

    query += `
      where action = $2
    `;
  }

  query += `
    order by created_at desc
    limit $1
  `;

  const result = await db.query<AdminAuditLogRow>(query, values);

  return result.rows;
}