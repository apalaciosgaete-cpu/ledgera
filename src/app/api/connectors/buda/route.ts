import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { decryptSecret, encryptSecret } from "@/modules/security/application/encryption";
import {
  enforceImportSourceLimit,
  isImportSourceLimitError,
} from "@/modules/subscription/application/enforceImportSourceLimit";
import { BudaConnector } from "@/services/connectors/budaConnector";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BudaAction = "connect" | "import";

type BudaRequestBody = {
  apiKey?: string;
  apiSecret?: string;
  action?: BudaAction;
  marketId?: string;
  limit?: number;
};

function normalizeMarketId(marketId?: string): string {
  const value = (marketId || "btc-clp").trim().toLowerCase();
  return /^[a-z0-9]{2,12}-[a-z0-9]{2,12}$/.test(value) ? value : "btc-clp";
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const connection = await prisma.exchangeConnection.findUnique({
      where: { userId_exchange: { userId: auth.user.id, exchange: "buda" } },
    });

    if (!connection) {
      return ok({ connected: false }, "Sin conexión Buda.com configurada.");
    }

    return ok(
      {
        connected: true,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        apiKeyHint: decryptSecret(connection.apiKeyEncrypted).slice(-4),
      },
      "Conexión Buda.com encontrada.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as BudaRequestBody;
    const action = body.action;
    const marketId = normalizeMarketId(body.marketId);

    if (!action) return fail("La acción es obligatoria.", 400);

    if (action === "connect") {
      const apiKey = String(body.apiKey ?? "").trim();
      const apiSecret = String(body.apiSecret ?? "").trim();

      if (!apiKey || !apiSecret) {
        return fail("API Key y API Secret son obligatorios.", 400);
      }

      await enforceImportSourceLimit({
        userId: auth.user.id,
        source: "BUDA",
      });

      const connector = new BudaConnector({ apiKey, apiSecret });
      const test = await connector.testConnection();

      if (!test.success) {
        return fail(`No fue posible validar la conexión con Buda.com. ${test.message}`, 422);
      }

      const connection = await prisma.exchangeConnection.upsert({
        where: { userId_exchange: { userId: auth.user.id, exchange: "buda" } },
        update: {
          apiKeyEncrypted: encryptSecret(apiKey),
          apiSecretEncrypted: encryptSecret(apiSecret),
          status: "CONNECTED",
          permissions: JSON.stringify(["read"]),
        },
        create: {
          userId: auth.user.id,
          exchange: "buda",
          apiKeyEncrypted: encryptSecret(apiKey),
          apiSecretEncrypted: encryptSecret(apiSecret),
          status: "CONNECTED",
          permissions: JSON.stringify(["read"]),
        },
      });

      return ok(
        {
          connected: true,
          status: connection.status,
          apiKeyHint: apiKey.slice(-4),
          lastSyncAt: connection.lastSyncAt,
        },
        "Buda.com conectado correctamente con permisos de lectura.",
        201,
      );
    }

    const connection = await prisma.exchangeConnection.findUnique({
      where: { userId_exchange: { userId: auth.user.id, exchange: "buda" } },
    });

    if (!connection || !["CONNECTED", "ACTIVE"].includes(connection.status)) {
      return fail("No hay una conexión activa con Buda.com.", 400);
    }

    const connector = new BudaConnector({
      apiKey: decryptSecret(connection.apiKeyEncrypted),
      apiSecret: decryptSecret(connection.apiSecretEncrypted),
    });

    const limit = Math.min(Math.max(Number(body.limit ?? 100), 1), 1000);
    const trades = await connector.getTrades(marketId, limit);

    let imported = 0;
    let skipped = 0;

    for (const trade of trades) {
      const normalized = connector.normalizeTrade(trade, marketId);
      const externalId = `buda:${marketId}:${trade.id}`;

      const record = await prisma.exchangeImportRecord.upsert({
        where: {
          userId_provider_externalId: {
            userId: auth.user.id,
            provider: "buda",
            externalId,
          },
        },
        update: {
          rawPayload: JSON.stringify(trade),
          normalizedJson: JSON.stringify(normalized),
          normalizedEventType: normalized.type,
          occurredAt: normalized.executedAt,
        },
        create: {
          userId: auth.user.id,
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

      const existingSource = await prisma.stagingEventSource.findFirst({
        where: { provider: "buda", recordId: record.id },
        select: { id: true },
      });

      if (existingSource) {
        skipped += 1;
        continue;
      }

      const quantity = Number.isFinite(normalized.quantity) ? normalized.quantity : 0;
      const feeClp = Number.isFinite(normalized.feeClp) ? normalized.feeClp : 0;

      await prisma.stagingEvent.create({
        data: {
          userId: auth.user.id,
          source: "EXCHANGE",
          provider: "buda",
          status: "PENDING",
          normalizedType: normalized.type,
          title: `${normalized.type === "BUY" ? "Compra" : "Venta"} ${quantity} ${normalized.symbol}`,
          subtitle: `${marketId.toUpperCase()} · Comisión ${feeClp.toLocaleString("es-CL")} CLP`,
          amountLabel: `${quantity} ${normalized.symbol}`,
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

      imported += 1;
    }

    const updated = await prisma.exchangeConnection.update({
      where: { id: connection.id },
      data: { status: "ACTIVE", lastSyncAt: new Date() },
    });

    return ok(
      {
        imported,
        skipped,
        total: trades.length,
        marketId,
        lastSyncAt: updated.lastSyncAt,
      },
      `Importación Buda.com completada: ${imported} operaciones nuevas y ${skipped} omitidas por duplicidad.`,
    );
  } catch (error) {
    if (isImportSourceLimitError(error)) {
      return fail(error.message, error.status);
    }

    return serverError(error);
  }
}
