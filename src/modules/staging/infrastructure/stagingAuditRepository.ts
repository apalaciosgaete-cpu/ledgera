import { prisma } from "@/lib/prisma";
import {
  createAdminAuditLog,
} from "@/modules/admin/infrastructure/adminAuditLogRepository";
import { createStableSha256Hash } from "@/shared/hash";
import type { StagingActor } from "../domain/StagingEvent";
import type {
  ExchangeConfirmPayload,
  ExchangeRejectPayload,
  BankIgnorePayload,
  BankMatchConfirmPayload,
} from "../domain/StagingDecision";

// ── Exchange audit ────────────────────────────────────────────────────────────

export async function writeExchangeConfirmAudit(
  actor:       StagingActor,
  payload:     Omit<ExchangeConfirmPayload, "action" | "at">,
  extra: {
    provider:      string;
    importRecordId: string;
    externalId:    string;
    externalType:  string;
  },
): Promise<void> {
  const decisionPayload: ExchangeConfirmPayload = {
    action:  "BINANCE_IMPORT_CONFIRMED",
    at:      new Date().toISOString(),
    ...payload,
  };
  await createAdminAuditLog({
    action:          "BINANCE_IMPORT_CONFIRMED",
    actorId:         actor.id,
    actorEmail:      actor.email,
    targetUserId:    actor.id,
    targetUserEmail: actor.email,
    ipAddress:       actor.context.ipAddress,
    userAgent:       actor.context.userAgent,
    metadata: {
      ...extra,
      source:        "IMPORTS_STAGING",
      beforeStatus:  payload.beforeStatus,
      afterStatus:   "CONFIRMED",
      recordIds:     payload.recordIds,
      decisionHash:  createStableSha256Hash(decisionPayload),
    },
  });
}

export async function writeExchangeRejectAudit(
  actor:   StagingActor,
  payload: Omit<ExchangeRejectPayload, "action" | "at">,
  extra: {
    provider:       string;
    importRecordId: string;
    externalId:     string;
    externalType:   string;
    reason?:        string;
    rejectedCount:  number;
    totalInGroup:   number;
    providers:      string[];
  },
): Promise<void> {
  const decisionPayload: ExchangeRejectPayload = {
    action: "BINANCE_IMPORT_REJECTED",
    at:     new Date().toISOString(),
    ...payload,
  };
  await createAdminAuditLog({
    action:          "BINANCE_IMPORT_REJECTED",
    actorId:         actor.id,
    actorEmail:      actor.email,
    targetUserId:    actor.id,
    targetUserEmail: actor.email,
    ipAddress:       actor.context.ipAddress,
    userAgent:       actor.context.userAgent,
    metadata: {
      ...extra,
      source:        "IMPORTS_STAGING",
      beforeStatus:  payload.beforeStatus,
      afterStatus:   "REJECTED",
      recordIds:     payload.recordIds,
      decisionHash:  createStableSha256Hash(decisionPayload),
    },
  });
}

// ── Bank audit ────────────────────────────────────────────────────────────────

export async function writeBankIgnoreAudit(
  userId:  string,
  payload: Omit<BankIgnorePayload, "action" | "at">,
): Promise<void> {
  const decisionPayload: BankIgnorePayload = {
    action: "BANK_IMPORT_REJECTED",
    at:     new Date().toISOString(),
    ...payload,
  };
  await prisma.bankReconciliationAuditLog.create({
    data: {
      userId,
      action:         "BANK_IMPORT_REJECTED",
      bankMovementId: payload.bankMovementIds[0],
      metadata:       JSON.stringify({
        source:          "IMPORTS_STAGING",
        bankMovementIds: payload.bankMovementIds,
        beforeStatuses:  payload.beforeStatuses,
        afterStatus:     "IGNORED",
        ...(payload.reason ? { reason: payload.reason } : {}),
        decisionHash:    createStableSha256Hash(decisionPayload),
      }),
    },
  });
}

export async function writeBankIgnoreAuditBatch(
  userId:  string,
  ids:     string[],
  reason:  string,
): Promise<void> {
  await prisma.bankReconciliationAuditLog.createMany({
    data: ids.map((id) => ({
      userId,
      action:         "BANK_IMPORT_REJECTED",
      bankMovementId: id,
      metadata:       JSON.stringify({
        source: "IMPORTS_STAGING",
        reason,
      }),
    })),
  });
}

export async function writeBankMatchConfirmAudit(
  userId:  string,
  payload: Omit<BankMatchConfirmPayload, "action" | "at">,
): Promise<void> {
  const decisionPayload: BankMatchConfirmPayload = {
    action: "BANK_MATCH_CONFIRMED",
    at:     new Date().toISOString(),
    ...payload,
  };
  await prisma.bankReconciliationAuditLog.create({
    data: {
      userId,
      action:              "BANK_MATCH_CONFIRMED",
      bankMovementId:      payload.bankMovementId,
      portfolioMovementId: payload.portfolioMovementId,
      confidence:          payload.confidence,
      reason:              payload.reason,
      metadata:            JSON.stringify({
        source:              "IMPORTS_STAGING",
        beforeStatus:        payload.beforeStatus,
        afterStatus:         "MATCHED",
        bankMovementIds:     [payload.bankMovementId],
        portfolioMovementId: payload.portfolioMovementId,
        decisionHash:        createStableSha256Hash(decisionPayload),
      }),
    },
  });
}
