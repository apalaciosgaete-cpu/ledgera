import { prisma } from "@/lib/prisma";
import type { ParsedBankRow, ColMapping } from "../domain/bankMovement";

export async function insertBankMovements(
  userId:   string,
  bankName: string,
  rows:     ParsedBankRow[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped  = 0;

  for (const row of rows) {
    const externalId = `${bankName}:${row.occurredAt.toISOString().slice(0, 10)}:${row.description.slice(0, 40)}:${row.amountClp}`;

    const existing = await prisma.bankMovement.findFirst({
      where: { userId, externalId },
    });

    if (existing) { skipped++; continue; }

    await prisma.bankMovement.create({
      data: {
        userId,
        bankName,
        externalId,
        occurredAt:  row.occurredAt,
        description: row.description,
        amountClp:   row.amountClp,
        direction:   row.direction,
        balanceClp:  row.balanceClp ?? null,
        rawJson:     row.rawJson,
        status:      "IMPORTED",
      },
    });

    inserted++;
  }

  return { inserted, skipped };
}

export async function upsertBankCsvTemplate(
  userId:   string,
  bankName: string,
  mapping:  ColMapping,
) {
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
