// src/modules/onboarding/application/checkUserNeedsOnboarding.ts

import { prisma } from "@/lib/prisma";

/**
 * CAPA 4.1 — Onboarding obligatorio.
 *
 * Un usuario necesita onboarding si aún no tiene datos cargados:
 * - sin movimientos de portafolio
 * - sin conexiones de exchange
 * - sin archivos bancarios importados
 *
 * Esto evita mostrar paneles vacíos y guía al usuario al primer valor
 * (Mi Situación) en menos de 5 minutos.
 */
export async function checkUserNeedsOnboarding(userId: string): Promise<boolean> {
  try {
    const [movementCount, connectionCount, bankUploadCount] = await Promise.all([
      prisma.portfolioMovement.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      prisma.exchangeConnection.count({
        where: {
          userId,
          status: "CONNECTED",
        },
      }),
      prisma.bankFileUpload.count({
        where: {
          userId,
        },
      }),
    ]);

    return movementCount === 0 && connectionCount === 0 && bankUploadCount === 0;
  } catch (error) {
    console.error("checkUserNeedsOnboarding error:", error);
    // En caso de error, no bloquear al usuario por seguridad.
    return false;
  }
}
