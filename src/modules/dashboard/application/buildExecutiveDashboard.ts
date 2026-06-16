import { prisma } from "@/lib/prisma";
import {
  buildMetrics,
  createEmptyDashboard,
  type ExecutiveDashboardSnapshot,
} from "@/modules/dashboard/domain/executiveDashboard";
import { getCachedDashboard, setCachedDashboard } from "./dashboardCache";
import { listTaxFiles } from "@/modules/tax-file/application/listTaxFiles";

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
      allSmartTaxScores,
      activeRecommendations,
      criticalRecommendations,
      activeRecommendationUsers,
      pendingTasks,
      overdueTasks,
      criticalTasks,
      completedTasksWithDates,
      totalDocuments,
      taxDocuments,
      pendingReviewDocuments,
      documentsLast30Days,
      profileOptimized,
      profileStandard,
      profileAttentionRequired,
      profileCritical,
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
      prisma.smartTaxScore.findMany({ orderBy: { evaluatedAt: "desc" } }),
      prisma.recommendation.count({ where: { status: "ACTIVE" } }),
      prisma.recommendation.count({ where: { status: "ACTIVE", priority: "CRITICAL" } }),
      prisma.recommendation.findMany({
        where: { status: "ACTIVE" },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.task.count({
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.task.count({
        where: {
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] }, priority: "CRITICAL" },
      }),
      prisma.task.findMany({
        where: { status: "COMPLETED", completedAt: { not: null }, startedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
        take: 1000,
      }),
      prisma.document.count({ where: { status: { not: "DELETED" } } }),
      prisma.document.count({ where: { status: { not: "DELETED" }, category: "TAX" } }),
      prisma.document.count({ where: { status: "ACTIVE", category: "TAX" } }),
      prisma.document.count({
        where: { status: { not: "DELETED" }, createdAt: { gte: subtractDays(now, 30) } },
      }),
      // Adaptive profile metrics
      prisma.adaptiveTaxProfile.count({ where: { profileType: "OPTIMIZED" } }),
      prisma.adaptiveTaxProfile.count({ where: { profileType: "STANDARD" } }),
      prisma.adaptiveTaxProfile.count({ where: { profileType: "ATTENTION_REQUIRED" } }),
      prisma.adaptiveTaxProfile.count({ where: { profileType: "CRITICAL" } }),
    ]);

    // Latest risk score per user
    const latestByUser = new Map<string, (typeof allRiskScores)[0]>();
    for (const score of allRiskScores) {
      if (!latestByUser.has(score.userId)) {
        latestByUser.set(score.userId, score);
      }
    }
    const latestScores = Array.from(latestByUser.values());

    const latestSmartByUser = new Map<string, (typeof allSmartTaxScores)[0]>();
    for (const score of allSmartTaxScores) {
      if (!latestSmartByUser.has(score.userId)) {
        latestSmartByUser.set(score.userId, score);
      }
    }
    const latestSmartScores = Array.from(latestSmartByUser.values());
    const smartAverage = latestSmartScores.length
      ? Math.round(latestSmartScores.reduce((sum, s) => sum + s.score, 0) / latestSmartScores.length)
      : 0;
    const smartDeficient = latestSmartScores.filter((s) => s.level === "DEFICIENT").length;
    const smartOptimal = latestSmartScores.filter((s) => s.level === "OPTIMAL").length;

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
    dashboard.smartTax = {
      averageScore: smartAverage,
      deficientUsers: smartDeficient,
      optimalUsers: smartOptimal,
    };
    dashboard.recommendations = {
      active: activeRecommendations,
      critical: criticalRecommendations,
      pendingUsers: activeRecommendationUsers.length,
    };

    const totalResolutionMinutes = completedTasksWithDates.reduce((sum, t) => {
      if (!t.completedAt || !t.startedAt) return sum;
      return sum + (t.completedAt.getTime() - t.startedAt.getTime()) / (1000 * 60);
    }, 0);
    const averageResolutionMinutes = completedTasksWithDates.length
      ? Math.round(totalResolutionMinutes / completedTasksWithDates.length)
      : 0;

    dashboard.tasks = {
      pending: pendingTasks,
      overdue: overdueTasks,
      critical: criticalTasks,
      averageResolutionMinutes,
    };

    const taxFilesResult = await listTaxFiles({ limit: 500 });
    const taxFiles = taxFilesResult.ok ? taxFilesResult.files : [];

    dashboard.taxFiles = {
      critical: taxFiles.filter((f) => f.status === "CRITICAL").length,
      attentionRequired: taxFiles.filter((f) => f.status === "ATTENTION_REQUIRED").length,
      healthy: taxFiles.filter((f) => f.status === "HEALTHY").length,
    };
    dashboard.documents = {
      total: totalDocuments,
      tax: taxDocuments,
      pendingReview: Math.max(0, taxDocuments - pendingReviewDocuments),
      last30Days: documentsLast30Days,
    };

    dashboard.adaptiveProfiles = {
      optimized: profileOptimized,
      standard: profileStandard,
      attentionRequired: profileAttentionRequired,
      critical: profileCritical,
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
