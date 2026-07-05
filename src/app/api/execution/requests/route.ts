import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { isValidExecutionType } from "@/modules/execution-engine/domain/execution";
import { createExecutionRequest, listUserExecutionRequests } from "@/modules/execution-engine/infrastructure/executionRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const executions = await listUserExecutionRequests(auth.user.id);
    return ok(
      executions.map((execution) => ({
        ...execution,
        createdAt: execution.createdAt.toISOString(),
        startedAt: execution.startedAt?.toISOString() ?? null,
        completedAt: execution.completedAt?.toISOString() ?? null,
      })),
      "Ejecuciones obtenidas.",
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const body = (await request.json()) as {
      type?: string;
      title?: string;
      description?: string;
      sourceType?: string | null;
      sourceId?: string | null;
      payload?: Record<string, unknown> | null;
    };

    if (!body.type || !isValidExecutionType(body.type)) return fail("Tipo de ejecución inválido.", 400);

    const execution = await createExecutionRequest({
      userId: auth.user.id,
      type: body.type,
      title: body.title ?? "Ejecución supervisada",
      description: body.description ?? "Solicitud creada desde LEDGERA AI.",
      sourceType: body.sourceType ?? null,
      sourceId: body.sourceId ?? null,
      payload: body.payload ?? null,
    });

    return ok(
      {
        ...execution,
        createdAt: execution.createdAt.toISOString(),
        startedAt: execution.startedAt?.toISOString() ?? null,
        completedAt: execution.completedAt?.toISOString() ?? null,
      },
      "Solicitud de ejecución creada.",
    );
  } catch (error) {
    return serverError(error);
  }
}
