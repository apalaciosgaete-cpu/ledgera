import { randomUUID } from "crypto";
import { db } from "@/infrastructure/db/client";

export type AdminAuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "USER_SUBSCRIPTION_UPDATED"
  | "USER_SUSPENDED"
  | "USER_REACTIVATED"
  | "USER_DELETED";

type CreateAdminAuditLogInput = {
  action: AdminAuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  metadata?: Record<string, unknown> | null;
};

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
          metadata,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, now())
      `,
      [
        randomUUID(),
        input.action,
        input.actorId ?? null,
        input.actorEmail ?? null,
        input.targetUserId ?? null,
        input.targetUserEmail ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    );
  } catch (error) {
    console.error("[adminAuditLog] No se pudo registrar auditoría:", error);
  }
}