import { prisma } from "@/lib/prisma";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";
import type { BinanceConnection } from "@/modules/integrations/binance/domain/BinanceConnection";

type PrismaConnection = {
  id:                 string;
  userId:             string;
  exchange:           string;
  apiKeyEncrypted:    string;
  apiSecretEncrypted: string;
  status:             string;
  permissions:        string;
  lastSyncAt:         Date | null;
  createdAt:          Date;
  updatedAt:          Date;
};

function mapExchangeConnectionToBinanceConnection(
  c: PrismaConnection,
): BinanceConnection {
  return {
    id:                 c.id,
    userId:             c.userId,
    exchange:           "BINANCE",
    apiKeyEncrypted:    c.apiKeyEncrypted,
    apiSecretEncrypted: c.apiSecretEncrypted,
    status:             c.status as BinanceConnection["status"],
    permissions:        JSON.parse(c.permissions) as string[],
    lastSyncAt:         c.lastSyncAt,
    createdAt:          c.createdAt,
    updatedAt:          c.updatedAt,
  };
}

type UpsertBinanceConnectionInput = {
  userId:             string;
  apiKeyEncrypted:    string;
  apiSecretEncrypted: string;
  status:             BinanceConnection["status"];
  permissions:        string[];
};

export async function upsertBinanceConnection(
  input: UpsertBinanceConnectionInput,
): Promise<BinanceConnection> {
  const connection = await prisma.exchangeConnection.upsert({
    where: {
      userId_exchange: {
        userId:   input.userId,
        exchange: "BINANCE",
      },
    },
    create: {
      userId:             input.userId,
      exchange:           "BINANCE",
      apiKeyEncrypted:    input.apiKeyEncrypted,
      apiSecretEncrypted: input.apiSecretEncrypted,
      status:             input.status,
      permissions:        JSON.stringify(input.permissions),
    },
    update: {
      apiKeyEncrypted:    input.apiKeyEncrypted,
      apiSecretEncrypted: input.apiSecretEncrypted,
      status:             input.status,
      permissions:        JSON.stringify(input.permissions),
    },
  });

  return mapExchangeConnectionToBinanceConnection(connection);
}

export async function findBinanceConnection(
  userId: string,
): Promise<BinanceConnection | null> {
  const connection = await prisma.exchangeConnection.findUnique({
    where: {
      userId_exchange: {
        userId,
        exchange: "BINANCE",
      },
    },
  });

  if (!connection) return null;

  return mapExchangeConnectionToBinanceConnection(connection);
}

export async function disconnectBinanceConnection(
  userId: string,
): Promise<BinanceConnection | null> {
  const existing = await prisma.exchangeConnection.findUnique({
    where: {
      userId_exchange: {
        userId,
        exchange: "BINANCE",
      },
    },
  });

  if (!existing) return null;

  const connection = await prisma.exchangeConnection.update({
    where: {
      userId_exchange: {
        userId,
        exchange: "BINANCE",
      },
    },
    data: {
      status:             "DISCONNECTED",
      apiKeyEncrypted:    "",
      apiSecretEncrypted: "",
      permissions:        JSON.stringify([]),
    },
  });

  await recordTimelineEvent({
    userId,
    category: "CONNECTION",
    severity: "WARNING",
    title: "Exchange desconectado",
    description: "Desconectaste tu cuenta Binance.",
    entityType: "ExchangeConnection",
    entityId: existing.id,
    metadata: { exchange: "BINANCE" },
  });

  return mapExchangeConnectionToBinanceConnection(connection);
}
