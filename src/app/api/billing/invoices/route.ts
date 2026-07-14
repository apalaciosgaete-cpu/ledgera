import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getBillingInvoices } from "@/modules/billing/application/getBillingInvoices";

// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = "force-dynamic";

function isMissingInvoicesTable(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; message?: unknown };
  };

  return (
    candidate.code === "P2010" &&
    candidate.meta?.code === "42P01" &&
    typeof candidate.meta?.message === "string" &&
    candidate.meta.message.includes("billing_invoices")
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado.",
          data: null,
        },
        { status: 401 },
      );
    }

    const invoices = await getBillingInvoices(auth.user.id);

    return NextResponse.json({
      ok: true,
      message: "Documentos de cobro obtenidos.",
      data: {
        available: true,
        invoices,
      },
    });
  } catch (error) {
    if (isMissingInvoicesTable(error)) {
      console.warn(
        "[billing/invoices GET] La infraestructura de documentos de cobro aún no está habilitada en producción.",
      );

      return NextResponse.json({
        ok: true,
        message: "La emisión de documentos de cobro aún no está habilitada.",
        data: {
          available: false,
          invoices: [],
        },
      });
    }

    console.error("[billing/invoices GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener los documentos de cobro.",
        data: null,
      },
      { status: 500 },
    );
  }
}
