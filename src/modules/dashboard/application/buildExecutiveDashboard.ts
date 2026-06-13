import { prisma } from "@/lib/prisma";
import {
  buildMetrics,
  createEmptyDashboard,
  type ExecutiveDashboardSnapshot,
} from "@/modules/dashboard/domain/executiveDashboard";
import { getCachedDashboard, setCachedDashboard } from "./dashboardCache";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export async function buildExecutiveDashboard(options?: {
  skipCache?: boolean;
}): Promise<{ ok: true; snapshot: ExecutiveDashboardSnapshot } | { ok: false; message: string }> {
  if (!options?.skipCache) {
    const cached = getCachedDashboard();
    if (cached) {
      return { ok: true, snapshot: cached };
    }
  }

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = subtractDays(todayStart, 1);

    const [
      openAlerts,
      criticalAlerts,
      resolvedToday,
      allRiskScores,
      pendingDocuments,
      rejectedDocuments,
      activeCafs,
      disconnectedCredentials,
      activeSubscriptions,
      cancelledSubscriptions,
      pendingPayments,
      exchangeConnections,
      failedImports,
      criticalAuditEvents,
      failedAuditEvents,
      totalEventsToday,
      latestAlerts,
      latestCriticalAuditEvents,
    ] = await prisma.$transaction([
      prisma.alert.count({ where: { status: "OPEN" } }),
      prisma.alert.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
      prisma.alert.count({
        where: { status: "RESOLVED", resolvedAt: { gte: todayStart } },
      }),
      prisma.taxRiskScore.findMany({ orderBy: { evaluatedAt: "desc" } }),
      prisma.taxDocument.count({
        where: { status: { in: ["DRAFT", "PENDING"] } },
      }),
      prisma.taxDocument.count({ where: { status: "REJECTED" } }),
      prisma.siiCaf.findMany({ where: { isActive: true } }),
      prisma.siiCredential.count({
        where: {
          OR: [{ isActive: false }, { certificateExpires: { lt: now } }],
        },
      }),
      prisma.billingSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.billingSubscription.count({
        where: { OR: [{ status: "CANCELLED" }, { canceledAt: { not: null } }] },
      }),
      prisma.billingPayment.count({ where: { status: "PENDING" } }),
      prisma.exchangeConnection.findMany(),
      prisma.exchangeImportRecord.count({ where: { status: "FAILED" } }),
      prisma.auditEvent.count({
        where: { severity: "CRITICAL", createdAt: { gte: yesterdayStart } },
      }),
      prisma.auditEvent.count({
        where: { result: "FAILED", createdAt: { gte: yesterdayStart } },
      }),
      prisma.auditEvent.count({ where: { createdAt: { gte: yesterdayStart } } }),
      prisma.alert.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          userId: true,
          category: true,
          severity: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.auditEvent.findMany({
        where: { severity: "CRITICAL" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          userId: true,
          actorId: true,
          category: true,
          severity: true,
          event: true,
          description: true,
          result: true,
          createdAt: true,
        },
      }),
    ]);

    // Latest risk score per user
    const latestByUser = new Map<string, (typeof allRiskScores)[0]>();
    for (const score of allRiskScores) {
      if (!latestByUser.has(score.userId)) {
        latestByUser.set(score.userId, score);
      }
    }
    const latestScores = Array.from(latestByUser.values());

    const averageScore = latestScores.length
      ? Math.round(latestScores.reduce((sum, s) => sum + s.score, 0) / latestScores.length)
      : 0;
    const criticalUsers = latestScores.filter((s) => s.level === "CRITICAL").length;
    const highUsers = latestScores.filter((s) => s.level === "HIGH").length;

    const availableFolios = activeCafs.reduce((sum, caf) => {
      const remaining = caf.folioEnd - caf.currentFolio + 1;
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    const degradedConnections = exchangeConnections.filter((c) => c.status !== "ACTIVE").length;
    const disconnectedExchanges = exchangeConnections.filter((c) =>
      ["ERROR", "INVALID_CREDENTIALS", "DISCONNECTED"].includes(c.status),
    ).length;

    const estimatedMrr = await prisma.billingSubscription
      .aggregate({
        where: { status: "ACTIVE" },
        _sum: { amount: true },
      })
      .then((result) => result._sum.amount ?? 0);

    const dashboard = createEmptyDashboard(now);
    dashboard.alerts = { open: openAlerts, critical: criticalAlerts, resolvedToday };
    dashboard.risk = { averageScore, criticalUsers, highUsers };
    dashboard.tax = {
      dtePending: pendingDocuments,
      dteRejected: rejectedDocuments,
      availableFolios,
      siiDisconnected: disconnectedCredentials,
    };
    dashboard.billing = {
      activeSubscriptions,
      pendingPayments,
      cancelledSubscriptions,
      estimatedMrr,
    };
    dashboard.operations = { degradedConnections, failedImports, disconnectedExchanges };
    dashboard.audit = {
      criticalEvents: criticalAuditEvents,
      errorsToday: failedAuditEvents,
      totalEventsToday,
    };
    dashboard.metrics = buildMetrics(dashboard);

    const topRisk = latestScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => ({
        userId: s.userId,
        score: s.score,
        level: s.level,
        evaluatedAt: s.evaluatedAt,
      }));

    const snapshot: ExecutiveDashboardSnapshot = {
      dashboard,
      topRisk,
      latestAlerts,
      criticalEvents: latestCriticalAuditEvents,
    };

    setCachedDashboard(snapshot);

    console.info("[dashboard]", {
      event: "executive_dashboard_generated",
      generatedAt: now.toISOString(),
      metricsCount: dashboard.metrics.length,
    });

    return { ok: true, snapshot };
  } catch (error) {
    console.error("[buildExecutiveDashboard]", error);
    return { ok: false, message: "Error al generar dashboard ejecutivo." };
  }
}
