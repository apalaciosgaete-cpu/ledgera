import { prisma } from "@/lib/prisma";

export interface UserDashboard {
  risk: {
    score: number | null;
    level: string | null;
  };
  alerts: {
    open: number;
    critical: number;
  };
  tax: {
    pendingDocuments: number;
    rejectedDocuments: number;
  };
  documents: {
    total: number;
    tax: number;
    pendingReview: number;
    last30Days: number;
  };
  subscription: {
    status: string | null;
    plan: string | null;
    expiresAt: string | null;
    pendingPayment: boolean;
  };
}

export async function buildUserDashboard(
  userId: string,
): Promise<{ ok: true; dashboard: UserDashboard } | { ok: false; message: string }> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [latestScore, openAlerts, criticalAlerts, pendingDocuments, rejectedDocuments, documentTotal, documentTax, documentPendingReview, documentLast30Days, latestSubscription, pendingPayment] =
      await prisma.$transaction([
        prisma.taxRiskScore.findFirst({
          where: { userId },
          orderBy: { evaluatedAt: "desc" },
        }),
        prisma.alert.count({ where: { userId, status: "OPEN" } }),
        prisma.alert.count({ where: { userId, status: "OPEN", severity: "CRITICAL" } }),
        prisma.taxDocument.count({
          where: { userId, status: { in: ["DRAFT", "PENDING"] } },
        }),
        prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
        prisma.document.count({ where: { userId, status: { not: "DELETED" } } }),
        prisma.document.count({ where: { userId, status: { not: "DELETED" }, category: "TAX" } }),
        prisma.document.count({ where: { userId, status: "ACTIVE", category: "TAX" } }),
        prisma.document.count({ where: { userId, status: { not: "DELETED" }, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.billingSubscription.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.billingPayment.findFirst({
          where: { userId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { subscription_plan: true, subscription_expires_at: true },
    });

    const dashboard: UserDashboard = {
      risk: {
        score: latestScore?.score ?? null,
        level: latestScore?.level ?? null,
      },
      alerts: {
        open: openAlerts,
        critical: criticalAlerts,
      },
      tax: {
        pendingDocuments,
        rejectedDocuments,
      },
      documents: {
        total: documentTotal,
        tax: documentTax,
        pendingReview: Math.max(0, documentTax - documentPendingReview),
        last30Days: documentLast30Days,
      },
      subscription: {
        status: latestSubscription?.status ?? null,
        plan: user?.subscription_plan ?? null,
        expiresAt: user?.subscription_expires_at?.toISOString() ?? null,
        pendingPayment: pendingPayment !== null,
      },
    };

    return { ok: true, dashboard };
  } catch (error) {
    console.error("[buildUserDashboard]", error);
    return { ok: false, message: "Error al generar dashboard de usuario." };
  }
}
