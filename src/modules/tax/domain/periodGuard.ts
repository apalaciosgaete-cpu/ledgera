// src/modules/tax/domain/periodGuard.ts
import { prisma } from "@/lib/prisma";

export async function assertPeriodOpen(date: Date, userId?: string): Promise<void> {
  const year = date.getUTCFullYear();

  if (!userId) return; // sin userId no se puede verificar — permitir

  const closure = await prisma.taxPeriodClose.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });

  if (closure && !closure.reopenedAt) {
    throw new Error(
      `El período tributario ${year} está cerrado. Reabre el período antes de realizar esta operación.`
    );
  }
}