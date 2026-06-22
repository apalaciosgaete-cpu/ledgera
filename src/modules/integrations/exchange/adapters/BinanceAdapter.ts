import type {
  ExchangeAdapter,
  ExchangeCredentials,
  ExchangeRawRecord,
  ExchangeNormalizedRecord,
  SyncPeriodInput,
  ConnectionTestResult,
} from "../ExchangeAdapter";
import { EXCHANGE_PROVIDER, type ExchangeProvider } from "../ExchangeProvider";
import {
  validateApiKey,
  fetchAllDepositsWindowed,
  fetchAllWithdrawalsWindowed,
} from "@/modules/integrations/binance/infrastructure/binanceClient";
import { classifyBinanceEvent } from "@/modules/integrations/binance/domain/taxNormalization";

export class BinanceAdapter implements ExchangeAdapter {
  readonly provider: ExchangeProvider = EXCHANGE_PROVIDER.BINANCE;

  async testConnection(credentials: ExchangeCredentials): Promise<ConnectionTestResult> {
    const result = await validateApiKey(credentials);
    return {
      ok:       result.ok,
      provider: this.provider,
      message:  result.message,
    };
  }

  async fetchRaw(input: SyncPeriodInput): Promise<ExchangeRawRecord[]> {
    const { credentials, from, to } = input;
    const { apiKey, apiSecret }     = credentials;
    const fromMs = from.getTime();
    const toMs   = to.getTime();

    const records: ExchangeRawRecord[] = [];

    for await (const { batch } of fetchAllDepositsWindowed(fromMs, apiKey, apiSecret, toMs)) {
      for (const d of batch) {
        const raw = d as Record<string, unknown>;
        records.push({
          externalId:   String(raw["id"] ?? raw["txId"] ?? `DEP_${raw["insertTime"]}`),
          externalType: "DEPOSIT",
          occurredAt:   new Date(Number(raw["insertTime"])),
          rawPayload:   raw,
        });
      }
    }

    for await (const { batch } of fetchAllWithdrawalsWindowed(fromMs, apiKey, apiSecret, toMs)) {
      for (const w of batch) {
        const raw = w as Record<string, unknown>;
        records.push({
          externalId:   String(raw["id"]),
          externalType: "WITHDRAW",
          occurredAt:   new Date(Number(raw["completeTime"] ?? raw["applyTime"])),
          rawPayload:   raw,
        });
      }
    }

    return records;
  }

  normalize(raw: ExchangeRawRecord): ExchangeNormalizedRecord | null {
    try {
      const p   = raw.rawPayload;
      const tax = classifyBinanceEvent(raw.externalType, raw.externalType);

      const symbol   = String(p["coin"] ?? p["asset"] ?? "UNKNOWN").toUpperCase();
      const quantity = parseFloat(String(p["amount"] ?? p["qty"] ?? "0")) || 0;
      const feeUsd   = parseFloat(String(p["transactionFee"] ?? p["fee"] ?? "0")) || 0;

      const normalizedJson = JSON.stringify({ symbol, quantity, priceUsd: 0, feeUsd });

      return {
        externalId:          raw.externalId,
        externalType:        raw.externalType,
        normalizedEventType: tax.normalizedEventType,
        symbol,
        quantity,
        priceUsd:            0,
        feeUsd,
        occurredAt:          raw.occurredAt,
        taxTreatment:        tax.taxTreatment,
        inventoryEffect:     tax.inventoryEffect,
        economicEffect:      tax.economicEffect,
        normalizedJson,
      };
    } catch {
      return null;
    }
  }
}
