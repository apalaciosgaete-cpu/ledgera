import { prisma } from "@/lib/prisma";
import type { TaxMemory, TaxMemoryYearSummary, TaxMemoryScoreEntry, TaxMemoryAlert, TaxMemoryRecommendation, TaxMemoryTask, TaxMemoryDeclaration, TaxMemoryDocument, TaxMemoryTimelineEvent, TaxMemoryInsight } from "@/modules/tax-memory/domain/taxMemory";
import { resolveTaxMemoryStatus } from "@/modules/tax-memory/domain/taxMemory";

export type BuildTaxMemoryResult =
  | { ok: true; memory: TaxMemory }
  | { ok: false; message: string };

export async function buildTaxMemory(
  userId: string,
): Promise<BuildTaxMemoryResult> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      user,
      taxProfile,
      smartScoreHistory,
      latestSmartScore,
      annualSummaries,
      periods,
      openAlerts,
      criticalAlerts,
      recentAlerts,
      activeRecommendations,
      recentRecommendations,
      pendingTasks,
      overdueTasks,
      criticalTasks,
      recentTasks,
      declarations,
      recentDocuments,
      siiCredentials,
      activeCafs,
      recentAuditEvents,
    ] = await prisma.$transaction([
      // User info
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          subscription_plan: true,
        },
      }),
      // Tax profile
      prisma.taxProfile.findUnique({ where: { userId } }),
      // Smart score history (last 12)
      prisma.smartTaxScore.findMany({
        where: { userId },
        orderBy: { evaluatedAt: "desc" },
        take: 12,
      }),
      // Latest smart score
      prisma.smartTaxScore.findFirst({
        where: { userId },
        orderBy: { evaluatedAt: "desc" },
      }),
      // Annual tax summaries
      prisma.annualTaxSummary.findMany({
        where: { userId },
        orderBy: { taxYear: "desc" },
      }),
      // Period closures (status by year)
      prisma.taxPeriodClose.findMany({
        where: { userId },
        select: { periodYear: true, status: true, closedAt: true },
      }),
      // Alerts counts
      prisma.alert.count({ where: { userId, status: "OPEN" } }),
      prisma.alert.count({
        where: { userId, status: "OPEN", severity: "CRITICAL" },
      }),
      // Recent alerts
      prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, severity: true, status: true, createdAt: true, category: true },
      }),
      // Recommendations count
      prisma.recommendation.count({ where: { userId, status: "ACTIVE" } }),
      // Recent recommendations
      prisma.recommendation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
      }),
      // Tasks
      prisma.task.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.task.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] }, dueDate: { lt: now } },
      }),
      prisma.task.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] }, priority: "CRITICAL" },
      }),
      // Recent tasks
      prisma.task.findMany({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, priority: true, status: true, dueDate: true, createdAt: true },
      }),
      // Declarations
      prisma.taxDeclaration.findMany({
        where: { userId },
        orderBy: { taxYear: "desc" },
        take: 20,
        select: { id: true, taxYear: true, declarationType: true, status: true, contentHash: true, generatedAt: true, confirmedAt: true, voidedAt: true },
      }),
      // Recent documents (from Document model)
      prisma.document.findMany({
        where: { userId, status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, category: true, status: true, createdAt: true },
      }),
      // SII credentials
      prisma.siiCredential.findMany({ where: { isActive: true } }),
      // Active CAFs
      prisma.siiCaf.count({ where: { isActive: true } }),
      // Recent audit events
      prisma.auditEvent.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, event: true, description: true, severity: true, createdAt: true, metadata: true },
      }),
    ]);

    if (!user) {
      return { ok: false, message: "Usuario no encontrado." };
    }

    // Build year summaries
    const periodMap = new Map<number, { periodYear: number; status: string; closedAt: Date | null }>();
    for (const p of periods) {
      periodMap.set(p.periodYear, p);
    }

    const yearSummaries: TaxMemoryYearSummary[] = annualSummaries.map((s) => {
      const period = periodMap.get(s.taxYear);
      return {
        taxYear: s.taxYear,
        status: (period?.status as "OPEN" | "CLOSED" | "REOPENED") ?? "OPEN",
        closedAt: period?.closedAt?.toISOString() ?? null,
        movementCount: s.taxableEventCount ?? 0,
        taxEventCount: s.taxableEventCount ?? 0,
        grossProceedsClp: s.grossProceedsClp ?? 0,
        costBasisClp: s.costBasisClp ?? 0,
        realizedGainClp: s.realizedGainClp ?? 0,
        realizedLossClp: s.realizedLossClp ?? 0,
        netTaxableGainClp: s.netTaxableGainClp ?? 0,
        preliminaryTaxBaseClp: s.preliminaryTaxBaseClp ?? 0,
        declarationCount: 0,
        confirmedDeclarationCount: 0,
      };
    });

    // Add declaration counts to year summaries
    const mappedDeclarations: TaxMemoryDeclaration[] = declarations.map((d) => ({
      id: d.id,
      taxYear: d.taxYear,
      declarationType: d.declarationType,
      status: d.status,
      contentHash: d.contentHash,
      generatedAt: d.generatedAt.toISOString(),
      confirmedAt: d.confirmedAt?.toISOString() ?? null,
      voidedAt: d.voidedAt?.toISOString() ?? null,
    }));

    const declByYear = new Map<number, TaxMemoryDeclaration[]>();
    for (const d of mappedDeclarations) {
      if (!declByYear.has(d.taxYear)) declByYear.set(d.taxYear, []);
      declByYear.get(d.taxYear)!.push(d);
    }

    for (const ys of yearSummaries) {
      const yearDecls = declByYear.get(ys.taxYear) ?? [];
      ys.declarationCount = yearDecls.length;
      ys.confirmedDeclarationCount = yearDecls.filter(
        (d) => d.status === "CONFIRMED" || d.status === "EXPORTED",
      ).length;
    }

    // Add period-only years that have no annual summary yet
    for (const period of periods) {
      if (!yearSummaries.some((ys) => ys.taxYear === period.periodYear)) {
        const yearDecls = declByYear.get(period.periodYear) ?? [];
        yearSummaries.push({
          taxYear: period.periodYear,
          status: period.status as "OPEN" | "CLOSED" | "REOPENED",
          closedAt: period.closedAt?.toISOString() ?? null,
          movementCount: 0,
          taxEventCount: 0,
          grossProceedsClp: 0,
          costBasisClp: 0,
          realizedGainClp: 0,
          realizedLossClp: 0,
          netTaxableGainClp: 0,
          preliminaryTaxBaseClp: 0,
          declarationCount: yearDecls.length,
          confirmedDeclarationCount: yearDecls.filter(
            (d) => d.status === "CONFIRMED" || d.status === "EXPORTED",
          ).length,
        });
      }
    }

    yearSummaries.sort((a, b) => b.taxYear - a.taxYear);

    // Score history
    const scoreHistory: TaxMemoryScoreEntry[] = smartScoreHistory.map((s) => ({
      id: s.id,
      score: s.score,
      level: s.level,
      evaluatedAt: s.evaluatedAt.toISOString(),
    }));

    // Alerts
    const alerts: TaxMemoryAlert[] = recentAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      category: a.category,
    }));

    // Recommendations
    const recommendations: TaxMemoryRecommendation[] = recentRecommendations.map((r) => ({
      id: r.id,
      title: r.title,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    // Tasks
    const tasks: TaxMemoryTask[] = recentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

    // Documents
    const documents: TaxMemoryDocument[] = recentDocuments.map((d) => ({
      id: d.id,
      fileName: d.name,
      category: d.category,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    }));

    // Timeline
    const timeline: TaxMemoryTimelineEvent[] = [];

    // Add audit events to timeline
    for (const event of recentAuditEvents) {
      timeline.push({
        id: `audit-${event.id}`,
        date: event.createdAt.toISOString(),
        type: "SYSTEM",
        title: event.event,
        description: event.description,
        metadata: event.metadata as Record<string, unknown> | null,
      });
    }

    // Add declaration events to timeline
    for (const decl of declarations) {
      timeline.push({
        id: `decl-generated-${decl.id}`,
        date: decl.generatedAt.toISOString(),
        type: "DECLARATION",
        title: `Declaración ${decl.declarationType} ${decl.taxYear}`,
        description: `Estado: ${decl.status}`,
        metadata: null,
      });
      if (decl.confirmedAt) {
        timeline.push({
          id: `decl-confirmed-${decl.id}`,
          date: decl.confirmedAt.toISOString(),
          type: "DECLARATION",
          title: `Declaración ${decl.taxYear} confirmada`,
          description: null,
          metadata: null,
        });
      }
    }

    // Add score evaluations to timeline
    for (const score of smartScoreHistory.slice(0, 5)) {
      timeline.push({
        id: `score-${score.id}`,
        date: score.evaluatedAt.toISOString(),
        type: "SCORE",
        title: `Smart Tax Score: ${score.score}/100`,
        description: `Nivel: ${score.level}`,
        metadata: null,
      });
    }

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate intelligent insights
    const insights: TaxMemoryInsight[] = [];

    if (latestSmartScore) {
      if (latestSmartScore.score <= 40) {
        insights.push({
          type: "CRITICAL",
          title: "Score tributario deficiente",
          description: "Tu salud tributaria general requiere atención inmediata. Revisa las alertas y completa los datos faltantes.",
          actionLabel: "Ver score",
          actionHref: "/score-tributario",
        });
      } else if (latestSmartScore.score <= 65) {
        insights.push({
          type: "WARNING",
          title: "Score tributario en desarrollo",
          description: "Hay áreas de mejora en tu perfil tributario. Atiende las recomendaciones pendientes para mejorar tu puntuación.",
          actionLabel: "Ver score",
          actionHref: "/score-tributario",
        });
      } else if (latestSmartScore.score >= 86) {
        insights.push({
          type: "POSITIVE",
          title: "Score tributario óptimo",
          description: "Tu situación tributaria está en excelente estado. Sigue así y mantén tus datos al día.",
          actionLabel: null,
          actionHref: null,
        });
      } else {
        insights.push({
          type: "INFO",
          title: "Score tributario saludable",
          description: "Tu perfil tributario está en buen estado. Revisa periódicamente para mantenerlo así.",
          actionLabel: null,
          actionHref: null,
        });
      }
    } else {
      insights.push({
        type: "INFO",
        title: "Evalúa tu salud tributaria",
        description: "Aún no tienes un Smart Tax Score calculado. Evalúa tu situación para obtener recomendaciones personalizadas.",
        actionLabel: "Evaluar ahora",
        actionHref: "/score-tributario",
      });
    }

    if (criticalAlerts > 0) {
      insights.push({
        type: "CRITICAL",
        title: `${criticalAlerts} alerta${criticalAlerts > 1 ? "s" : ""} crítica${criticalAlerts > 1 ? "s" : ""} sin resolver`,
        description: "Las alertas críticas requieren atención inmediata para evitar problemas tributarios.",
        actionLabel: "Ver alertas",
        actionHref: "/alertas",
      });
    }

    if (overdueTasks > 0) {
      insights.push({
        type: "WARNING",
        title: `${overdueTasks} tarea${overdueTasks > 1 ? "s" : ""} vencida${overdueTasks > 1 ? "s" : ""}`,
        description: "Tienes tareas pendientes que ya excedieron su fecha de vencimiento.",
        actionLabel: "Ver tareas",
        actionHref: "/tareas",
      });
    }

    if (yearSummaries.length > 0) {
      const latestYear = yearSummaries[0];
      if (latestYear && latestYear.preliminaryTaxBaseClp > 0) {
        insights.push({
          type: "INFO",
          title: `Base imponible ${latestYear.taxYear}: $${latestYear.preliminaryTaxBaseClp.toLocaleString("es-CL")}`,
          description: "Monto estimado sobre el cual se calculan tus impuestos. Revisa que todos tus movimientos estén correctamente clasificados.",
          actionLabel: "Ver detalle",
          actionHref: `/experto/tributario?year=${latestYear.taxYear}`,
        });
      }
    }

    if (!taxProfile?.isValidated) {
      insights.push({
        type: "WARNING",
        title: "Perfil tributario no validado",
        description: "Completa y valida tu perfil tributario para acceder a todas las funcionalidades del sistema.",
        actionLabel: "Configurar perfil",
        actionHref: "/configuracion",
      });
    }

    // SII status
    const siiConfigured = siiCredentials.length > 0;
    const hasExpiredCredential = siiCredentials.some(
      (c) => !c.certificateExpires || c.certificateExpires < now,
    );
    const siiStatus = siiConfigured
      ? hasExpiredCredential
        ? "CERTIFICATE_EXPIRED"
        : "CONFIGURED"
      : "NOT_CONFIGURED";

    const status = resolveTaxMemoryStatus({
      currentScoreLevel: latestSmartScore?.level ?? null,
      criticalAlerts,
      openAlerts,
      pendingTasks,
      hasOverdueTasks: overdueTasks > 0,
      profileValidated: taxProfile?.isValidated ?? false,
    });

    const memory: TaxMemory = {
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name,
      subscriptionPlan: user.subscription_plan ?? "BASICO",
      status,
      taxProfile: {
        exists: !!taxProfile,
        rut: taxProfile?.rut ?? null,
        legalName: taxProfile?.legalName ?? null,
        documentType: taxProfile?.documentType ?? null,
        isValidated: taxProfile?.isValidated ?? false,
      },
      currentScore: {
        score: latestSmartScore?.score ?? null,
        level: latestSmartScore?.level ?? null,
        evaluatedAt: latestSmartScore?.evaluatedAt.toISOString() ?? null,
      },
      scoreHistory,
      yearSummaries,
      alerts,
      recommendations,
      tasks,
      declarations: mappedDeclarations,
      documents,
      timeline: timeline.slice(0, 30),
      insights,
      siiStatus: {
        configured: siiConfigured,
        status: siiStatus,
        activeCafs,
      },
      generatedAt: now.toISOString(),
    };

    return { ok: true, memory };
  } catch (error) {
    console.error("[tax-memory/buildTaxMemory]", error);
    return { ok: false, message: "Error al construir la memoria tributaria." };
  }
}
