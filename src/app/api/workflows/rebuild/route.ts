import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { buildWorkflowFromCase } from "@/modules/workflow-engine/application/buildWorkflowFromCase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) {
    return fail("No autorizado.", 401);
  }

  try {
    // Find active cases without workflows
    const activeCases = await prisma.taxCase.findMany({
      where: {
        userId: auth.user.id,
        status: { in: ["OPEN", "ACTION_REQUIRED", "INVESTIGATING"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const results: { caseId: string; title: string; created: boolean }[] = [];

    for (const taxCase of activeCases) {
      const workflow = await buildWorkflowFromCase(taxCase.id, auth.user.id);
      results.push({
        caseId: taxCase.id,
        title: taxCase.title,
        created: workflow !== null,
      });
    }

    return ok(
      { results, total: results.length, created: results.filter((r) => r.created).length },
      "Workflows reconstruidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}
