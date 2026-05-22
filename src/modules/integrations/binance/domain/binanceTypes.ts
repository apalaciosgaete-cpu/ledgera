export type BinanceTradeRaw = {
  symbol:          string;
  id:              number;
  orderId:         number;
  orderListId:     number;
  price:           string;
  qty:             string;
  quoteQty:        string;
  commission:      string;
  commissionAsset: string;
  time:            number;
  isBuyer:         boolean;
  isMaker:         boolean;
  isBestMatch:     boolean;
};

export type BinanceDepositRaw = {
  id:          string;
  amount:      string;
  coin:        string;
  network:     string;
  status:      number;
  address:     string;
  txId:        string;
  insertTime:  number;
  transferType: number;
  confirmTimes: string;
  unlockConfirm: number;
  walletType:  number;
};

export type BinanceWithdrawRaw = {
  id:              string;
  amount:          string;
  transactionFee:  string;
  coin:            string;
  status:          number;
  address:         string;
  txId:            string;
  applyTime:       string;
  network:         string;
  transferType:    number;
  withdrawOrderId: string;
  info:            string;
  confirmNo:       number;
  walletType:      number;
  txKey:           string;
};

export type BinanceAccountInfo = {
  makerCommission:  number;
  takerCommission:  number;
  buyerCommission:  number;
  sellerCommission: number;
  canTrade:         boolean;
  canWithdraw:      boolean;
  canDeposit:       boolean;
  balances: Array<{
    asset:  string;
    free:   string;
    locked: string;
  }>;
  accountType: string;
  permissions: string[];
};

export type NormalizedImportRecord = {
  externalId:          string;
  externalType:        "TRADE" | "DEPOSIT" | "WITHDRAW";
  movementType:        "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
  symbol:              string;
  quantity:            number;
  priceUsd:            number;
  feeUsd:              number;
  occurredAt:          Date;
  quoteAsset?:         string;  // e.g. "USDT", "BTC" — used to detect non-USD-quoted trades
  // Tax normalization — clasificación tributaria chilena
  normalizedEventType: string;
  taxTreatment:        string;
  inventoryEffect:     string;
  economicEffect:      string;
};

export type SyncCheckpoint = Record<string, string>;

export type SymbolSyncStats = {
  imported: number;
  skipped:  number;
  failed:   boolean;
};

export type FirstSyncFailure = {
  symbol:      string;
  windowStart: string;
  windowEnd:   string;
};

export type SyncResult = {
  imported:     number;
  skipped:      number;
  errors:       string[];
  symbolStats:  Record<string, SymbolSyncStats>;
  firstFailure: FirstSyncFailure | null;
};

export const BINANCE_BASE_URL  = "https://api.binance.com";
export const BINANCE_SPOT_PAIRS = [
  // ── USDT (principal) ──────────────────────────────────────────────────────
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "ADAUSDT", "DOGEUSDT", "DOTUSDT", "AVAXUSDT", "LTCUSDT",
  "LINKUSDT", "MATICUSDT", "ATOMUSDT", "UNIUSDT", "AAVEUSDT",
  "SHIBUSDT", "TRXUSDT", "NEARUSDT", "ALGOUSDT", "XLMUSDT",
  "VETUSDT", "FTMUSDT", "SANDUSDT", "MANAUSDT", "AXSUSDT",
  "GALAUSDT", "CHZUSDT", "ENJUSDT", "ZILUSDT", "BATUSDT",
  "ETCUSDT", "BCHUSDT", "FILUSDT", "ICPUSDT", "THETAUSDT",
  "OPUSDT", "ARBUSDT", "APTUSDT", "SUIUSDT", "SEIUSDT",

  // ── USDC ─────────────────────────────────────────────────────────────────
  "BTCUSDC", "ETHUSDC", "SOLUSDC", "BNBUSDC", "XRPUSDC",
  "ADAUSDC", "DOGEUSDC", "AVAXUSDC", "LTCUSDC", "LINKUSDC",
  "DOTUSDC", "ATOMUSDC", "BCHUSDC", "ETCUSDC", "OPUSDC",
  "ARBUSDC", "APTUSDC", "SUIUSDC",

  // ── FDUSD (reemplazó BUSD en 2023) ───────────────────────────────────────
  "BTCFDUSD", "ETHFDUSD", "SOLFDUSD", "BNBFDUSD", "XRPFDUSD",
  "ADAFDUSD", "DOGEFDUSD", "AVAXFDUSD",

  // ── BUSD (histórico, Binance lo descontinuó en 2023) ─────────────────────
  "BTCBUSD", "ETHBUSD", "BNBBUSD", "SOLBUSD", "XRPBUSD",
  "ADABUSD", "DOGEBUSD", "DOTBUSD", "AVAXBUSD", "LTCBUSD",

  // ── Pares BTC (cruzados) ──────────────────────────────────────────────────
  "ETHBTC", "BNBBTC", "SOLBTC", "XRPBTC", "ADABTC",
  "DOTBTC", "LINKBTC", "LTCBTC", "BCHBTC", "ETCBTC",
];

export const MS_24H  = 24  * 60 * 60 * 1000;
export const MS_90D  = 90  * 24 * 60 * 60 * 1000;
