import type { NextRequest } from "next/server";
import {
  createAdminAuditLog,
  getAuditRequestContext,
  type AdminAuditAction,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";

export type BinanceAuditAction = Extract<
  AdminAuditAction,
  | "BINANCE_CONNECTED"
  | "BINANCE_CONNECTION_TESTED"
  | "BINANCE_SYNC_STARTED"
  | "BINANCE_SYNC_COMPLETED"
  | "BINANCE_SYNC_FAILED"
  | "BINANCE_IMPORT_CONFIRMED"
  | "BINANCE_IMPORT_REJECTED"
>;

export type BinanceAuditMetadata = {
  provider:        "BINANCE";
  status:          "SUCCESS" | "FAILED";
  connectionId?:   string;
  importRecordId?: string;
  externalId?:     string;
  externalType?:   string;
  apiKeyHint?:     string;
  accountType?:    string;
  canTrade?:       boolean;
  permissionsCount?: number;
  balancesWithFunds?: number;
  stats?: {
    imported: number;
    skipped:  number;
    errors:   number;
  };
  error?: string;
};

export async function logBinanceAuditEvent(
  request:    NextRequest,
  action:     BinanceAuditAction,
  actorId:    string,
  actorEmail: string,
  metadata:   BinanceAuditMetadata,
): Promise<void> {
  const { ipAddress, userAgent } = getAuditRequestContext(request);

  await createAdminAuditLog({
    action,
    actorId,
    actorEmail,
    targetUserId:    actorId,
    targetUserEmail: actorEmail,
    ipAddress,
    userAgent,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}
