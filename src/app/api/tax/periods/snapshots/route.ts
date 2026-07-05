import { NextRequest } from "next/server";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { listTaxPeriodSnapshotsByYear } from "@/modules/tax/infrastructure/taxPeriodSnapshotRepository";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }

  return request.cookies.get("session_token")?.value ?? null;
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
      return fail("Año inválido.", 400);
    }

    const snapshots = await listTaxPeriodSnapshotsByYear(year);

    return ok(
      {
        year,
        snapshots: snapshots.map(
  (snap: {
    id: string;
    contentHash: string;
    createdAt: Date;
  }) => ({
    id: snap.id,
    contentHash: snap.contentHash,
    createdAt: snap.createdAt.toISOString(),
  }),
),
      },
      "Snapshots obtenidos correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}