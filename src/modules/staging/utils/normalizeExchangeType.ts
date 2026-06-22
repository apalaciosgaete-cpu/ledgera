const TYPE_MAP: Record<string, string> = {
  // Binance Spot raw
  TRADE:    "SPOT_TRADE",
  BUY:      "SPOT_BUY",
  SELL:     "SPOT_SELL",
  DEPOSIT:  "EXTERNAL_DEPOSIT",
  WITHDRAW: "EXTERNAL_WITHDRAW",
  P2P:      "P2P",
  TRANSFER: "INTERNAL_TRANSFER",
  STAKING:  "STAKING_REWARD",
  REWARD:   "STAKING_REWARD",
  AIRDROP:  "AIRDROP",
  FEE:      "FEE",
  // Binance Tax API labels
  "Spot Trading":              "SPOT_TRADE",
  "Fiat Deposit":              "FIAT_DEPOSIT",
  "Fiat Withdrawal":           "FIAT_WITHDRAW",
  "Crypto Deposit":            "EXTERNAL_DEPOSIT",
  "Crypto Withdrawal":         "EXTERNAL_WITHDRAW",
  "P2P Trading":               "P2P",
  "Small assets exchange BNB": "INTERNAL_TRANSFER",
  "Transfer Between Accounts": "INTERNAL_TRANSFER",
  "Staking Rewards":           "STAKING_REWARD",
  "Simple Earn Flexible Interest": "STAKING_REWARD",
  "Simple Earn Locked Rewards":    "STAKING_REWARD",
  "Commission History":        "FEE_REBATE",
  "Referral Kickback":         "FEE_REBATE",
};

export function normalizeExchangeType(rawType: string): string {
  return TYPE_MAP[rawType] ?? TYPE_MAP[rawType.toUpperCase()] ?? "UNKNOWN";
}

export function isKnownExchangeType(rawType: string): boolean {
  return rawType in TYPE_MAP || rawType.toUpperCase() in TYPE_MAP;
}
