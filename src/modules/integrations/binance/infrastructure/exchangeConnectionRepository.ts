import { prisma } from "@/lib/prisma";

export async function findConnectionByUser(userId: string, exchange: string) {
  return prisma.exchangeConnection.findUnique({
    where: { userId_exchange: { userId, exchange } },
  });
}

export async function upsertConnection(data: {
  userId:    string;
  provider:  string;
  apiKey:    string;
  apiSecret: string;
}) {
  return prisma.exchangeConnection.upsert({
    where:  { userId_exchange: { userId: data.userId, exchange: data.provider } },
    create: {
      userId:             data.userId,
      exchange:           data.provider,
      apiKeyEncrypted:    data.apiKey,
      apiSecretEncrypted: data.apiSecret,
      status:             "CONNECTED",
      permissions:        "[]",
    },
    update: {
      apiKeyEncrypted:    data.apiKey,
      apiSecretEncrypted: data.apiSecret,
      status:             "CONNECTED",
    },
  });
}

// ── Sync state ─────────────────────────────────────────────────────────────

export async function setSyncRunning(connectionId: string) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  { status: "SYNCING" },
  });
}

export async function setSyncFinished(connectionId: string, _checkpoint: unknown) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  { status: "CONNECTED", lastSyncAt: new Date() },
  });
}

export async function setSyncReset(connectionId: string) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  { status: "CONNECTED" },
  });
}

export async function setSyncFailed(
  connectionId: string,
  _message:     string,
  _checkpoint?: unknown,
) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  { status: "ERROR", lastSyncAt: new Date() },
  });
}

export async function updateSyncSuccess(connectionId: string, checkpoint: unknown) {
  return setSyncFinished(connectionId, checkpoint);
}

export async function updateSyncError(connectionId: string, message: string) {
  return setSyncFailed(connectionId, message);
}

export async function deleteConnection(userId: string, exchange: string) {
  return prisma.exchangeConnection.delete({
    where: { userId_exchange: { userId, exchange } },
  });
}
