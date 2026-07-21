import { prisma } from "@/lib/prisma";
import { PROFESSIONAL_INCLUDED_CLIENTS } from "@/modules/professional/domain/clientAccess";
import {
  PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
  PROFESSIONAL_EXTRA_CLIENT_TOTAL_CLP,
} from "@/modules/professional/domain/professionalSeatBilling";

const ACTIVE_SEAT_STATUSES = ["ACTIVE", "CANCEL_AT_PERIOD_END"] as const;

function parseQuantity(metadata: string | null, amount: number) {
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as { quantity?: unknown };
      if (
        typeof parsed.quantity === "number" &&
        Number.isInteger(parsed.quantity) &&
        parsed.quantity > 0
      ) {
        return parsed.quantity;
      }
    } catch {
      // Fall back to the billed amount for historical or malformed metadata.
    }
  }

  return Math.max(
    Math.round(amount / PROFESSIONAL_EXTRA_CLIENT_TOTAL_CLP),
    1,
  );
}

export async function getProfessionalSeatEntitlement(
  professionalUserId: string,
  now = new Date(),
) {
  const subscriptions = await prisma.billingSubscription.findMany({
    where: {
      userId: professionalUserId,
      plan: PROFESSIONAL_EXTRA_CLIENT_PRODUCT,
      status: { in: [...ACTIVE_SEAT_STATUSES] },
      OR: [
        { currentPeriodEnd: null },
        { currentPeriodEnd: { gte: now } },
      ],
    },
    select: {
      id: true,
      amount: true,
      metadata: true,
      currentPeriodEnd: true,
    },
  });

  const purchasedSeats = subscriptions.reduce(
    (total, subscription) =>
      total + parseQuantity(subscription.metadata, subscription.amount),
    0,
  );

  return {
    includedSeats: PROFESSIONAL_INCLUDED_CLIENTS,
    purchasedSeats,
    totalSeats: PROFESSIONAL_INCLUDED_CLIENTS + purchasedSeats,
    activeSeatSubscriptions: subscriptions.length,
    nextSeatExpirationAt: subscriptions
      .map((subscription) => subscription.currentPeriodEnd)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
  };
}
