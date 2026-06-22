import { prisma } from "@/lib/prisma";
import type { ColMapping } from "../domain/bankTypes";

export async function upsertBankCsvTemplate(userId: string, bankName: string, mapping: ColMapping) {
  return prisma.bankCsvTemplate.upsert({
    where:  { userId_bankName: { userId, bankName } },
    update: { ...mapping },
    create: { userId, bankName, ...mapping },
  });
}

export async function findBankCsvTemplate(userId: string, bankName: string) {
  return prisma.bankCsvTemplate.findUnique({
    where: { userId_bankName: { userId, bankName } },
  });
}

export async function listBankCsvTemplates(userId: string) {
  return prisma.bankCsvTemplate.findMany({ where: { userId } });
}

export async function listBankFileUploads(userId: string) {
  return prisma.bankFileUpload.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    50,
  });
}
