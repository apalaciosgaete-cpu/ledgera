import { prisma } from "@/lib/prisma";
import type { TaxFileSummary } from "@/modules/tax-file/domain/taxFile";
import { resolveTaxFileStatus } from "@/modules/tax-file/domain/taxFile";

export type BuildTaxFileSummaryResult =
  | { ok: true; summary: TaxFileSummary }
  | { ok: false; message: string };

export async function buildTaxFileSummary(
  userId: string,
): Promise<BuildTaxFileSummaryResult> {
  try {
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const [
      user,
      taxProfile,
      latestRiskScore,
      latestSmartScore,
      openAlerts,
      criticalAlerts,
      activeRecommendations,
      criticalRecommendations,
      pendingTasks,
      overdueTasks,
      criticalTasks,
      totalDocuments,
      pendingDocuments,
      rejectedDocuments,
      siiCredentials,
      activeCafs,
      activeSubscription,
      connections,
      recentAuditEvents,
      criticalAuditEvents,
    ] = await prisma.$transaction([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          subscription_plan: true,
        },
      }),
      prisma.taxProfile.findUnique({ where: { userId } }),
      prisma.taxRiskScore.findFirst({
        where: { userId },
        orderBy: { evaluatedAt: "desc" },
      }),
      prisma.smartTaxScore.findFirst({
        where: { userId },
        orderBy: { evaluatedAt: "desc" },
      }),
      prisma.alert.count({ where: { userId, status: "OPEN" } }),
      prisma.alert.count({
        where: { userId, status: "OPEN", severity: "CRITICAL" },
      }),
      prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
      prisma.recommendation.count({
        where: { userId, status: "ACTIVE", priority: "CRITICAL" },
      }),
      prisma.task.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.task.count({
        where: {
          userId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          priority: "CRITICAL",
        },
      }),
      prisma.taxDocument.count({ where: { userId } }),
      prisma.taxDocument.count({
        where: { userId, status: { in: ["DRAFT", "PENDING"] } },
      }),
      prisma.taxDocument.count({ where: { userId, status: "REJECTED" } }),
      prisma.siiCredential.findMany({
        where: {
          isActive: true,
        },
      }),
      prisma.siiCaf.count({ where: { isActive: true } }),
      prisma.billingSubscription.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.exchangeConnection.findMany({ where: { userId } }),
      prisma.auditEvent.count({
        where: { userId, createdAt: { gte: yesterdayStart } },
      }),
      prisma.auditEvent.count({
        where: { userId, severity: "CRITICAL", createdAt: { gte: yesterdayStart } },
      }),
    ]);

    if (!user) {
      return { ok: false, message: "Usuario no encontrado." };
    }

    const siiConfigured = siiCredentials.length > 0;
    const hasExpiredCredential = siiCredentials.some(
      (c) => !c.certificateExpires || c.certificateExpires < now,
    );

    const siiStatus = siiConfigured
      ? hasExpiredCredential
        ? "CERTIFICATE_EXPIRED"
        : "CONFIGURED"
      : "NOT_CONFIGURED";

    const summary: TaxFileSummary = {
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name,
      status: "HEALTHY",
      taxProfile: {
        exists: !!taxProfile,
        documentType: taxProfile?.documentType ?? null,
        rut: taxProfile?.rut ?? null,
        legalName: taxProfile?.legalName ?? null,
        isValidated: taxProfile?.isValidated ?? false,
      },
      risk: {
        score: latestRiskScore?.score ?? null,
        level: latestRiskScore?.level ?? null,
      },
      smartScore: {
        score: latestSmartScore?.score ?? null,
        level: latestSmartScore?.level ?? null,
      },
      alerts: {
        open: openAlerts,
        critical: criticalAlerts,
      },
      recommendations: {
        active: activeRecommendations,
        critical: criticalRecommendations,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
        critical: criticalTasks,
      },
      taxDocuments: {
        total: totalDocuments,
        pending: pendingDocuments,
        rejected: rejectedDocuments,
      },
      sii: {
        configured: siiConfigured,
        status: siiStatus,
        activeCafs,
      },
      billing: {
        plan: user.subscription_plan ?? "BASICO",
        subscriptionStatus: activeSubscription?.status ?? null,
      },
      connections: {
        total: connections.length,
        degraded: connections.filter((c) => c.status !== "ACTIVE").length,
      },
      audit: {
        recentEvents: recentAuditEvents,
        criticalEvents: criticalAuditEvents,
      },
      generatedAt: now,
    };

    summary.status = resolveTaxFileStatus({
      riskLevel: summary.risk.level,
      criticalOverdueTasks: summary.tasks.critical > 0 && summary.tasks.overdue > 0 ? 1 : 0,
      rejectedDocuments: summary.taxDocuments.rejected,
      openCriticalAlerts: summary.alerts.critical,
      smartScoreLevel: summary.smartScore.level,
      openAlerts: summary.alerts.open,
      pendingTasks: summary.tasks.pending,
      profileValidated: summary.taxProfile.isValidated,
    });

    return { ok: true, summary };
  } catch (error) {
    console.error("[tax-file/buildTaxFileSummary]", error);
    return { ok: false, message: "Error al construir el expediente tributario." };
  }
}
