import crypto from "node:crypto";

const BUDA_API_BASE = "https://www.buda.com/api/v2";

export interface BudaCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface BudaTrade {
  id: string;
  type: "Bid" | "Ask";
  amount: [string, string];
  price: [string, string];
  fee: [string, string];
  created_at: string;
}

type BudaTradesResponse = {
  trades?: {
    entries?: BudaTrade[];
  };
};

type BudaBalancesResponse = {
  balances?: unknown[];
};

export class BudaConnector {
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(credentials: BudaCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }

  generateSignature(method: string, path: string, nonce: string): string {
    const message = `${method.toUpperCase()} ${path} ${nonce}`;

    return crypto
      .createHmac("sha384", this.apiSecret)
      .update(message)
      .digest("hex");
  }

  private async request<T>(method: string, path: string): Promise<T> {
    const normalizedMethod = method.toUpperCase();
    const nonce = Date.now().toString();
    const signature = this.generateSignature(normalizedMethod, path, nonce);

    const response = await fetch(`${BUDA_API_BASE}${path}`, {
      method: normalizedMethod,
      headers: {
        "X-SBTC-APIKEY": this.apiKey,
        "X-SBTC-NONCE": nonce,
        "X-SBTC-SIGNATURE": signature,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Buda API error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getTrades(marketId = "btc-clp", limit = 100): Promise<BudaTrade[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 1000);
    const data = await this.request<BudaTradesResponse>(
      "GET",
      `/markets/${marketId}/trades?limit=${safeLimit}`,
    );

    return data.trades?.entries ?? [];
  }

  async getBalances(): Promise<unknown[]> {
    const data = await this.request<BudaBalancesResponse>("GET", "/balances");

    return data.balances ?? [];
  }

  normalizeTrade(trade: BudaTrade, marketId: string) {
    const [baseAsset] = marketId.split("-");

    return {
      txIdExterno: trade.id,
      type: trade.type === "Bid" ? "BUY" : "SELL",
      symbol: (baseAsset || "btc").toUpperCase(),
      quantity: Number.parseFloat(trade.amount[0]),
      priceClp: Number.parseFloat(trade.price[0]),
      feeClp: Number.parseFloat(trade.fee[0]),
      executedAt: new Date(trade.created_at),
      source: "BUDA",
      provider: "buda.com",
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getBalances();
      return { success: true, message: "Conexion exitosa" };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Conexion fallida",
      };
    }
  }
}
