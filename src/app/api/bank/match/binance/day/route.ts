import { NextRequest, NextResponse } from "next/server";
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

    const rawSuggestions = await suggestBankBinanceMatches(auth.user.id, {
      minConfidence: 0.1,
      from: range.from,
      to: range.to,
    });

    const suggestions = topSuggestionPerBankMovement(rawSuggestions);

    return ok(
      {
        date,
        suggestions,
        total: suggestions.length,
      },
      `${suggestions.length} candidatos encontrados para ${date}.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
