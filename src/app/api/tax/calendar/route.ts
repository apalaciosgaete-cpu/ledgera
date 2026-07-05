import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared";
import { fail } from "@/shared/apiResponse";
import { buildUserScopeWhere } from "@/modules/identity/domain/accessPolicy";


// Force dynamic rendering because routes use request.headers/cookies
export const dynamic = 'force-dynamic';
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfYear(year: number): Date {
  return new Date(`${year}-01-01T00:00:00.000Z`);
}

function endOfYear(year: number): Date {
  return new Date(`${year}-12-31T23:59:59.999Z`);
}

function getChileTaxDates(referenceYear: number) {
  const currentYear = new Date().getFullYear();
  const declarationYear = referenceYear + 1;

  return {
    cierreEjercicio: endOfYear(referenceYear),
    operacionRentaStart: new Date(`${declarationYear}-04-01T00:00:00.000Z`),
    operacionRentaEnd: new Date(`${declarationYear}-04-30T23:59:59.999Z`),
    pagoContado: new Date(`${declarationYear}-05-15T23:59:59.999Z`),
    cuota1: new Date(`${declarationYear}-06-15T23:59:59.999Z`),
    cuota2: new Date(`${declarationYear}-07-15T23:59:59.999Z`),
    cuota3: new Date(`${declarationYear}-08-15T23:59:59.999Z`),
  };
}

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth || auth instanceof NextResponse) return fail("No autorizado.", 401);

  try {
    const scope = buildUserScopeWhere(auth.user);

    const rawMovements = await prisma.portfolioMovement.findMany({
      where: { deletedAt: null, ...scope },
      select: { type: true, priceUsd: true, quantity: true, executedAt: true },
    });

    const taxEvents = await prisma.taxEvent.findMany({
      where: { ...scope },
      select: { realizedPnlUsd: true },
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    let referenceYear = currentYear;
    const hasMovements = rawMovements.length > 0;
    const hasSell = rawMovements.some((m) => String(m.type).trim().toUpperCase() === "SELL");
    const hasStaking = rawMovements.some((m) => String(m.type).trim().toUpperCase() === "STAKING_REWARD");
    const totalPnl = taxEvents.reduce((sum, e) => sum + Number(e.realizedPnlUsd || 0), 0);
    const basePositive = totalPnl > 0;

    const dates = getChileTaxDates(referenceYear);

    const milestones = [
      { label: "Hoy", date: now, type: "today" as const },
      { label: "Cierre del ejercicio", date: dates.cierreEjercicio, type: "milestone" as const },
      { label: "Operación Renta", date: dates.operacionRentaStart, type: "milestone" as const },
      { label: "Pago contado", date: dates.pagoContado, type: "payment" as const },
      { label: "Cuota 1", date: dates.cuota1, type: "payment" as const },
      { label: "Cuota 2", date: dates.cuota2, type: "payment" as const },
      { label: "Cuota 3", date: dates.cuota3, type: "payment" as const },
    ].map((m) => ({
      ...m,
      daysUntil: daysUntil(m.date),
      passed: m.date < now,
    }));

    const alerts: { type: "urgent" | "warning" | "info"; label: string; detail: string }[] = [];

    if (!hasMovements) {
      alerts.push({
        type: "info",
        label: "Sin movimientos registrados",
        detail: "Carga movimientos para que LEDGERA pueda mostrarte alertas y fechas relevantes.",
      });
    }

    const operacionRentaDays = daysUntil(dates.operacionRentaStart);
    if (operacionRentaDays > 0 && operacionRentaDays <= 60 && basePositive) {
      alerts.push({
        type: "urgent",
        label: `Operación Renta en ${operacionRentaDays} días`,
        detail: "Tienes ganancia realizada. Revisa tus datos antes de abril.",
      });
    } else if (operacionRentaDays > 0 && operacionRentaDays <= 90 && basePositive) {
      alerts.push({
        type: "warning",
        label: `Operación Renta en ${operacionRentaDays} días`,
        detail: "Prepárate para declarar. Revisa el simulador y la sección de revisión.",
      });
    }

    const cierreDays = daysUntil(dates.cierreEjercicio);
    if (cierreDays > 0 && cierreDays <= 30 && hasSell) {
      alerts.push({
        type: "warning",
        label: `Cierre del ejercicio en ${cierreDays} días`,
        detail: "Asegúrate de tener todos los movimientos del año cargados antes del 31 de diciembre.",
      });
    }

    if (hasMovements && !hasSell && hasStaking) {
      alerts.push({
        type: "info",
        label: "Solo staking registrado",
        detail: "Tienes ingresos por staking. Revisa si deben declararse en la Operación Renta.",
      });
    }

    if (totalPnl < 0) {
      alerts.push({
        type: "info",
        label: "Pérdida realizada",
        detail: "Tienes pérdida realizada. Puedes compensarla en declaraciones futuras. Consulta con tu contador.",
      });
    }

    if (alerts.length === 0 && hasMovements) {
      alerts.push({
        type: "info",
        label: "Sin alertas activas",
        detail: "Tus datos están actualizados. El calendario te avisará cuando se acerquen fechas importantes.",
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        year: currentYear,
        referenceYear,
        hasMovements,
        hasSell,
        hasStaking,
        basePositive,
        totalPnl,
        milestones,
        alerts,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { ok: false, message: "Error al cargar calendario tributario", debug: { message: err.message } },
      { status: 500 }
    );
  }
}
