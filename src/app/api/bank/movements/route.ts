import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared";
import { fail, ok, serverError } from "@/shared/apiResponse";
import { prisma } from "@/lib/prisma";

const VALID_DIRECTIONS = ["INFLOW", "OUTFLOW"] as const;
const VALID_STATUSES   = ["IMPORTED", "REVIEWED", "IGNORED"] as const;
const VALID_SORT       = ["occurredAt", "amountClp", "description"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado", 401);

  try {
    const { searchParams } = new URL(request.url);

    const directionParam = searchParams.get("direction") ?? "";
    const statusParam    = searchParams.get("status")    ?? "";
    const bankParam      = searchParams.get("bank")      ?? "";
    const searchParam    = searchParams.get("search")    ?? "";
    const sortParam      = searchParams.get("sort")      ?? "occurredAt";
    const orderParam     = searchParams.get("order") === "asc" ? "asc" as const : "desc" as const;
    const page           = Math.max(1, Number(searchParams.get("page")  || "1"));
    const limit          = Math.min(500, Math.max(1, Number(searchParams.get("limit") || "200")));
    const skip           = (page - 1) * limit;

    const direction = (VALID_DIRECTIONS as readonly string[]).includes(directionParam) ? directionParam : null;
    const status    = (VALID_STATUSES   as readonly string[]).includes(statusParam)    ? statusParam    : null;
    const bank      = bankParam.trim() || null;
    const search    = searchParam.trim() || null;
    const sort      = (VALID_SORT as readonly string[]).includes(sortParam) ? sortParam : "occurredAt";

    const baseWhere = { userId: auth.user.id };

    const filterWhere = {
      ...baseWhere,
      ...(direction ? { direction }              : {}),
      ...(status    ? { status }                 : {}),
      ...(bank      ? { bankName: bank }         : {}),
      ...(search    ? { description: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [movements, total, dirGroups, bankGroups] = await Promise.all([
      prisma.bankMovement.findMany({
        where:   filterWhere,
        orderBy: { [sort]: orderParam },
        skip,
        take:    limit,
      }),
      prisma.bankMovement.count({ where: filterWhere }),
      prisma.bankMovement.groupBy({
        by:    ["direction"],
        where: baseWhere,
        _count: { direction: true },
        _sum:   { amountClp: true },
      }),
      prisma.bankMovement.groupBy({
        by:    ["bankName"],
        where: baseWhere,
        _count: { bankName: true },
      }),
    ]);

    const dirMap = Object.fromEntries(dirGroups.map(g => [g.direction, { count: g._count.direction, sum: g._sum.amountClp ?? 0 }]));
    const banks  = bankGroups.map(g => g.bankName).filter(Boolean) as string[];

    return ok(
      {
        movements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
          inflows:  dirMap["INFLOW"]  ?? { count: 0, sum: 0 },
          outflows: dirMap["OUTFLOW"] ?? { count: 0, sum: 0 },
          banks,
        },
      },
      "Movimientos bancarios obtenidos.",
    );
  } catch (error) {
    return serverError(error);
  }
}
