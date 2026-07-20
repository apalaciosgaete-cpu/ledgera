import { prisma } from "@/lib/prisma";
import { normalizePlan, Plan } from "@/modules/subscription/domain/planFeatures";

export const FREE_MOVEMENT_LIMIT = 50;

export class MovementLimitError extends Error {
  readonly code = "FREE_MOVEMENT_LIMIT";
  readonly status = 403;

  constructor(
    readonly currentCount: number,
    readonly requestedCount: number,
  ) {
    super(
      `El plan Gratuito permite hasta ${FREE_MOVEMENT_LIMIT} movimientos. Tienes ${currentCount} y esta operación agregaría ${requestedCount}. Activa Personal para continuar.`,
    );
    this.name = "MovementLimitError";
  }
}

export function isMovementLimitError(
  error: unknown,
): error is MovementLimitError {
  return error instanceof MovementLimitError || (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "FREE_MOVEMENT_LIMIT"
  );
}

export async function enforceMovementLimit(input: {
  userId: string;
  requestedCount?: number;
}): Promise<void> {
  const requestedCount = Math.max(1, Math.trunc(input.requestedCount ?? 1));

  const user = await prisma.users.findUnique({
    where: { id: input.userId },
    select: {
      role: true,
      subscription_plan: true,
    },
  });

  if (!user) throw new Error("Usuario no encontrado.");
  if (user.role === "admin") return;
  if (normalizePlan(user.subscription_plan) !== Plan.FREE) return;

  const currentCount = await prisma.portfolioMovement.count({
    where: { userId: input.userId },
  });

  if (currentCount + requestedCount > FREE_MOVEMENT_LIMIT) {
    throw new MovementLimitError(currentCount, requestedCount);
  }
}
