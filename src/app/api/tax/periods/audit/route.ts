import { NextRequest } from "next/server";
import { listTaxPeriodAuditLogsByYear } from "@/modules/tax/infrastructure/taxPeriodAuditLogRepository";
import { fail, ok, serverError } from "@/shared/apiResponse";

type TaxPeriodAuditLogRow = {
  id: string;
  year: number;
  action: string;
  reason: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: string | null;
  createdAt: Date;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }

  return request.cookies.get("session_token")?.value ?? null;
}

function safeParseMetadata(metadata: string | null) {
  if (!metadata) return null;

  try {
    return JSON.parse(metadata);
  } catch {
    return metadata;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return fail("No autorizado.", 401);
    }

    const yearParam = request.nextUrl.searchParams.get("year");
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail("El año tributario informado no es válido.", 400);
    }

    const logs = (await listTaxPeriodAuditLogsByYear(
      year,
    )) as TaxPeriodAuditLogRow[];

    return ok({
      year,
      logs: logs.map((log: TaxPeriodAuditLogRow) => {
        return {
          id: log.id,
          year: log.year,
          action: log.action,
          reason: log.reason,
          actorId: log.actorId,
          actorEmail: log.actorEmail,
          metadata: safeParseMetadata(log.metadata),
          createdAt: log.createdAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/tax/periods/audit error", error);
    return serverError(error);
  }
}