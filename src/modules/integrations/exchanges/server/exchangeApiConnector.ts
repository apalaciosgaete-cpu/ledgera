import crypto from "node:crypto";

import ccxt from "ccxt";
import Orionx from "orionx-sdk";

import {
  getExchangeApiConfig,
  type ExchangeApiConfig,
} from "@/modules/integrations/exchanges/shared/exchangeApiConfig";

export type ExchangeApiCredentials = {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
};

export type NormalizedExchangeApiEvent = {
  externalId: string;
  externalType: string;
  type: "BUY" | "SELL" | "TRANSFER_IN" | "TRANSFER_OUT" | "FEE" | "OTHER";
  symbol: string;
  quantity: number;
  quoteSymbol?: string;
  price?: number;
  feeAmount?: number;
  feeSymbol?: string;
  executedAt: Date;
  rawPayload: unknown;
};

export type ExchangeApiSyncResult = {
  events: NormalizedExchangeApiEvent[];
  warnings: string[];
};

type CcxtTradeLike = {
  id?: string;
  order?: string;
  timestamp?: number;
  datetime?: string;
  symbol?: string;
  side?: string;
  amount?: number;
  price?: number;
  fee?: { cost?: number; currency?: string } | null;
  info?: unknown;
};

type CcxtTransactionLike = {
  id?: string;
  txid?: string;
  timestamp?: number;
  datetime?: string;
  currency?: string;
  amount?: number;
  fee?: { cost?: number; currency?: string } | null;
  status?: string;
  info?: unknown;
};

type CcxtBalanceLike = {
  total?: Record<string, number | undefined>;
};

type CcxtMarketLike = {
  symbol?: string;
  base?: string;
  quote?: string;
  active?: boolean;
  spot?: boolean;
};

type CcxtExchangeLike = {
  has: Record<string, boolean | string | undefined>;
  loadMarkets(): Promise<Record<string, CcxtMarketLike>>;
  fetchBalance(): Promise<CcxtBalanceLike>;
  fetchMyTrades(symbol?: string, since?: number, limit?: number): Promise<CcxtTradeLike[]>;
  fetchDeposits?(code?: string, since?: number, limit?: number): Promise<CcxtTransactionLike[]>;
  fetchWithdrawals?(code?: string, since?: number, limit?: number): Promise<CcxtTransactionLike[]>;
};

type OrionxCurrency = { code?: string; units?: number };
type OrionxTransaction = {
  _id?: string;
  id?: string;
  amount?: number;
  commission?: number;
  currency?: OrionxCurrency;
  date?: number | string;
  type?: string;
  adds?: boolean;
  price?: number;
  hash?: string | null;
  market?: {
    mainCurrency?: OrionxCurrency;
    secondaryCurrency?: OrionxCurrency;
  } | null;
};

type OrionxClientLike = {
  accounts: {
    getAccounts(): Promise<unknown>;
    getTransactions(filters?: Record<string, unknown>): Promise<unknown>;
  };
};

type OrionxConstructor = new (
  apiKey: string,
  apiSecret: string,
  endpoint?: string,
) => OrionxClientLike;

type CryptoMktTrade = {
  id?: number | string;
  order_id?: number | string;
  symbol?: string;
  side?: string;
  quantity?: string;
  price?: string;
  fee?: string;
  timestamp?: string;
};

type CryptoMktWalletTransaction = {
  id?: number | string;
  created_at?: string;
  status?: string;
  type?: string;
  operation_id?: string;
  native?: {
    tx_id?: string;
    currency?: string;
    amount?: string | number;
    fee?: string | number;
  };
};

const CRYPTOMKT_API_BASE = "https://api.exchange.cryptomkt.com/api/3";
const ORIONX_GRAPHQL_ENDPOINT = "https://api.orionx.com/graphql";
const CRYPTOMKT_QUOTES = ["USDT", "USDC", "BTC", "ETH", "DAI", "CLP", "EUR", "USD"];

function asFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function eventDate(timestamp?: number, datetime?: string): Date {
  const candidate = timestamp ? new Date(timestamp) : datetime ? new Date(datetime) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

function stableExternalId(parts: unknown[]): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

function splitCcxtSymbol(symbol?: string): { base: string; quote?: string } {
  const clean = String(symbol ?? "").split(":")[0];
  const [base, quote] = clean.split("/");
  return { base: (base || "UNKNOWN").toUpperCase(), quote: quote?.toUpperCase() };
}

function splitCryptoMktSymbol(symbol?: string): { base: string; quote?: string } {
  const clean = String(symbol ?? "").toUpperCase();
  const quote = CRYPTOMKT_QUOTES.find(
    (candidate) => clean.endsWith(candidate) && clean.length > candidate.length,
  );
  return quote ? { base: clean.slice(0, -quote.length), quote } : { base: clean || "UNKNOWN" };
}

function normalizeCcxtTrade(
  exchangeId: string,
  trade: CcxtTradeLike,
): NormalizedExchangeApiEvent {
  const pair = splitCcxtSymbol(trade.symbol);
  const executedAt = eventDate(trade.timestamp, trade.datetime);
  const quantity = Math.abs(asFiniteNumber(trade.amount));
  const price = asFiniteNumber(trade.price);
  const side = String(trade.side ?? "").toLowerCase();
  const id = String(
    trade.id ??
      stableExternalId([
        exchangeId,
        trade.order,
        trade.symbol,
        trade.timestamp,
        side,
        quantity,
        price,
      ]),
  );

  return {
    externalId: `${exchangeId}:trade:${id}`,
    externalType: "trade",
    type: side === "sell" ? "SELL" : "BUY",
    symbol: pair.base,
    quantity,
    quoteSymbol: pair.quote,
    price,
    feeAmount: Math.abs(asFiniteNumber(trade.fee?.cost)),
    feeSymbol: trade.fee?.currency?.toUpperCase(),
    executedAt,
    rawPayload: trade,
  };
}

function normalizeCcxtTransaction(
  exchangeId: string,
  transaction: CcxtTransactionLike,
  direction: "TRANSFER_IN" | "TRANSFER_OUT",
): NormalizedExchangeApiEvent {
  const executedAt = eventDate(transaction.timestamp, transaction.datetime);
  const quantity = Math.abs(asFiniteNumber(transaction.amount));
  const id = String(
    transaction.id ??
      transaction.txid ??
      stableExternalId([
        exchangeId,
        direction,
        transaction.currency,
        transaction.timestamp,
        quantity,
      ]),
  );

  return {
    externalId: `${exchangeId}:${direction.toLowerCase()}:${id}`,
    externalType: direction === "TRANSFER_IN" ? "deposit" : "withdrawal",
    type: direction,
    symbol: String(transaction.currency ?? "UNKNOWN").toUpperCase(),
    quantity,
    feeAmount: Math.abs(asFiniteNumber(transaction.fee?.cost)),
    feeSymbol: transaction.fee?.currency?.toUpperCase(),
    executedAt,
    rawPayload: transaction,
  };
}

function createCcxtExchange(
  config: ExchangeApiConfig,
  credentials: ExchangeApiCredentials,
): CcxtExchangeLike {
  if (!config.ccxtId) throw new Error(`No existe adaptador CCXT para ${config.name}.`);

  const constructors = ccxt as unknown as Record<
    string,
    new (options?: Record<string, unknown>) => CcxtExchangeLike
  >;
  const Constructor = constructors[config.ccxtId];
  if (!Constructor) throw new Error(`CCXT no reconoce el exchange ${config.ccxtId}.`);

  return new Constructor({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    password: credentials.passphrase || undefined,
    enableRateLimit: true,
    options: { defaultType: "spot", adjustForTimeDifference: true },
  });
}

async function fetchCcxtTrades(
  exchange: CcxtExchangeLike,
  since: number,
  limit: number,
  warnings: string[],
): Promise<CcxtTradeLike[]> {
  if (!exchange.has.fetchMyTrades) return [];

  try {
    return await exchange.fetchMyTrades(undefined, since, limit);
  } catch (firstError) {
    try {
      const [markets, balance] = await Promise.all([
        exchange.loadMarkets(),
        exchange.fetchBalance(),
      ]);
      const currencies = new Set(
        Object.entries(balance.total ?? {})
          .filter(([, total]) => asFiniteNumber(total) !== 0)
          .map(([currency]) => currency.toUpperCase()),
      );
      const symbols = Object.values(markets)
        .filter((market) => market.active !== false && market.spot !== false)
        .filter(
          (market) =>
            currencies.has(String(market.base).toUpperCase()) ||
            currencies.has(String(market.quote).toUpperCase()),
        )
        .map((market) => market.symbol)
        .filter((symbol): symbol is string => Boolean(symbol))
        .slice(0, 24);

      const trades: CcxtTradeLike[] = [];
      for (const symbol of symbols) {
        try {
          trades.push(...(await exchange.fetchMyTrades(symbol, since, Math.min(limit, 100))));
        } catch {
          // Un mercado sin historial no bloquea los demás mercados.
        }
      }

      if (trades.length === 0) {
        warnings.push(
          firstError instanceof Error
            ? `No fue posible consultar operaciones: ${firstError.message}`
            : "No fue posible consultar operaciones.",
        );
      }
      return trades;
    } catch (fallbackError) {
      warnings.push(
        fallbackError instanceof Error
          ? `No fue posible consultar operaciones: ${fallbackError.message}`
          : "No fue posible consultar operaciones.",
      );
      return [];
    }
  }
}

async function testCcxtConnection(
  config: ExchangeApiConfig,
  credentials: ExchangeApiCredentials,
): Promise<void> {
  const exchange = createCcxtExchange(config, credentials);
  await exchange.loadMarkets();
  await exchange.fetchBalance();
}

async function syncCcxt(
  config: ExchangeApiConfig,
  credentials: ExchangeApiCredentials,
  since: number,
  limit: number,
): Promise<ExchangeApiSyncResult> {
  const exchange = createCcxtExchange(config, credentials);
  const warnings: string[] = [];
  await exchange.loadMarkets();

  const events = (await fetchCcxtTrades(exchange, since, limit, warnings)).map((trade) =>
    normalizeCcxtTrade(config.id, trade),
  );

  if (exchange.has.fetchDeposits && exchange.fetchDeposits) {
    try {
      const deposits = await exchange.fetchDeposits(undefined, since, limit);
      events.push(
        ...deposits
          .filter(
            (entry) =>
              !["failed", "canceled", "cancelled", "rejected"].includes(
                String(entry.status).toLowerCase(),
              ),
          )
          .map((entry) => normalizeCcxtTransaction(config.id, entry, "TRANSFER_IN")),
      );
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Depósitos no disponibles: ${error.message}`
          : "Depósitos no disponibles.",
      );
    }
  }

  if (exchange.has.fetchWithdrawals && exchange.fetchWithdrawals) {
    try {
      const withdrawals = await exchange.fetchWithdrawals(undefined, since, limit);
      events.push(
        ...withdrawals
          .filter(
            (entry) =>
              !["failed", "canceled", "cancelled", "rejected"].includes(
                String(entry.status).toLowerCase(),
              ),
          )
          .map((entry) => normalizeCcxtTransaction(config.id, entry, "TRANSFER_OUT")),
      );
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Retiros no disponibles: ${error.message}`
          : "Retiros no disponibles.",
      );
    }
  }

  return {
    events: Array.from(new Map(events.map((event) => [event.externalId, event])).values()),
    warnings,
  };
}

