import { rejectImport } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { findExchangeRecordsByIds } from "../infrastructure/stagingRepository";
import { writeExchangeRejectAudit } from "../infrastructure/stagingAuditRepository";
import { syncExchangeStagingEvent } from "./upsertStagingEvent";
import { StagingError } from "../domain/StagingError";
export { StagingError as StagingValidationError };
import type { StagingActor } from "../domain/StagingEvent";

export type RejectExchangeEventInput = {
  recordIds: string[];
  actor:     StagingActor;
  reason?:   string;
};

export type RejectExchangeEventResult = {
  rejectedCount: number;
  skipped:       number;
};

export async function rejectNormalizedExchangeEvent(
  input: RejectExchangeEventInput,
): Promise<RejectExchangeEventResult> {
  const { recordIds, actor, reason } = input;

  const records = await findExchangeRecordsByIds(recordIds, actor.id);

  if (records.length !== recordIds.length) {
    throw new StagingError("NOT_FOUND");
  }

  if (records.some((r) => r.status === "CONFIRMED")) {
    throw new StagingError("ALREADY_PROCESSED");
  }

  const toReject = records.filter((r) => r.status !== "REJECTED");

  for (const record of toReject) {
    await rejectImport(record.id, actor.id);
  }

  const primary      = records.find((r) => r.provider === "BINANCE") ?? records[0];
  const beforeStatus = primary?.status ?? "PENDING";

  if (primary) {
    await writeExchangeRejectAudit(
      actor,
      { userId: actor.id, recordIds, beforeStatus, afterStatus: "REJECTED" },
      {
        provider:       primary.provider,
        importRecordId: primary.id,
        externalId:     primary.externalId,
        externalType:   primary.externalType,
        ...(reason ? { reason } : {}),
        rejectedCount:  toReject.length,
        totalInGroup:   records.length,
        providers:      [...new Set(records.map((r) => r.provider))],
      },
    );
  }

  if (primary) {
    await syncExchangeStagingEvent(primary.id, "REJECTED");
  }

  return { rejectedCount: toReject.length, skipped: records.length - toReject.length };
}
