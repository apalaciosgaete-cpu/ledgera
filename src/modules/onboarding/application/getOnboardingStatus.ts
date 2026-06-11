// src/modules/onboarding/application/getOnboardingStatus.ts

import { prisma } from "@/lib/prisma";

export type OnboardingStatus = {
  needsOnboarding: boolean;
  hasMovements: boolean;
  hasConnections: boolean;
  hasBankFiles: boolean;
  /** Fuente más probable de activación (para first_data_loaded). */
  source: "csv" | "exchange" | "bank" | "manual";
};

/**
 * CAPA 4.1 — Activación guiada.
 *
 * Un usuario necesita onboarding mientras no tenga datos cargados:
 * - sin movimientos de portafolio
 * - sin conexiones de exchange
 * - sin archivos bancarios importados
 *
 * La fuente se infiere del primer canal con datos encontrado.
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    const [movementCount, connectionCount, bankUploadCount, latestMovement] = await Promise.all([
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
      prisma.portfolioMovement.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          executedAt: "desc",
        },
        select: {
          source: true,
        },
      }),
    ]);

    const hasMovements = movementCount > 0;
    const hasConnections = connectionCount > 0;
    const hasBankFiles = bankUploadCount > 0;
    const needsOnboarding = !hasMovements && !hasConnections && !hasBankFiles;

    let source: OnboardingStatus["source"] = "manual";
    if (hasConnections) {
      source = "exchange";
    } else if (hasBankFiles) {
      source = "bank";
    } else if (latestMovement?.source) {
      const normalized = String(latestMovement.source).toUpperCase();
      if (normalized.includes("CSV") || normalized.includes("IMPORT")) {
        source = "csv";
      } else if (normalized.includes("BINANCE") || normalized.includes("EXCHANGE")) {
        source = "exchange";
      } else if (normalized.includes("BANK")) {
        source = "bank";
      } else {
        source = "manual";
      }
    }

    return {
      needsOnboarding,
      hasMovements,
      hasConnections,
      hasBankFiles,
      source,
    };
  } catch (error) {
    console.error("getOnboardingStatus error:", error);
    // En caso de error, no bloquear al usuario por seguridad.
    return {
      needsOnboarding: false,
      hasMovements: false,
      hasConnections: false,
      hasBankFiles: false,
      source: "manual",
    };
  }
}
