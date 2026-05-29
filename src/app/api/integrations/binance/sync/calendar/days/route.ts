import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

type DaySummary = {
  date: string;
  day: number;
  taxImports: number;
  spotImports: number;
  portfolioMovements: number;
  bankMovements: number;
  matched: number;
  ignored: number;
  hasActivity: boolean;
};

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  return { from, to };
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function initDays(year: number, month: number): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();
  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const key = dateKey(date);

    days.set(key, {
      date: key,
      day,
      taxImports: 0,
      spotImports: 0,
      portfolioMovements: 0,
      bankMovements: 0,
      matched: 0,
      ignored: 0,
      hasActivity: false,
    });
  }

  return days;
}

function touch(day: DaySummary) {
  day.hasActivity =
    day.taxImports > 0 ||
    day.spotImports > 0 ||
    day.portfolioMovements > 0 ||
    day.bankMovements > 0 ||
    day.matched > 0 ||
    day.ignored > 0;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);

    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return fail("year y month válidos son obligatorios.", 400);
    }

    const { from, to } = monthRange(year, month);
    const days = initDays(year, month);

    const [imports, portfolioMovements, bankMovements] = await Promise.all([
      prisma.exchangeImportRecord.findMany({
        where: {
          userId: auth.user.id,
          occurredAt: { gte: from, lt: to },
          provider: { in: ["BINANCE", "BINANCE_TAX"] },
        },
        select: {
          occurredAt: true,
          provider: true,
        },
      }),

      prisma.portfolioMovement.findMany({
        where: {
          userId: auth.user.id,
          executedAt: { gte: from, lt: to },
          source: { in: ["BINANCE", "BINANCE_TAX"] },
          deletedAt: null,
        },
        select: {
          executedAt: true,
        },
      }),

      prisma.bankMovement.findMany({
        where: {
          userId: auth.user.id,
          occurredAt: { gte: from, lt: to },
        },
        select: {
          occurredAt: true,
          status: true,
        },
      }),
    ]);

    for (const item of imports) {
      const day = days.get(dateKey(item.occurredAt));
      if (!day) continue;

      if (item.provider === "BINANCE_TAX") {
        day.taxImports++;
      } else {
        day.spotImports++;
      }

      touch(day);
    }

    for (const item of portfolioMovements) {
      const day = days.get(dateKey(item.executedAt));
      if (!day) continue;

      day.portfolioMovements++;
      touch(day);
    }

    for (const item of bankMovements) {
      const day = days.get(dateKey(item.occurredAt));
      if (!day) continue;

      day.bankMovements++;

      if (item.status === "MATCHED") {
        day.matched++;
      }

      if (item.status === "IGNORED") {
        day.ignored++;
      }

      touch(day);
    }

    return ok(
      {
        year,
        month,
        days: Array.from(days.values()),
      },
      "Calendario diario de sincronización obtenido correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
