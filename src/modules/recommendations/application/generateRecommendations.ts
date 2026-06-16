import { prisma } from "@/lib/prisma";
import type { RecommendationSignal } from "@/modules/recommendations/domain/recommendation";
import { recommendationKey } from "@/modules/recommendations/domain/recommendation";
import {
  getActiveRecommendationsForUser,
  upsertRecommendation,
} from "@/modules/recommendations/infrastructure/recommendationRepository";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

export type GenerateRecommendationsResult =
  | { ok: true; created: number; updated: number; removed: number }
  | { ok: false; message: string };

export async function generateRecommendations(
  userId: string,
): Promise<GenerateRecommendationsResult> {
  try {
    const signals = await collectSignals(userId);
    const activeKeys = new Set(signals.map((s) => recommendationKey(s)));

    let created = 0;
    let updated = 0;

    for (const signal of signals) {
      const result = await upsertRecommendation({
        userId: signal.userId,
        category: signal.category,
        priority: signal.priority,
        title: signal.title,
        description: signal.description,
        actionLabel: signal.actionLabel,
        actionUrl: signal.actionUrl,
        sourceType: signal.sourceType,
        sourceId: signal.sourceId ?? null,
        metadata: signal.metadata ?? null,
      });

      if (result.isNew) {
        created++;
        await recordAuditEvent({
          userId,
          actorId: userId,
          category: "COMPLIANCE",
          severity: mapPriorityToSeverity(signal.priority),
          event: "recommendation_created",
          description: signal.title,
          result: "SUCCESS",
          entityType: "Recommendation",
          entityId: result.recommendation.id,
          metadata: {
            category: signal.category,
            priority: signal.priority,
            sourceType: signal.sourceType,
            sourceId: signal.sourceId ?? null,
          },
        });

        await recordTimelineEvent({
          userId,
          category: "RECOMMENDATION",
          severity: mapPriorityToTimelineSeverity(signal.priority),
          title: "Recomendación generada",
          description: signal.title,
          entityType: "Recommendation",
          entityId: result.recommendation.id,
          metadata: {
            category: signal.category,
            priority: signal.priority,
            sourceType: signal.sourceType,
            sourceId: signal.sourceId ?? null,
          },
        });
      } else {
        updated++;
      }
    }

    const activeRecommendations = await getActiveRecommendationsForUser(userId);
    const removedRecommendations = activeRecommendations.filter(
      (r) => !activeKeys.has(recommendationKey(r)),
    );

    for (const removed of removedRecommendations) {
      // Las recomendaciones obsoletas se marcan como completadas porque la
      // condición que las generó ya no aplica.
      await prisma.recommendation.update({
        where: { id: removed.id },
        data: { status: "COMPLETED" },
      });
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "COMPLIANCE",
      severity: "INFO",
      event: "recommendations_generated",
      description: `Recomendaciones regeneradas: ${created} creadas, ${updated} actualizadas, ${removedRecommendations.length} resueltas`,
      result: "SUCCESS",
      entityType: "Recommendation",
      entityId: "batch",
      metadata: {
        created,
        updated,
        removed: removedRecommendations.length,
        signalCount: signals.length,
      },
    });

    return {
      ok: true,
      created,
      updated,
      removed: removedRecommendations.length,
    };
  } catch (error) {
    console.error("[recommendations/generate]", error);
    return { ok: false, message: "Error al generar recomendaciones." };
  }
}

