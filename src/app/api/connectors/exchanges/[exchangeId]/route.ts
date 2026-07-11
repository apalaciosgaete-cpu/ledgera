import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { enforceCsrfProtection } from "@/modules/security/application/csrfProtection";
import { decryptSecret, encryptSecret } from "@/modules/security/application/encryption";
import { getExchangeApiConfig } from "@/modules/integrations/exchanges/shared/exchangeApiConfig";
import {
  isStableQuote,
  syncExchangeApi,
  testExchangeApiConnection,
  type ExchangeApiCredentials,
  type NormalizedExchangeApiEvent,
} from "@/modules/integrations/exchanges/server/exchangeApiConnector";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: { exchangeId: string } };
type ExchangeAction = "connect" | "sync" | "disconnect";

type ExchangeRequestBody = {
  action?: ExchangeAction;
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string;
  sinceDays?: number;
  limit?: number;
};

type StoredCredentialBundle = {
  apiSecret: string;
  passphrase?: string;
};

function connectionCredentials(
  apiKeyEncrypted: string,
  apiSecretEncrypted: string,
): ExchangeApiCredentials {
  const apiKey = decryptSecret(apiKeyEncrypted);
  const decrypted = decryptSecret(apiSecretEncrypted);

  try {
    const bundle = JSON.parse(decrypted) as StoredCredentialBundle;
    if (bundle?.apiSecret) {
      return {
        apiKey,
        apiSecret: bundle.apiSecret,
        passphrase: bundle.passphrase,
      };
    }
  } catch {
    // Compatibilidad con conexiones anteriores que guardaban solo el secreto.
  }

  return { apiKey, apiSecret: decrypted };
}

function encryptedCredentialBundle(credentials: ExchangeApiCredentials): string {
  return encryptSecret(
    JSON.stringify({
      apiSecret: credentials.apiSecret,
      passphrase: credentials.passphrase || undefined,
    } satisfies StoredCredentialBundle),
  );
}

function normalizeSinceDays(value: unknown): number {
  const parsed = Number(value ?? 365);
  return Math.min(Math.max(Number.isFinite(parsed) ? Math.trunc(parsed) : 365, 1), 3650);
}

function normalizeLimit(value: unknown): number {
  const parsed = Number(value ?? 500);
  return Math.min(Math.max(Number.isFinite(parsed) ? Math.trunc(parsed) : 500, 1), 1000);
}

function eventTitle(event: NormalizedExchangeApiEvent): string {
  const quantity = event.quantity.toLocaleString("es-CL", { maximumFractionDigits: 8 });
  if (event.type === "BUY") return `Compra ${quantity} ${event.symbol}`;
  if (event.type === "SELL") return `Venta ${quantity} ${event.symbol}`;
  if (event.type === "TRANSFER_IN") return `Ingreso ${quantity} ${event.symbol}`;
  if (event.type === "TRANSFER_OUT") return `Salida ${quantity} ${event.symbol}`;
  if (event.type === "FEE") return `Comisión ${quantity} ${event.symbol}`;
  return `Movimiento ${quantity} ${event.symbol}`;
}

function eventSubtitle(exchangeName: string, event: NormalizedExchangeApiEvent): string {
  const parts = [exchangeName];
  if (event.quoteSymbol) parts.push(event.quoteSymbol);
  if (event.feeAmount) {
    parts.push(
      `Comisión ${event.feeAmount.toLocaleString("es-CL", { maximumFractionDigits: 8 })} ${event.feeSymbol || event.symbol}`,
    );
  }
  return parts.join(" · ");
}