function unwrapOrionxTransactions(value: unknown): OrionxTransaction[] {
  if (Array.isArray(value)) return value as OrionxTransaction[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "results", "transactions", "data"]) {
      if (Array.isArray(record[key])) return record[key] as OrionxTransaction[];
    }
  }
  return [];
}

function normalizeOrionxTransaction(
  transaction: OrionxTransaction,
): NormalizedExchangeApiEvent | null {
  const currency = transaction.currency?.code?.toUpperCase() || "UNKNOWN";
  const units = Math.max(0, Number(transaction.currency?.units ?? 0));
  const divisor = 10 ** units;
  const quantity = Math.abs(asFiniteNumber(transaction.amount) / divisor);
  const rawType = String(transaction.type ?? "").toLowerCase();
  const mainCurrency = transaction.market?.mainCurrency?.code?.toUpperCase();

  if (rawType.startsWith("trade") && mainCurrency && currency !== mainCurrency) return null;

  let type: NormalizedExchangeApiEvent["type"] = "OTHER";
  if (rawType.startsWith("trade")) type = transaction.adds ? "BUY" : "SELL";
  else if (["receive", "deposit"].some((value) => rawType.includes(value))) type = "TRANSFER_IN";
  else if (["send", "withdraw"].some((value) => rawType.includes(value))) type = "TRANSFER_OUT";
  else if (rawType.includes("commission") || rawType.includes("fee")) type = "FEE";

  const executedAt = eventDate(
    typeof transaction.date === "number" ? transaction.date : undefined,
    typeof transaction.date === "string" ? transaction.date : undefined,
  );
  const id = String(
    transaction._id ??
      transaction.id ??
      transaction.hash ??
      stableExternalId([rawType, currency, quantity, executedAt.toISOString()]),
  );

  return {
    externalId: `orionx:transaction:${id}`,
    externalType: rawType || "transaction",
    type,
    symbol: currency,
    quantity,
    quoteSymbol: transaction.market?.secondaryCurrency?.code?.toUpperCase(),
    price: asFiniteNumber(transaction.price),
    feeAmount: Math.abs(asFiniteNumber(transaction.commission) / divisor),
    feeSymbol: currency,
    executedAt,
    rawPayload: transaction,
  };
}

