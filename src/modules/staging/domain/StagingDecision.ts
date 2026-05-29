// Shapes for decision audit payloads.
// These are serialized to JSON and hashed — field names are part of the protocol.

export type DecisionSource = "IMPORTS_STAGING";

export type ExchangeConfirmPayload = {
  action:       "BINANCE_IMPORT_CONFIRMED";
  userId:       string;
  recordIds:    string[];
  movementId:   string;
  beforeStatus: string;
  afterStatus:  "CONFIRMED";
  at:           string;
};

export type ExchangeRejectPayload = {
  action:       "BINANCE_IMPORT_REJECTED";
  userId:       string;
  recordIds:    string[];
  beforeStatus: string;
  afterStatus:  "REJECTED";
  at:           string;
};

export type BankIgnorePayload = {
  action:          "BANK_IMPORT_REJECTED";
  userId:          string;
  bankMovementIds: string[];
  beforeStatuses:  Record<string, string>;
  afterStatus:     "IGNORED";
  reason?:         string;
  at:              string;
};

export type BankMatchConfirmPayload = {
  action:              "BANK_MATCH_CONFIRMED";
  userId:              string;
  bankMovementId:      string;
  portfolioMovementId: string;
  confidence:          number;
  reason:              string;
  beforeStatus:        string;
  afterStatus:         "MATCHED";
  at:                  string;
};
