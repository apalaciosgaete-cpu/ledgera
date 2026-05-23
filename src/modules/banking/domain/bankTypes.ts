export type BankDirection       = "INFLOW" | "OUTFLOW";
export type BankMovementStatus  = "IMPORTED" | "REVIEWED" | "IGNORED";
export type BankFileType        = "CSV" | "XLSX" | "PDF";
export type BankUploadStatus    = "IMPORTED" | "PARTIAL" | "FAILED" | "REVIEW";

export interface ParsedBankRow {
  occurredAt:  Date;
  description: string;
  amountClp:   number;
  direction:   BankDirection;
  balanceClp:  number | null;
  rawJson:     string;
}

export interface ParseBankFileResult {
  rows:         ParsedBankRow[];
  errors:       string[];
  fileType:     BankFileType;
  needsReview:  boolean;
}

export interface ColMapping {
  colDate:    string;
  colDesc:    string;
  colAmount:  string | null;
  colDebit:   string | null;
  colCredit:  string | null;
  colBalance: string | null;
}
