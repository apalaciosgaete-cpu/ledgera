import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { getTaxMemory } from "@/modules/tax-memory/application/getTaxMemory";
import { generateTaxMemory } from "@/modules/tax-memory/application/generateTaxMemory";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await getTaxMemory(auth.user.id);
    if (!result.ok) return fail(result.message, 500);

    return ok(
      result.patterns.map((pattern) => ({
        ...pattern,
        lastSeenAt: pattern.lastSeenAt.toISOString(),
        createdAt: pattern.createdAt.toISOString(),
        updatedAt: pattern.updatedAt.toISOString(),
      })),
      "Memoria tributaria obtenida.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    const result = await generateTaxMemory(auth.user.id);
    if (!result.ok) return fail(result.message, 500);
    return ok(result, "Memoria tributaria actualizada.");
  } catch (error) {
    return serverError(error);
  }
}
