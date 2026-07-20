import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/modules/identity/application/sessionToken";
import { fail, ok, serverError } from "@/shared/apiResponse";

export const dynamic = "force-dynamic";

const ACTIVE_SUBSCRIPTION_STATUSES = ["ACTIVE", "CANCEL_AT_PERIOD_END"] as const;
const PAID_PAYMENT_STATUSES = ["APPROVED", "AUTHORIZED"] as const;

function monthlyEquivalent(amount: number, interval: string) {
  return interval === "ANNUAL" ? Math.round(amount / 12) : amount;
}

export async function GET(request: NextRequest) {
  const auth = await getSessionFromRequest(request);

  if (!auth) return fail("No autenticado.", 401);
  if (auth.user.role !== "admin") return fail("Sin permisos.", 403);

  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [subscriptions, paidPayments, pendingPayments, pastDueSubscriptions] = await Promise.all([
      prisma.billingSubscription.findMany({
        where: {
          status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
          OR: [
            { currentPeriodEnd: null },
            { currentPeriodEnd: { gte: now } },
          ],
        },
        select: {
          id: true,
          plan: true,
          amount: true,
          currency: true,
          interval: true,
          status: true,
          currentPeriodEnd: true,
        },
      }),
      prisma.billingPayment.findMany({
        where: {
          status: { in: [...PAID_PAYMENT_STATUSES] },
          paidAt: { gte: monthStart, lt: nextMonthStart },
        },
        select: { amount: true, currency: true },
      }),
      prisma.billingPayment.count({ where: { status: "PENDING" } }),
      prisma.billingSubscription.count({ where: { status: "PAST_DUE" } }),
    ]);

    const clpSubscriptions = subscriptions.filter((subscription) => subscription.currency === "CLP");
    const mrrClp = clpSubscriptions.reduce(
      (total, subscription) => total + monthlyEquivalent(subscription.amount, subscription.interval),
      0,
    );

    const collectedThisMonthClp = paidPayments
      .filter((payment) => payment.currency === "CLP")
      .reduce((total, payment) => total + payment.amount, 0);

    const planMrrClp = clpSubscriptions.reduce<Record<string, number>>((totals, subscription) => {
      totals[subscription.plan] =
        (totals[subscription.plan] ?? 0) + monthlyEquivalent(subscription.amount, subscription.interval);
      return totals;
    }, {});

    return ok(
      {
        currency: "CLP",
        mrr: mrrClp,
        collectedThisMonth: collectedThisMonthClp,
        activeBillingSubscriptions: subscriptions.length,
        pendingPayments,
        pastDueSubscriptions,
        planMrr: planMrrClp,
        calculatedAt: now.toISOString(),
        source: "billing_subscriptions_and_payments",
      },
      "Métricas administrativas calculadas desde facturación.",
    );
  } catch (error) {
    return serverError(error);
  }
}
