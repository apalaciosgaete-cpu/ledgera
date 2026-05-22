import { prisma } from "@/lib/prisma";

export type SyncPeriodRow = {
  id:            string;
  year:          number;
  month:         number;
  status:        string;
  importedCount: number;
  errorCount:    number;
  finishedAt:    Date | null;
};

export type SyncCalendar = {
  periods:        SyncPeriodRow[];
  totalPending:   number;
  totalCompleted: number;
  totalFailed:    number;
  nextPeriod:     { year: number; month: number } | null;
};

export async function ensurePeriodsExist(
  userId:       string,
  connectionId: string,
  provider:     string,
  startDate:    Date,
  endDate:      Date,
): Promise<void> {
  const data: { userId: string; connectionId: string; provider: string; year: number; month: number }[] = [];

  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cur <= end) {
    data.push({ userId, connectionId, provider, year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }

  if (data.length === 0) return;

  await prisma.exchangeSyncPeriod.createMany({ data, skipDuplicates: true });
}

export async function getNextPendingPeriods(
  userId:   string,
  provider: string,
  limit:    number,
) {
  return prisma.exchangeSyncPeriod.findMany({
    where:   { userId, provider, status: { in: ["PENDING", "FAILED"] } },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    take:    limit,
  });
}

export async function setPeriodRunning(id: string) {
  return prisma.exchangeSyncPeriod.update({
    where: { id },
    data:  { status: "RUNNING", startedAt: new Date() },
  });
}

export async function setPeriodCompleted(id: string, importedCount: number) {
  return prisma.exchangeSyncPeriod.update({
    where: { id },
    data:  { status: "COMPLETED", importedCount, finishedAt: new Date(), lastError: null },
  });
}

export async function setPeriodEmpty(id: string) {
  return prisma.exchangeSyncPeriod.update({
    where: { id },
    data:  { status: "EMPTY", importedCount: 0, finishedAt: new Date(), lastError: null },
  });
}

export async function setPeriodFailed(id: string, error: string, importedCount = 0) {
  return prisma.exchangeSyncPeriod.update({
    where: { id },
    data:  {
      status:        "FAILED",
      importedCount,
      finishedAt:    new Date(),
      lastError:     error.slice(0, 500),
      errorCount:    { increment: 1 },
    },
  });
}

export async function resetAllPeriods(userId: string, provider: string): Promise<number> {
  const { count } = await prisma.exchangeSyncPeriod.updateMany({
    where: { userId, provider },
    data:  { status: "PENDING", importedCount: 0, errorCount: 0, finishedAt: null, lastError: null },
  });
  return count;
}

export async function getSyncCalendar(userId: string, provider: string): Promise<SyncCalendar> {
  const periods = await prisma.exchangeSyncPeriod.findMany({
    where:   { userId, provider },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    select:  { id: true, year: true, month: true, status: true, importedCount: true, errorCount: true, finishedAt: true },
  });

  const totalPending   = periods.filter(p => p.status === "PENDING").length;
  const totalCompleted = periods.filter(p => p.status === "COMPLETED" || p.status === "EMPTY").length;
  const totalFailed    = periods.filter(p => p.status === "FAILED").length;
  const nextPeriod     = periods.find(p => p.status === "PENDING" || p.status === "FAILED");

  return {
    periods: periods as SyncPeriodRow[],
    totalPending,
    totalCompleted,
    totalFailed,
    nextPeriod: nextPeriod ? { year: nextPeriod.year, month: nextPeriod.month } : null,
  };
}
