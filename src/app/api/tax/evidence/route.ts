import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function statusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", color: "#475569", bg: "#F1F5F9" };
    case "REVIEWED": return { text: "Revisada", color: "#075985", bg: "#E0F2FE" };
    case "CONFIRMED": return { text: "Confirmada", color: "#166534", bg: "#F0FDF4" };
    case "VOIDED": return { text: "Anulada", color: "#991B1B", bg: "#FEF2F2" };
    default: return { text: status, color: "#475569", bg: "#F1F5F9" };
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "DJ_CRYPTO_SUMMARY": return "Resumen cripto";
    case "DJ_REALIZED_GAINS": return "Ganancias realizadas";
    case "DJ_FOREIGN_EXCHANGE_ACTIVITY": return "Actividad cambiaria";
    case "DJ_TAX_SUPPORTING_LEDGER": return "Libro de apoyo";
    default: return type;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const scope = buildUserScopeWhere(auth.user);

    const declarations = await prisma.taxDeclaration.findMany({
      where: { ...scope },
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        taxYear: true,
        declarationType: true,
        status: true,
        contentHash: true,
        generatedAt: true,
        confirmedAt: true,
        voidedAt: true,
      },
    });

    const evidence = declarations.map((d) => {
      const st = statusLabel(d.status);
      return {
        id: d.id,
        taxYear: d.taxYear,
        type: typeLabel(d.declarationType),
        status: d.status,
        statusText: st.text,
        statusColor: st.color,
        statusBg: st.bg,
        hash: d.contentHash,
        hashShort: d.contentHash.slice(0, 12) + "..." + d.contentHash.slice(-12),
        verifyUrl: `/verify/report/${encodeURIComponent(d.contentHash)}`,
        generatedAt: d.generatedAt.toISOString(),
        confirmedAt: d.confirmedAt?.toISOString() ?? null,
        voidedAt: d.voidedAt?.toISOString() ?? null,
      };
    });

    const publicVerifyUrl = `${request.nextUrl.origin}/verify/report/`;

    return NextResponse.json({
      ok: true,
      data: {
        evidence,
        publicVerifyUrl,
        total: evidence.length,
        confirmedCount: evidence.filter((e) => e.status === "CONFIRMED").length,
        voidedCount: evidence.filter((e) => e.status === "VOIDED").length,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al cargar evidencia", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
