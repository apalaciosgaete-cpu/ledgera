import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { suggestBankBinanceMatches } from "@/modules/banking/application/suggestBankBinanceMatches";
import type { BankMatchSuggestion } from "@/modules/banking/domain/bankMatchingTypes";

function topSuggestionPerBankMovement(
  suggestions: BankMatchSuggestion[],
): BankMatchSuggestion[] {
  const bestByBank = new Map<string, BankMatchSuggestion>();

  for (const suggestion of suggestions) {
    const current = bestByBank.get(suggestion.bankMovementId);

    if (!current || suggestion.confidence > current.confidence) {
      bestByBank.set(suggestion.bankMovementId, suggestion);
    }
  }

  return Array.from(bestByBank.values()).sort(
    (a, b) => b.confidence - a.confidence,
  );
}

function parseDay(dateRaw: string | null) {
  if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    return null;
  }

  const from = new Date(`${dateRaw}T00:00:00.000Z`);
  const to = new Date(`${dateRaw}T00:00:00.000Z`);
  to.setUTCDate(to.getUTCDate() + 1);

  return { from, to };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const range = parseDay(date);

    if (!date || !range) {
      return fail("date debe venir en formato YYYY-MM-DD.", 400);
    }

    const [imports, portfolioMovements, bankMovements, matches] = await Promise.all([
      prisma.exchangeImportRecord.findMany({
        where: {
          userId: auth.user.id,
          occurredAt: { gte: range.from, lt: range.to },
          provider: { in: ["BINANCE", "BINANCE_TAX"] },
        },
        orderBy: { occurredAt: "asc" },
        select: {
          id: true,
          provider: true,
          externalId: true,
          externalType: true,
          normalizedEventType: true,
          taxTreatment: true,
          inventoryEffect: true,
          economicEffect: true,
          status: true,
          movementId: true,
          occurredAt: true,
        },
      }),

      prisma.portfolioMovement.findMany({
        where: {
          userId: auth.user.id,
          executedAt: { gte: range.from, lt: range.to },
          source: { in: ["BINANCE", "BINANCE_TAX"] },
          deletedAt: null,
        },
        orderBy: { executedAt: "asc" },
        select: {
          id: true,
          source: true,
          type: true,
          symbol: true,
          quantity: true,
          priceUsd: true,
          feeUsd: true,
          externalId: true,
          executedAt: true,
        },
      }),

      prisma.bankMovement.findMany({
        where: {
          userId: auth.user.id,
          occurredAt: { gte: range.from, lt: range.to },
        },
        orderBy: { occurredAt: "asc" },
        select: {
          id: true,
          bankName: true,
          occurredAt: true,
          description: true,
          amountClp: true,
          direction: true,
          status: true,
          bankCategory: true,
          categoryReason: true,
          matchedPortfolioMovementId: true,
          matchedConfidence: true,
          matchedAt: true,
          matchedReason: true,
        },
      }),

      prisma.bankReconciliationAuditLog.findMany({
        where: {
          userId: auth.user.id,
          createdAt: { gte: range.from, lt: range.to },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          bankMovementId: true,
          portfolioMovementId: true,
          confidence: true,
          reason: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const rawSuggestions = await suggestBankBinanceMatches(auth.user.id, {
      minConfidence: 0.1,
      from: range.from,
      to: range.to,
    });

    const suggestions = topSuggestionPerBankMovement(rawSuggestions);

    return ok(
      {
        date,
        imports,
        portfolioMovements,
        bankMovements,
        matches,
        suggestions,
      },
      "Detalle diario de sincronización obtenido correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}
