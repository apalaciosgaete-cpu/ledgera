export type BankDirection = "INFLOW" | "OUTFLOW";
export type BankMovementStatus = "IMPORTED" | "REVIEWED" | "IGNORED";

export interface BankMovementDto {
  id:          string;
  userId:      string;
  source:      string;
  bankName:    string | null;
  externalId:  string | null;
  occurredAt:  string; // ISO string
  description: string;
  amountClp:   number;
  direction:   BankDirection;
  balanceClp:  number | null;
  status:      BankMovementStatus;
  rawJson:     string | null;
  createdAt:   string;
}

export interface BankCsvTemplateDto {
  id:         string;
  userId:     string;
  bankName:   string;
  colDate:    string;
  colDesc:    string;
  colAmount:  string | null;
  colDebit:   string | null;
  colCredit:  string | null;
  colBalance: string | null;
}

export interface ParsedBankRow {
  occurredAt:  Date;
  description: string;
  amountClp:   number;
  direction:   BankDirection;
  balanceClp:  number | null;
  rawJson:     string;
}

export interface ColMapping {
  colDate:    string;
  colDesc:    string;
  colAmount:  string | null;
  colDebit:   string | null;
  colCredit:  string | null;
  colBalance: string | null;
}