async function collectSignals(userId: string): Promise<RecommendationSignal[]> {
  const signals: RecommendationSignal[] = [];

  const now = new Date();

  const [
    latestRiskScore,
    latestSmartScore,
    taxProfile,
    pendingDocumentsCount,
    rejectedDocumentsCount,
    exchangeConnections,
    activeSubscription,
  ] = await prisma.$transaction([
    prisma.taxRiskScore.findFirst({
      where: { userId },
      orderBy: { evaluatedAt: "desc" },
    }),
    prisma.smartTaxScore.findFirst({
      where: { userId },
      orderBy: { evaluatedAt: "desc" },
    }),
    prisma.taxProfile.findUnique({ where: { userId } }),
    prisma.taxDocument.count({
      where: { userId, status: { in: ["DRAFT", "READY_TO_SEND"] } },
    }),
    prisma.taxDocument.count({
      where: { userId, status: "REJECTED" },
    }),
    prisma.exchangeConnection.findMany({ where: { userId } }),
    prisma.billingSubscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { currentPeriodEnd: "desc" },
    }),
  ]);

  const expiredCredentials = await getExpiredSiiCredentials(userId, now);

  if (latestRiskScore && latestRiskScore.score >= 61) {
    signals.push({
      userId,
      category: "RISK",
      sourceType: "TAX_RISK_SCORE",
      sourceId: latestRiskScore.id,
      priority: latestRiskScore.score >= 81 ? "CRITICAL" : "HIGH",
      title: "Tu nivel de riesgo necesita atención",
      description:
        "Revisa las alertas pendientes para reducir posibles problemas futuros.",
      actionLabel: "Revisar alertas",
      actionUrl: "/alertas",
      metadata: { score: latestRiskScore.score, level: latestRiskScore.level },
    });
  }

  if (latestSmartScore && latestSmartScore.score < 41) {
    signals.push({
      userId,
      category: "TRIBUTARY",
      sourceType: "SMART_TAX_SCORE",
      sourceId: latestSmartScore.id,
      priority: "HIGH",
      title: "Tu organización tributaria puede mejorar",
      description:
        "Completa los elementos pendientes para aumentar tu puntuación.",
      actionLabel: "Ver score tributario",
      actionUrl: "/score-tributario",
      metadata: { score: latestSmartScore.score, level: latestSmartScore.level },
    });
  }

  const missingProfileFields = [];
  if (!taxProfile?.rut) missingProfileFields.push("RUT");
  if (!taxProfile?.businessActivity) missingProfileFields.push("Giro");
  if (!taxProfile?.address) missingProfileFields.push("Dirección");
  if (!taxProfile?.dteEmail) missingProfileFields.push("Correo DTE");

  if (missingProfileFields.length > 0) {
    signals.push({
      userId,
      category: "COMPLIANCE",
      sourceType: "TAX_PROFILE_INCOMPLETE",
      priority: "MEDIUM",
      title: "Falta información básica para tu perfil tributario",
      description: `Completar: ${missingProfileFields.join(", ")}.`,
      actionLabel: "Completar perfil",
      actionUrl: "/configuracion/identidad-tributaria",
      metadata: { missingFields: missingProfileFields },
    });
  }

  if (pendingDocumentsCount > 0) {
    signals.push({
      userId,
      category: "TRIBUTARY",
      sourceType: "TAX_DOCUMENT_PENDING",
      priority: "MEDIUM",
      title: "Tienes documentos pendientes de revisión",
      description: `${pendingDocumentsCount} documento(s) esperando envío o confirmación.`,
      actionLabel: "Revisar documentos",
      actionUrl: "/configuracion/documentos",
      metadata: { count: pendingDocumentsCount },
    });
  }

  if (rejectedDocumentsCount > 0) {
    signals.push({
      userId,
      category: "TRIBUTARY",
      sourceType: "TAX_DOCUMENT_REJECTED",
      priority: "CRITICAL",
      title: "Hay documentos rechazados que requieren atención inmediata",
      description: `${rejectedDocumentsCount} documento(s) fue(ron) rechazado(s) por el SII.`,
      actionLabel: "Revisar rechazos",
      actionUrl: "/configuracion/documentos",
      metadata: { count: rejectedDocumentsCount },
    });
  }

  for (const credential of expiredCredentials) {
    signals.push({
      userId,
      category: "COMPLIANCE",
      sourceType: "SII_CERTIFICATE_EXPIRED",
      sourceId: credential.id,
      priority: "HIGH",
      title: "Tu certificado necesita renovación",
      description:
        "El certificado de firma electrónica venció o vence pronto. Renóvalo para seguir operando con el SII.",
      actionLabel: "Renovar certificado",
      actionUrl: "/configuracion/sii",
      metadata: {
        certificateName: credential.certificateName,
        expiresAt: credential.certificateExpires?.toISOString() ?? null,
      },
    });
  }

  for (const connection of exchangeConnections) {
    if (connection.status !== "ACTIVE") {
      signals.push({
        userId,
        category: "CONNECTIONS",
        sourceType: "EXCHANGE_CONNECTION_INACTIVE",
        sourceId: connection.id,
        priority: connection.status === "DISCONNECTED" ? "MEDIUM" : "HIGH",
        title: `Tu conexión ${connection.exchange} está desconectada`,
        description:
          "Reconéctala para mantener tus registros actualizados.",
        actionLabel: "Ir a conexiones",
        actionUrl: "/conexiones",
        metadata: {
          exchange: connection.exchange,
          status: connection.status,
        },
      });
    }
  }

  if (activeSubscription?.currentPeriodEnd) {
    const daysUntilExpiration = Math.ceil(
      (new Date(activeSubscription.currentPeriodEnd).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
      signals.push({
        userId,
        category: "BILLING",
        sourceType: "SUBSCRIPTION_NEAR_EXPIRATION",
        sourceId: activeSubscription.id,
        priority: daysUntilExpiration <= 1 ? "CRITICAL" : "HIGH",
        title: "Tu plan está próximo a vencer",
        description: `Tu suscripción vence en ${daysUntilExpiration} día(s).`,
        actionLabel: "Gestionar plan",
        actionUrl: "/configuracion/facturacion",
        metadata: {
          expiresAt: activeSubscription.currentPeriodEnd.toISOString(),
          daysUntilExpiration,
        },
      });
    }
  }

  return signals;
}

async function getExpiredSiiCredentials(userId: string, now: Date) {
  const profile = await prisma.taxProfile.findUnique({
    where: { userId },
    select: { rut: true },
  });

  if (!profile?.rut) {
    return [];
  }

  const credentials = await prisma.siiCredential.findMany({
    where: {
      issuerRut: profile.rut,
      isActive: true,
      OR: [
        { certificateExpires: { lt: now } },
        {
          certificateExpires: {
            lt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
          },
        },
      ],
    },
  });

  // Solo consideramos vencidos los que ya expiraron o vencen en <= 7 días
  // para mantener el mensaje accionable y no saturar con avisos lejanos.
  return credentials.filter((c) => {
    if (!c.certificateExpires) return false;
    const daysUntil = Math.ceil(
      (c.certificateExpires.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysUntil <= 7;
  });
}

function mapPriorityToSeverity(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "ERROR";
    case "MEDIUM":
      return "WARNING";
    case "LOW":
    default:
      return "INFO";
  }
}


function mapPriorityToTimelineSeverity(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "INFO" | "WARNING" | "ERROR" | "CRITICAL" {
  switch (priority) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "WARNING";
    case "MEDIUM":
      return "INFO";
    case "LOW":
    default:
      return "INFO";
  }
}
