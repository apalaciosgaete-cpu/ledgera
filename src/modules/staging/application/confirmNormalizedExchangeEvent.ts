import { confirmImport } from "@/modules/integrations/binance/infrastructure/exchangeImportRepository";
import { confirmExchangeRecord } from "@/modules/integrations/binance/application/confirmExchangeRecord";
import type { ConfirmOverride } from "@/modules/integrations/binance/application/confirmExchangeRecord";
import { rebuildTaxEvents } from "@/modules/tax/application/rebuildTaxEvents";
import {
  findExchangeRecordsByIds,
} from "../infrastructure/stagingRepository";
import { writeExchangeConfirmAudit } from "../infrastructure/stagingAuditRepository";
import { syncExchangeStagingEvent } from "./upsertStagingEvent";
import type { StagingActor } from "../domain/StagingEvent";

export type ConfirmExchangeEventInput = {
  recordIds: string[];
  actor:     StagingActor;
  override?: ConfirmOverride;
};

export type ConfirmExchangeEventResult = {
  movementId:       string;
  confirmedCount:   number;
  taxEventsRebuilt: boolean;
};

import { StagingError } from "../domain/StagingError";
export { StagingError as StagingValidationError };

export async function confirmNormalizedExchangeEvent(
  input: ConfirmExchangeEventInput,
): Promise<ConfirmExchangeEventResult> {
  const { recordIds, actor, override } = input;

  const records = await findExchangeRecordsByIds(recordIds, actor.id);

  if (records.length !== recordIds.length) {
    throw new StagingError("NOT_FOUND");
  }

  if (records.some((r) => r.status === "CONFIRMED" || r.status === "REJECTED")) {
    throw new StagingError("ALREADY_PROCESSED");
  }

  const primary = records.find((r) => r.provider === "BINANCE") ?? records[0];
  const others  = records.filter((r) => r.id !== primary.id);

  const parsed      = JSON.parse(primary.normalizedJson ?? "{}") as Record<string, unknown>;
  const movementType = typeof parsed.movementType === "string" ? parsed.movementType : null;

  if (!movementType || !["BUY", "SELL", "DEPOSIT", "WITHDRAW"].includes(movementType)) {
    throw new StagingError("TYPE_UNKNOWN");
  }

  const beforeStatus = primary.status;

  const { movementId } = await confirmExchangeRecord(primary, override);

  for (const other of others) {
    await confirmImport(other.id, actor.id, movementId);
  }

  await writeExchangeConfirmAudit(
    actor,
    { userId: actor.id, recordIds, movementId, beforeStatus, afterStatus: "CONFIRMED" },
    {
      provider:       primary.provider,
      importRecordId: primary.id,
      externalId:     primary.externalId,
      externalType:   primary.externalType,
    },
  );

  const rebuild = await rebuildTaxEvents(actor.id);

  await syncExchangeStagingEvent(primary.id, "CONFIRMED");

  return { movementId, confirmedCount: records.length, taxEventsRebuilt: rebuild.ok };
}
