// src/modules/billing/application/getBillingStatus.ts

import { prisma } from "@/lib/prisma";
import { getPlanLabel, normalizePlan } from "@/modules/subscription/domain/planFeatures";

type BillingPaymentDto = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  paymentUrl: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

type BillingSubscriptionDto = {
  id: string;
  provider: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getBillingStatus(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription_plan: true,
      subscription_expires_at: true,
      activatedAt: true,
      activationSource: true,
    },
  });

  if (!user) return null;

  const [activeSubscription, latestSubscription, payments] = await Promise.all([
    prisma.billingSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      orderBy: { currentPeriodEnd: "desc" },
    }),
    prisma.billingSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.billingPayment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const normalizedPlan = normalizePlan(user.subscription_plan);
  const latestPayment = payments[0] ?? null;

  const mappedPayments: BillingPaymentDto[] = payments.map((payment) => ({
    id: payment.id,
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    paymentUrl: payment.paymentUrl,
    paidAt: toIso(payment.paidAt),
    failedAt: toIso(payment.failedAt),
    createdAt: payment.createdAt.toISOString(),
  }));

  const mappedSubscription = (activeSubscription ?? latestSubscription)
    ? ({
        id: (activeSubscription ?? latestSubscription)!.id,
        provider: (activeSubscription ?? latestSubscription)!.provider,
        plan: (activeSubscription ?? latestSubscription)!.plan,
        status: (activeSubscription ?? latestSubscription)!.status,
        amount: (activeSubscription ?? latestSubscription)!.amount,
        currency: (activeSubscription ?? latestSubscription)!.currency,
        interval: (activeSubscription ?? latestSubscription)!.interval,
        currentPeriodStart: toIso((activeSubscription ?? latestSubscription)!.currentPeriodStart),
        currentPeriodEnd: toIso((activeSubscription ?? latestSubscription)!.currentPeriodEnd),
        canceledAt: toIso((activeSubscription ?? latestSubscription)!.canceledAt),
      } satisfies BillingSubscriptionDto)
    : null;

  console.info("[commercial]", {
    event: "billing_status_viewed",
    userId,
    plan: normalizedPlan,
    latestPaymentStatus: latestPayment?.status ?? null,
    occurredAt: new Date().toISOString(),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    plan: {
      raw: user.subscription_plan,
      normalized: normalizedPlan,
      label: getPlanLabel(user.subscription_plan),
      expiresAt: toIso(user.subscription_expires_at),
      activatedAt: toIso(user.activatedAt),
      activationSource: user.activationSource,
    },
    subscription: mappedSubscription,
    latestPayment: latestPayment
      ? {
          id: latestPayment.id,
          provider: latestPayment.provider,
          status: latestPayment.status,
          amount: latestPayment.amount,
          currency: latestPayment.currency,
          description: latestPayment.description,
          paidAt: toIso(latestPayment.paidAt),
          failedAt: toIso(latestPayment.failedAt),
          createdAt: latestPayment.createdAt.toISOString(),
        }
      : null,
    payments: mappedPayments,
  };
}
