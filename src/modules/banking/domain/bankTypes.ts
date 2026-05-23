export type BankMovementDirection = "INFLOW" | "OUTFLOW";

export type ParsedBankMovement = {
  occurredAt: Date;
  description: string;
  amountClp: number;
  direction: BankMovementDirection;
  balanceClp?: number | null;
  raw: Record<string, unknown>;
};

// Used by CSV template persistence and legacy UI
export interface ColMapping {
  colDate:    string;
  colDesc:    string;
  colAmount:  string | null;
  colDebit:   string | null;
  colCredit:  string | null;
  colBalance: string | null;
}
