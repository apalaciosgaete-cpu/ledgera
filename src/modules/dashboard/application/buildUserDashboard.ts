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
    const [latestScore, openAlerts, criticalAlerts, pendingDocuments, rejectedDocuments, latestSubscription, pendingPayment] =
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
