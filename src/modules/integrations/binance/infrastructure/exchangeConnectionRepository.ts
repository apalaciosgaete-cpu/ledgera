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
      apiKey:        data.apiKey,
      apiSecret:     data.apiSecret,
      status:        "ACTIVE",
      syncStatus:    "IDLE",
      lastSyncError: null,
      lastSyncStatus: null,
    },
  });
}

// ── Sync lock ──────────────────────────────────────────────────────────────

export async function setSyncRunning(connectionId: string) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      syncStatus:    "RUNNING",
      syncStartedAt: new Date(),
      syncFinishedAt: null,
    },
  });
}

export async function setSyncFinished(
  connectionId: string,
  checkpoint: SyncCheckpoint,
) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      syncStatus:     "IDLE",
      syncFinishedAt: new Date(),
      lastSyncAt:     new Date(),
      lastSyncStatus: "OK",
      lastSyncError:  null,
      syncCheckpoint: JSON.stringify(checkpoint),
    },
  });
}

export async function setSyncReset(connectionId: string) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      syncStatus:     "IDLE",
      syncStartedAt:  null,
      lastSyncError:  null,
    },
  });
}

export async function setSyncFailed(
  connectionId: string,
  message: string,
  checkpoint?: SyncCheckpoint,
) {
  return prisma.exchangeConnection.update({
    where: { id: connectionId },
    data:  {
      syncStatus:     "FAILED",
      syncFinishedAt: new Date(),
      lastSyncAt:     new Date(),
      lastSyncStatus: "ERROR",
      lastSyncError:  message.slice(0, 500),
      ...(checkpoint ? { syncCheckpoint: JSON.stringify(checkpoint) } : {}),
    },
  });
}

// ── Legacy — kept for compatibility, delegates to new functions ────────────

export async function updateSyncSuccess(
  connectionId: string,
  checkpoint: SyncCheckpoint,
) {
  return setSyncFinished(connectionId, checkpoint);
}

export async function updateSyncError(connectionId: string, message: string) {
  return setSyncFailed(connectionId, message);
}

export async function deleteConnection(userId: string, provider: string) {
  return prisma.exchangeConnection.delete({
    where: { userId_provider: { userId, provider } },
  });
}
