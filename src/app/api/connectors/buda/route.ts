import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/modules/security/application/encryption";
import { BudaConnector } from "@/services/connectors/budaConnector";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

type BudaAction = "connect" | "import";

type BudaRequestBody = {
  userId?: string;
  apiKey?: string;
  apiSecret?: string;
  action?: BudaAction;
  marketId?: string;
  limit?: number;
};

function normalizeMarketId(marketId?: string): string {
  return (marketId || "btc-clp").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BudaRequestBody;
    const userId = String(body.userId ?? "").trim();
    const action = body.action;
    const marketId = normalizeMarketId(body.marketId);

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId y action son obligatorios" },
        { status: 400 },
      );
    }

    if (action === "connect") {
      const apiKey = String(body.apiKey ?? "").trim();
      const apiSecret = String(body.apiSecret ?? "").trim();

      if (!apiKey || !apiSecret) {
        return NextResponse.json(
          { error: "apiKey y apiSecret son obligatorios" },
          { status: 400 },
        );
      }

      const connector = new BudaConnector({ apiKey, apiSecret });
      const test = await connector.testConnection();

      if (!test.success) {
        return NextResponse.json({ error: test.message }, { status: 400 });
      }

      await prisma.exchangeConnection.upsert({
        where: { userId_exchange: { userId, exchange: "buda" } },
        update: {
          apiKeyEncrypted: encryptSecret(apiKey),
          apiSecretEncrypted: encryptSecret(apiSecret),
          status: "CONNECTED",
          permissions: JSON.stringify(["read"]),
        },
        create: {
          userId,
          exchange: "buda",
          apiKeyEncrypted: encryptSecret(apiKey),
          apiSecretEncrypted: encryptSecret(apiSecret),
          status: "CONNECTED",
          permissions: JSON.stringify(["read"]),
        },
      });

      return NextResponse.json({ success: true, message: "Conectado a Buda.com" });
    }

    if (action === "import") {
      const connection = await prisma.exchangeConnection.findFirst({
        where: { userId, exchange: "buda", status: { in: ["CONNECTED", "ACTIVE"] } },
      });

      if (!connection) {
        return NextResponse.json({ error: "No hay conexion activa" }, { status: 400 });
      }

      const connector = new BudaConnector({
        apiKey: decryptSecret(connection.apiKeyEncrypted),
        apiSecret: decryptSecret(connection.apiSecretEncrypted),
      });
      const trades = await connector.getTrades(marketId, body.limit ?? 100);

      const imported = await Promise.all(
        trades.map(async (trade) => {
          const normalized = connector.normalizeTrade(trade, marketId);
          const externalId = `buda:${marketId}:${trade.id}`;

          const record = await prisma.exchangeImportRecord.upsert({
            where: { userId_provider_externalId: { userId, provider: "buda", externalId } },
            update: {
              rawPayload: JSON.stringify(trade),
              normalizedJson: JSON.stringify(normalized),
              normalizedEventType: normalized.type,
              occurredAt: normalized.executedAt,
            },
            create: {
              userId,
              connectionId: connection.id,
              provider: "buda",
              externalId,
              externalType: trade.type,
              rawPayload: JSON.stringify(trade),
              normalizedJson: JSON.stringify(normalized),
              normalizedEventType: normalized.type,
              status: "PENDING",
              occurredAt: normalized.executedAt,
            },
          });

          const title = `${normalized.type === "BUY" ? "Compra" : "Venta"} ${trade.amount[0]} ${normalized.symbol}`;

          return prisma.stagingEvent.create({
            data: {
              userId,
              source: "EXCHANGE",
              provider: "buda",
              status: "PENDING",
              normalizedType: normalized.type,
              title,
              occurredAt: normalized.executedAt,
              metadata: JSON.stringify(normalized),
              sources: {
                create: {
                  provider: "buda",
                  recordId: record.id,
                  rawType: trade.type,
                  metadata: JSON.stringify({ marketId, externalId, rawPayload: trade }),
                },
              },
            },
          });
        }),
      );

      return NextResponse.json({
        success: true,
        imported: imported.length,
        events: imported,
      });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    console.error("[connectors/buda]", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 },
    );
  }
}
