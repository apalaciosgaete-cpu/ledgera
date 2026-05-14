import { db } from "@/infrastructure/db/client";

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

type AdminAuditLogRow = {
  id: string;
  action: string;
  actor_id: string | null;
  actor_email: string | null;
  target_user_id: string | null;
  target_user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: Date | string;
};

export type ListAdminAuditLogsInput = {
  limit?: number;
};

function parseMetadata(value: string | null): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeCreatedAt(
  value: Date | string,
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function mapRowToAdminAuditLog(
  row: AdminAuditLogRow,
): AdminAuditLogDto {
  return {
    id: row.id,
    action: row.action,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    targetUserId: row.target_user_id,
    targetUserEmail: row.target_user_email,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: parseMetadata(row.metadata),
    createdAt: normalizeCreatedAt(row.created_at),
  };
}

export async function listAdminAuditLogs(
  input: ListAdminAuditLogsInput = {},
): Promise<AdminAuditLogDto[]> {
  const limit = Math.min(
    Math.max(input.limit ?? 100, 1),
    250,
  );

  const result = await db.query<AdminAuditLogRow>(
    `
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
      order by created_at desc
      limit $1
    `,
    [limit],
  );

  return result.rows.map(mapRowToAdminAuditLog);
}