import { prisma } from "@/lib/prisma";
import type { BinanceConnection } from "@/modules/integrations/binance/domain/BinanceConnection";

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

  return {
    id:                 connection.id,
    userId:             connection.userId,
    exchange:           "BINANCE",
    apiKeyEncrypted:    connection.apiKeyEncrypted,
    apiSecretEncrypted: connection.apiSecretEncrypted,
    status:             connection.status as BinanceConnection["status"],
    permissions:        JSON.parse(connection.permissions) as string[],
    lastSyncAt:         connection.lastSyncAt,
    createdAt:          connection.createdAt,
    updatedAt:          connection.updatedAt,
  };
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

  return {
    id:                 connection.id,
    userId:             connection.userId,
    exchange:           "BINANCE",
    apiKeyEncrypted:    connection.apiKeyEncrypted,
    apiSecretEncrypted: connection.apiSecretEncrypted,
    status:             connection.status as BinanceConnection["status"],
    permissions:        JSON.parse(connection.permissions) as string[],
    lastSyncAt:         connection.lastSyncAt,
    createdAt:          connection.createdAt,
    updatedAt:          connection.updatedAt,
  };
}
