import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, serverError } from "@/shared/apiResponse";

type SnapshotRow = {
  id: string;
  year: number;
  contentHash: string;
  createdAt: Date | string;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "").trim();
  }

  return request.cookies.get("session_token")?.value ?? null;
}

function formatDate(value: Date | string) {
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return fail("No autorizado.", 401);
    }

    const hash = request.nextUrl.searchParams.get("hash")?.trim();

    if (!hash || hash.length < 32) {
      return fail("Hash inválido.", 400);
    }

    const snapshots = await prisma.$queryRaw<SnapshotRow[]>`
      SELECT
        id,
        year,
        contentHash,
        createdAt
      FROM tax_period_snapshots
      WHERE contentHash = ${hash}
      LIMIT 1
    `;

    const snapshot = snapshots[0] ?? null;

    if (!snapshot) {
      return fail("Snapshot no encontrado.", 404);
    }

    return ok(
      {
        valid: true,
        snapshot: {
          id: snapshot.id,
          year: snapshot.year,
          contentHash: snapshot.contentHash,
          createdAt: formatDate(snapshot.createdAt),
        },
      },
      "Snapshot verificado correctamente.",
    );
  } catch (error) {
    return serverError(error);
  }
}