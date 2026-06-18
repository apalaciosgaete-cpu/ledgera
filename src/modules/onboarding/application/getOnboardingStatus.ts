// src/modules/onboarding/application/getOnboardingStatus.ts

import { prisma } from "@/lib/prisma";

export type OnboardingStatus = {
  needsOnboarding: boolean;
};

/**
 * UX 3.0.03 — Onboarding Conversacional
 *
 * Un usuario necesita onboarding si NO ha completado el
 * flujo conversacional (onboardingCompleted === false).
 *
 * Fallback para usuarios existentes: si ya tienen datos
 * (movimientos, conexiones o archivos bancarios) se
 * considera onboarding completado automáticamente.
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    const [user, movementCount, connectionCount, bankUploadCount] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { onboardingCompleted: true },
      }),
      prisma.portfolioMovement.count({
        where: { userId, deletedAt: null },
      }),
      prisma.exchangeConnection.count({
        where: { userId, status: "CONNECTED" },
      }),
      prisma.bankFileUpload.count({
        where: { userId },
      }),
    ]);

    // Si ya completó el onboarding conversacional, no necesita
    if (user?.onboardingCompleted) {
      return { needsOnboarding: false };
    }

    // Fallback: usuarios existentes con datos se saltan el onboarding
    if (movementCount > 0 || connectionCount > 0 || bankUploadCount > 0) {
      // Auto-marcar como completado para que no lo vuelvan a ver
      await prisma.users.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      }).catch(() => {});
      return { needsOnboarding: false };
    }

    return { needsOnboarding: true };
  } catch (error) {
    console.error("getOnboardingStatus error:", error);
    // En caso de error, no bloquear al usuario por seguridad.
    return {
      needsOnboarding: false,
    };
  }
}
