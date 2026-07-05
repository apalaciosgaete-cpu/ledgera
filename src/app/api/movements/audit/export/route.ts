import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MovementDto } from "@/shared";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function escapeCsvValue(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined) return "";

  const normalizedValue =
    value instanceof Date ? value.toISOString() : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const movements = (await prisma.portfolioMovement.findMany({
      orderBy: {
        executedAt: "desc",
      },
    })) as MovementDto[];

    const header = [
      "id",
      "tipo",
      "simbolo",
      "cantidad",
      "precio_usd",
      "fee_usd",
      "fecha_operacion",
      "estado",
      "fecha_anulacion",
      "motivo_anulacion",
    ];

    const rows = movements.map((movement: MovementDto) => [
      movement.id,
      movement.type === "BUY" ? "COMPRA" : "VENTA",
      movement.symbol,
      movement.quantity,
      movement.priceUsd,
      movement.feeUsd,
      movement.executedAt,
      movement.deletedAt ? "ANULADO" : "ACTIVO",
      movement.deletedAt,
      movement.deletedReason,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(";"))
      .join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="movimientos_auditoria.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al generar CSV de auditoría de movimientos.",
      },
      { status: 500 },
    );
  }
}