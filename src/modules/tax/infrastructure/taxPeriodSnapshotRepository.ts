import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type CreateTaxPeriodSnapshotInput = {
  year: number;
  snapshotPayload: unknown;
};

function buildHash(payload: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function createTaxPeriodSnapshot(
  input: CreateTaxPeriodSnapshotInput,
) {
  const contentHash = buildHash(input.snapshotPayload);

  return prisma.taxPeriodSnapshot.create({
    data: {
      year: input.year,
      contentHash,
      snapshotPayload: JSON.stringify(input.snapshotPayload),
    },
  });
}

export async function listTaxPeriodSnapshotsByYear(year: number) {
  return prisma.taxPeriodSnapshot.findMany({
    where: { year },
    orderBy: { createdAt: "desc" },
  });
}