function normalizedMetadata(exchangeId: string, event: NormalizedExchangeApiEvent) {
  const quote = event.quoteSymbol?.toUpperCase();
  const price = Number.isFinite(event.price) ? event.price ?? 0 : 0;
  const feeAmount = Number.isFinite(event.feeAmount) ? event.feeAmount ?? 0 : 0;

  return {
    txIdExterno: event.externalId,
    type: event.type,
    symbol: event.symbol,
    quantity: event.quantity,
    quoteSymbol: quote,
    priceQuote: price,
    priceUsd: isStableQuote(quote) ? price : 0,
    priceClp: quote === "CLP" ? price : 0,
    feeAmount,
    feeSymbol: event.feeSymbol,
    feeUsd: isStableQuote(event.feeSymbol) ? feeAmount : 0,
    executedAt: event.executedAt,
    source: exchangeId.toUpperCase(),
    provider: exchangeId,
  };
}

async function persistEvents(input: {
  userId: string;
  connectionId: string;
  exchangeId: string;
  exchangeName: string;
  events: NormalizedExchangeApiEvent[];
}) {
  let imported = 0;
  let skipped = 0;

  for (const event of input.events) {
    const metadata = normalizedMetadata(input.exchangeId, event);
    const record = await prisma.exchangeImportRecord.upsert({
      where: {
        userId_provider_externalId: {
          userId: input.userId,
          provider: input.exchangeId,
          externalId: event.externalId,
        },
      },
      update: {
        rawPayload: JSON.stringify(event.rawPayload),
        normalizedJson: JSON.stringify(metadata),
        normalizedEventType: event.type,
        occurredAt: event.executedAt,
      },
      create: {
        userId: input.userId,
        connectionId: input.connectionId,
        provider: input.exchangeId,
        externalId: event.externalId,
        externalType: event.externalType,
        rawPayload: JSON.stringify(event.rawPayload),
        normalizedJson: JSON.stringify(metadata),
        normalizedEventType: event.type,
        status: "PENDING",
        occurredAt: event.executedAt,
      },
    });

    const existingSource = await prisma.stagingEventSource.findFirst({
      where: { provider: input.exchangeId, recordId: record.id },
      select: { id: true },
    });

    if (existingSource) {
      skipped += 1;
      continue;
    }

    await prisma.stagingEvent.create({
      data: {
        userId: input.userId,
        source: "EXCHANGE",
        provider: input.exchangeId,
        status: "PENDING",
        normalizedType: event.type,
        title: eventTitle(event),
        subtitle: eventSubtitle(input.exchangeName, event),
        amountLabel: `${event.quantity.toLocaleString("es-CL", { maximumFractionDigits: 8 })} ${event.symbol}`,
        occurredAt: event.executedAt,
        metadata: JSON.stringify(metadata),
        sources: {
          create: {
            provider: input.exchangeId,
            recordId: record.id,
            rawType: event.externalType,
            metadata: JSON.stringify({ externalId: event.externalId, rawPayload: event.rawPayload }),
          },
        },
      },
    });

    imported += 1;
  }

  return { imported, skipped };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const config = getExchangeApiConfig(params.exchangeId);
  if (!config) return fail("Este exchange no dispone de conexión API para cuentas individuales.", 404);

  try {
    const connection = await prisma.exchangeConnection.findUnique({
      where: { userId_exchange: { userId: auth.user.id, exchange: config.id } },
    });

    if (!connection || connection.status === "DISCONNECTED") {
      return ok(
        {
          connected: false,
          exchangeId: config.id,
          exchangeName: config.name,
          requiresPassphrase: config.requiresPassphrase,
        },
        `Sin conexión ${config.name} configurada.`,
      );
    }

    return ok(
      {
        connected: ["CONNECTED", "ACTIVE"].includes(connection.status),
        exchangeId: config.id,
        exchangeName: config.name,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        apiKeyHint: decryptSecret(connection.apiKeyEncrypted).slice(-4),
        requiresPassphrase: config.requiresPassphrase,
      },
      `Conexión ${config.name} encontrada.`,
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const csrf = enforceCsrfProtection(request);
  if (csrf) return csrf;

  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  const config = getExchangeApiConfig(params.exchangeId);
  if (!config) return fail("Este exchange no dispone de conexión API para cuentas individuales.", 404);

  try {
    const body = (await request.json()) as ExchangeRequestBody;
    if (!body.action) return fail("La acción es obligatoria.", 400);

    if (body.action === "connect") {
      const credentials: ExchangeApiCredentials = {
        apiKey: String(body.apiKey ?? "").trim(),
        apiSecret: String(body.apiSecret ?? "").trim(),
        passphrase: String(body.passphrase ?? "").trim() || undefined,
      };

      if (!credentials.apiKey || !credentials.apiSecret) {
        return fail("API Key y API Secret son obligatorios.", 400);
      }
      if (config.requiresPassphrase && !credentials.passphrase) {
        return fail(`La ${config.passphraseLabel || "passphrase"} es obligatoria para ${config.name}.`, 400);
      }

      try {
        await testExchangeApiConnection(config.id, credentials);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Credenciales rechazadas.";
        return fail(`No fue posible validar ${config.name}: ${message}`, 422);
      }

      const connection = await prisma.exchangeConnection.upsert({
        where: { userId_exchange: { userId: auth.user.id, exchange: config.id } },
        update: {
          apiKeyEncrypted: encryptSecret(credentials.apiKey),
          apiSecretEncrypted: encryptedCredentialBundle(credentials),
          status: "CONNECTED",
          permissions: JSON.stringify({ readOnly: true, connector: config.mode }),
        },
        create: {
          userId: auth.user.id,
          exchange: config.id,
          apiKeyEncrypted: encryptSecret(credentials.apiKey),
          apiSecretEncrypted: encryptedCredentialBundle(credentials),
          status: "CONNECTED",
          permissions: JSON.stringify({ readOnly: true, connector: config.mode }),
        },
      });

      return ok(
        {
          connected: true,
          exchangeId: config.id,
          exchangeName: config.name,
          status: connection.status,
          apiKeyHint: credentials.apiKey.slice(-4),
          lastSyncAt: connection.lastSyncAt,
          requiresPassphrase: config.requiresPassphrase,
        },
        `${config.name} conectado correctamente con acceso de solo lectura.`,
        201,
      );
    }

    const connection = await prisma.exchangeConnection.findUnique({
      where: { userId_exchange: { userId: auth.user.id, exchange: config.id } },
    });

    if (!connection) return fail(`No existe una conexión con ${config.name}.`, 404);

    if (body.action === "disconnect") {
      await prisma.exchangeConnection.update({
        where: { id: connection.id },
        data: { status: "DISCONNECTED" },
      });
      return ok({ connected: false, exchangeId: config.id }, `${config.name} desconectado de LEDGERA.`);
    }

    if (!["CONNECTED", "ACTIVE"].includes(connection.status)) {
      return fail(`La conexión con ${config.name} no está activa.`, 400);
    }

    const credentials = connectionCredentials(
      connection.apiKeyEncrypted,
      connection.apiSecretEncrypted,
    );
    const sinceDays = normalizeSinceDays(body.sinceDays);
    const limit = normalizeLimit(body.limit);
    const since = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

    let syncResult;
    try {
      syncResult = await syncExchangeApi(config.id, credentials, { since, limit });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido.";
      return fail(`No fue posible sincronizar ${config.name}: ${message}`, 422);
    }

    const persistence = await persistEvents({
      userId: auth.user.id,
      connectionId: connection.id,
      exchangeId: config.id,
      exchangeName: config.name,
      events: syncResult.events,
    });

    const updated = await prisma.exchangeConnection.update({
      where: { id: connection.id },
      data: { status: "ACTIVE", lastSyncAt: new Date() },
    });

    return ok(
      {
        ...persistence,
        total: syncResult.events.length,
        warnings: syncResult.warnings,
        sinceDays,
        lastSyncAt: updated.lastSyncAt,
      },
      `Sincronización ${config.name} completada: ${persistence.imported} registros nuevos y ${persistence.skipped} duplicados.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
