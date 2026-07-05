import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { getBillingInvoices } from "@/modules/billing/application/getBillingInvoices";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
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
      message: "Facturas obtenidas.",
      data: {
        invoices,
      },
    });
  } catch (error) {
    console.error("[billing/invoices GET]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No fue posible obtener las facturas.",
        data: null,
      },
      { status: 500 },
    );
  }
}
