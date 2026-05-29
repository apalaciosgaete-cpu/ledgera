import { STAGING_STATUS, type StagingStatus } from "../domain/StagingStatus";

const RAW_TO_CANONICAL: Record<string, StagingStatus> = {
  // ExchangeImportRecord
  PENDING:     STAGING_STATUS.PENDING,
  REVIEW:      STAGING_STATUS.REVIEW,
  CONFIRMED:   STAGING_STATUS.CONFIRMED,
  REJECTED:    STAGING_STATUS.REJECTED,
  // BankMovement
  IMPORTED:    STAGING_STATUS.PENDING,
  MATCHED:     STAGING_STATUS.CONFIRMED,
  IGNORED:     STAGING_STATUS.REJECTED,
  // Rollback
  ROLLED_BACK: STAGING_STATUS.ROLLED_BACK,
};

export function normalizeStagingStatus(rawStatus: string): StagingStatus {
  return RAW_TO_CANONICAL[rawStatus] ?? STAGING_STATUS.PENDING;
}

export function isFinalStatus(status: StagingStatus): boolean {
  return (
    status === STAGING_STATUS.CONFIRMED ||
    status === STAGING_STATUS.REJECTED  ||
    status === STAGING_STATUS.ROLLED_BACK
  );
}

export function isActionableStatus(status: StagingStatus): boolean {
  return status === STAGING_STATUS.PENDING || status === STAGING_STATUS.REVIEW;
}