function createOrionxClient(credentials: ExchangeApiCredentials): OrionxClientLike {
  const Constructor = Orionx as unknown as OrionxConstructor;
  return new Constructor(
    credentials.apiKey,
    credentials.apiSecret,
    ORIONX_GRAPHQL_ENDPOINT,
  );
}

async function testOrionxConnection(credentials: ExchangeApiCredentials): Promise<void> {
  await createOrionxClient(credentials).accounts.getAccounts();
}

async function syncOrionx(
  credentials: ExchangeApiCredentials,
  since: number,
  limit: number,
): Promise<ExchangeApiSyncResult> {
  const raw = await createOrionxClient(credentials).accounts.getTransactions({
    page: 1,
    limit,
    sortType: "DESC",
  });
  const events = unwrapOrionxTransactions(raw)
    .map(normalizeOrionxTransaction)
    .filter((event): event is NormalizedExchangeApiEvent => Boolean(event))
    .filter((event) => event.executedAt.getTime() >= since);

  return { events, warnings: [] };
}

function cryptoMktAuthorization(
  method: string,
  url: URL,
  apiKey: string,
  apiSecret: string,
): string {
  const timestamp = Date.now().toString();
  const window = "10000";
  const message = `${method.toUpperCase()}${url.pathname}${url.search}${timestamp}${window}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex");
  return `HS256 ${Buffer.from(`${apiKey}:${signature}:${timestamp}:${window}`).toString("base64")}`;
}

async function cryptoMktRequest<T>(
  path: string,
  credentials: ExchangeApiCredentials,
  query?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${CRYPTOMKT_API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: cryptoMktAuthorization(
        "GET",
        url,
        credentials.apiKey,
        credentials.apiSecret,
      ),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`CryptoMKT API ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}

async function testCryptoMktConnection(credentials: ExchangeApiCredentials): Promise<void> {
  await cryptoMktRequest<unknown[]>("/spot/balance", credentials);
}

