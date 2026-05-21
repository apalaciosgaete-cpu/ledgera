import { prisma } from "@/lib/prisma";
import type { SyncCheckpoint } from "../domain/binanceTypes";

export async function findConnectionByUser(userId: string, provider: string) {
  return prisma.exchangeConnection.findUnique({
    where: { userId_provider: { userId, provider } },
  });
}

export async function upsertConnection(data: {
  userId:    string;
  provider:  string;
  apiKey:    string;
  apiSecret: string;
}) {
  return prisma.exchangeConnection.upsert({
    where:  { userId_provider: { userId: data.userId, provider: data.provider } },
    create: {
      userId:    data.userId,
      provider:  data.provider,
      apiKey:    data.apiKey,
      apiSecret: data.apiSecret,
      status:    "ACTIVE",
    },
    update: {
      apiKey:    data.apiKey,
      apiSecret: data.apiSecret,
      status:    "ACTIVE",
      lastSyncError:  null,
      lastSyncStatus: null,
    },
  });
}

export async function updateSyncSuccess(
  connectionId: string,
  checkpoint: SyncCheckpoint,
) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      lastSyncAt:     new Date(),
      lastSyncStatus: "OK",
      lastSyncError:  null,
      syncCheckpoint: JSON.stringify(checkpoint),
    },
  });
}

export async function updateSyncError(connectionId: string, message: string) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      lastSyncAt:     new Date(),
      lastSyncStatus: "ERROR",
      lastSyncError:  message,
      status:         "ERROR",
    },
  });
}

export async function deleteConnection(userId: string, provider: string) {
  return prisma.exchangeConnection.delete({
    where: { userId_provider: { userId, provider } },
  });
}
