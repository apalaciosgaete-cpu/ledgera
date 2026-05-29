import { prisma } from "@/lib/prisma";
import type { WalletNetwork, WalletStatus } from "../domain/WalletTypes";

export async function findWalletsByUser(userId: string) {
  return prisma.walletConnection.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findWalletById(id: string, userId: string) {
  return prisma.walletConnection.findFirst({ where: { id, userId } });
}

export async function upsertWalletConnection(input: {
  userId:   string;
  network:  WalletNetwork;
  address:  string;
  label?:   string;
  status?:  WalletStatus;
}) {
  return prisma.walletConnection.upsert({
    where: {
      userId_network_address: {
        userId:  input.userId,
        network: input.network,
        address: input.address,
      },
    },
    create: {
      userId:  input.userId,
      network: input.network,
      address: input.address,
      label:   input.label ?? null,
      status:  input.status ?? "ACTIVE",
    },
    update: {
      label:     input.label ?? undefined,
      status:    input.status ?? undefined,
      updatedAt: new Date(),
    },
  });
}

export async function updateWalletSyncedAt(id: string) {
  return prisma.walletConnection.update({
    where: { id },
    data:  { lastSyncAt: new Date(), updatedAt: new Date() },
  });
}

export async function findTransactionsByWallet(walletId: string, limit = 50) {
  return prisma.onchainTransaction.findMany({
    where:   { walletId },
    orderBy: { blockTimestamp: "desc" },
    take:    limit,
    include: { decodedEvents: true },
  });
}

export async function upsertOnchainTransaction(input: {
  userId:          string;
  walletId:        string;
  txHash:          string;
  network:         string;
  blockNumber?:    number;
  blockTimestamp?: Date;
  from?:           string;
  to?:             string;
  value?:          string;
  gasUsed?:        string;
  status?:         string;
  rawPayload?:     string;
}) {
  return prisma.onchainTransaction.upsert({
    where: { network_txHash: { network: input.network, txHash: input.txHash } },
    create: {
      userId:         input.userId,
      walletId:       input.walletId,
      txHash:         input.txHash,
      network:        input.network,
      blockNumber:    input.blockNumber ?? null,
      blockTimestamp: input.blockTimestamp ?? null,
      from:           input.from ?? null,
      to:             input.to ?? null,
      value:          input.value ?? null,
      gasUsed:        input.gasUsed ?? null,
      status:         input.status ?? "CONFIRMED",
      rawPayload:     input.rawPayload ?? null,
    },
    update: {
      status:         input.status ?? undefined,
      blockNumber:    input.blockNumber ?? undefined,
      blockTimestamp: input.blockTimestamp ?? undefined,
    },
  });
}
