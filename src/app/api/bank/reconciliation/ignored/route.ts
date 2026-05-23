import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const ignored = await prisma.bankMovement.findMany({
      where: {
        userId: auth.user.id,
        status: "IGNORED",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 500,
    });

    return ok(
      {
        ignored,
        total: ignored.length,
      },
      `${ignored.length} conciliaciones ignoradas encontradas.`,
    );
  } catch (error) {
    return serverError(error);
  }
}
