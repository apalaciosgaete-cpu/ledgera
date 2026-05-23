export type BankMovementDirection = "INFLOW" | "OUTFLOW";

export type ParsedBankMovement = {
  occurredAt:  Date;
  description: string;
  amountClp:   number;
  direction:   BankMovementDirection;
  balanceClp?: number | null;
  raw:         Record<string, unknown>;
};

// ── Internal helpers (not exported to external consumers) ─────────────────────
export type BankFileType     = "CSV" | "XLSX" | "PDF";
export type BankUploadStatus = "IMPORTED" | "PARTIAL" | "FAILED" | "REVIEW";

export interface ParseBankFileResult {
  rows:        ParsedBankMovement[];
  errors:      string[];
  fileType:    BankFileType;
  needsReview: boolean;
}

export interface ColMapping {
  colDate:    string;
  colDesc:    string;
  colAmount:  string | null;
  colDebit:   string | null;
  colCredit:  string | null;
  colBalance: string | null;
}