function normalizeCryptoMktTrade(trade: CryptoMktTrade): NormalizedExchangeApiEvent {
  const pair = splitCryptoMktSymbol(trade.symbol);
  const id = String(
    trade.id ?? stableExternalId([trade.order_id, trade.symbol, trade.timestamp, trade.quantity]),
  );
  return {
    externalId: `crypto-mkt:trade:${id}`,
    externalType: "trade",
    type: String(trade.side).toLowerCase() === "sell" ? "SELL" : "BUY",
    symbol: pair.base,
    quantity: Math.abs(asFiniteNumber(trade.quantity)),
    quoteSymbol: pair.quote,
    price: asFiniteNumber(trade.price),
    feeAmount: Math.abs(asFiniteNumber(trade.fee)),
    feeSymbol: pair.quote,
    executedAt: eventDate(undefined, trade.timestamp),
    rawPayload: trade,
  };
}

function normalizeCryptoMktWalletTransaction(
  transaction: CryptoMktWalletTransaction,
): NormalizedExchangeApiEvent | null {
  if (!["SUCCESS", "PENDING"].includes(String(transaction.status).toUpperCase())) return null;
  const rawType = String(transaction.type ?? "").toUpperCase();
  if (!["DEPOSIT", "WITHDRAW"].includes(rawType)) return null;

  const direction = rawType === "DEPOSIT" ? "TRANSFER_IN" : "TRANSFER_OUT";
  const id = String(
    transaction.id ??
      transaction.native?.tx_id ??
      transaction.operation_id ??
      stableExternalId([transaction]),
  );

  return {
    externalId: `crypto-mkt:${direction.toLowerCase()}:${id}`,
    externalType: rawType.toLowerCase(),
    type: direction,
    symbol: String(transaction.native?.currency ?? "UNKNOWN").toUpperCase(),
    quantity: Math.abs(asFiniteNumber(transaction.native?.amount)),
    feeAmount: Math.abs(asFiniteNumber(transaction.native?.fee)),
    feeSymbol: String(transaction.native?.currency ?? "UNKNOWN").toUpperCase(),
    executedAt: eventDate(undefined, transaction.created_at),
    rawPayload: transaction,
  };
}

async function syncCryptoMkt(
  credentials: ExchangeApiCredentials,
  since: number,
  limit: number,
): Promise<ExchangeApiSyncResult> {
  const from = new Date(since).toISOString();
  const warnings: string[] = [];
  const trades = await cryptoMktRequest<CryptoMktTrade[]>(
    "/spot/history/trade",
    credentials,
    { sort: "DESC", by: "timestamp", from, limit: String(limit) },
  );
  const events = trades.map(normalizeCryptoMktTrade);

  try {
    const transactions = await cryptoMktRequest<CryptoMktWalletTransaction[]>(
      "/wallet/transactions",
      credentials,
      { order_by: "created_at", sort: "DESC", from, limit: String(limit) },
    );
    events.push(
      ...transactions
        .map(normalizeCryptoMktWalletTransaction)
        .filter((event): event is NormalizedExchangeApiEvent => Boolean(event)),
    );
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Movimientos de billetera no disponibles: ${error.message}`
        : "Movimientos de billetera no disponibles.",
    );
  }

  return {
    events: Array.from(new Map(events.map((event) => [event.externalId, event])).values()),
    warnings,
  };
}

export async function testExchangeApiConnection(
  exchangeId: string,
  credentials: ExchangeApiCredentials,
): Promise<void> {
  const config = getExchangeApiConfig(exchangeId);
  if (!config) throw new Error("Exchange sin conector API disponible.");

  if (config.mode === "ccxt") return testCcxtConnection(config, credentials);
  if (config.mode === "orionx") return testOrionxConnection(credentials);
  return testCryptoMktConnection(credentials);
}

export async function syncExchangeApi(
  exchangeId: string,
  credentials: ExchangeApiCredentials,
  options: { since: number; limit: number },
): Promise<ExchangeApiSyncResult> {
  const config = getExchangeApiConfig(exchangeId);
  if (!config) throw new Error("Exchange sin conector API disponible.");

  if (config.mode === "ccxt") {
    return syncCcxt(config, credentials, options.since, options.limit);
  }
  if (config.mode === "orionx") {
    return syncOrionx(credentials, options.since, options.limit);
  }
  return syncCryptoMkt(credentials, options.since, options.limit);
}
