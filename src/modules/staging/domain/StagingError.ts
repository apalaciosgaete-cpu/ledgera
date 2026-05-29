export type StagingErrorCode =
  // Exchange
  | "NOT_FOUND"
  | "ALREADY_PROCESSED"
  | "TYPE_UNKNOWN"
  // Bank
  | "BANK_MOVEMENT_NOT_FOUND"
  | "ALREADY_MATCHED"
  | "ALREADY_IGNORED"
  | "PORTFOLIO_MOVEMENT_NOT_FOUND";

export class StagingError extends Error {
  constructor(public readonly code: StagingErrorCode) {
    super(code);
  }
}
