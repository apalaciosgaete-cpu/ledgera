import { prisma } from "@/lib/prisma";
import { createAlert } from "@/modules/alerts/application/createAlert";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import { getLatestTaxRiskScore } from "@/modules/risk/application/getLatestTaxRiskScore";
import { getTaxProfileByUserId } from "@/modules/tax/infrastructure/taxProfileRepository";
import { getActiveCredential } from "@/modules/sii/infrastructure/siiCredentialRepository";
import { getActiveCaf } from "@/modules/sii/infrastructure/siiCafRepository";
import {
  capSmartScore,
  resolveSmartTaxScoreLevel,
  type SmartTaxScoreBreakdownItem,
  type SmartTaxScoreLevel,
} from "@/modules/tax-score/domain/smartTaxScore";
import { saveSmartTaxScore } from "@/modules/tax-score/infrastructure/smartTaxScoreRepository";
import { getLatestSmartTaxScoreByUserId } from "@/modules/tax-score/infrastructure/smartTaxScoreRepository";
import { recordTimelineEvent } from "@/modules/timeline/application/recordTimelineEvent";

const FACTOR_MAX = {
  TAX_IDENTITY: 15,
  DATA_COMPLETENESS: 10,
  CLASSIFICATION_QUALITY: 15,
  ALERT_RESOLUTION: 15,
  DTE_HEALTH: 10,
  SII_READINESS: 10,
  AUDIT_HEALTH: 10,
  RISK_CONTROL: 15,
};

function isNonEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export interface CalculateSmartTaxScoreResult {
  ok: true;
  score: number;
  level: SmartTaxScoreLevel;
  breakdown: SmartTaxScoreBreakdownItem[];
  evaluatedAt: Date;
}

export async function calculateSmartTaxScore(
  userId: string,
): Promise<CalculateSmartTaxScoreResult | { ok: false; message: string }> {
  try {
    const now = new Date();
    const auditWindowStart = subtractDays(now, 30);

    const [
      profile,
      totalMovements,
      unclassifiedMovements,
      totalAlerts,
      resolvedAlerts,
      documentGroups,
      exchangeConnections,
      auditCounts,
      riskScore,
    ] = await Promise.all([
      getTaxProfileByUserId(userId),
      prisma.portfolioMovement.count({ where: { userId, deletedAt: null } }),
      prisma.portfolioMovement.count({
        where: {
          userId,
          deletedAt: null,
          OR: [{ suggestedTaxCategory: "UNCLASSIFIED" }, { appliedTaxCategory: null }],
        },
      }),
      prisma.alert.count({ where: { userId } }),
      prisma.alert.count({ where: { userId, status: "RESOLVED" } }),
      prisma.taxDocument.groupBy({
        by: ["status"],
        where: { userId, status: { in: ["DRAFT", "PENDING", "REJECTED"] } },
        _count: { status: true },
      }),
      prisma.exchangeConnection.findMany({ where: { userId } }),
      prisma.auditEvent.groupBy({
        by: ["severity"],
        where: {
          userId,
          createdAt: { gte: auditWindowStart },
          severity: { in: ["CRITICAL", "ERROR", "WARNING"] },
        },
        _count: { severity: true },
      }),
      getLatestTaxRiskScore(userId),
    ]);

    const breakdown: SmartTaxScoreBreakdownItem[] = [];

    // 1. Tax identity
    const taxIdentityScore = profile?.isValidated ? 15 : profile ? 8 : 0;
    breakdown.push({
      factor: "TAX_IDENTITY",
      score: taxIdentityScore,
      maxScore: FACTOR_MAX.TAX_IDENTITY,
      label: "Identidad tributaria",
      message: profile?.isValidated
        ? "Perfil tributario validado."
        : profile
          ? "Perfil existe pero no está validado."
          : "No existe perfil tributario.",
    });

    // 2. Data completeness
    const profileComplete = profile
      ? isNonEmpty(profile.rut) &&
        isNonEmpty(profile.legalName) &&
        isNonEmpty(profile.address) &&
        isNonEmpty(profile.commune) &&
        isNonEmpty(profile.city) &&
        isNonEmpty(profile.dteEmail)
      : false;
    const hasMovements = totalMovements > 0;
    const hasConnections = exchangeConnections.length > 0;
    const dataCompletenessScore =
      (profileComplete ? 3 : 0) + (hasMovements ? 4 : 0) + (hasConnections ? 3 : 0);
    breakdown.push({
      factor: "DATA_COMPLETENESS",
      score: dataCompletenessScore,
      maxScore: FACTOR_MAX.DATA_COMPLETENESS,
      label: "Completitud de datos",
      message: profileComplete
        ? hasMovements && hasConnections
          ? "Datos completos y conexiones activas."
          : "Faltan movimientos o conexiones."
        : "Perfil tributario incompleto.",
    });

    // 3. Classification quality
    const classifiedMovements = totalMovements - unclassifiedMovements;
    const classificationScore =
      totalMovements === 0 ? 5 : Math.round((classifiedMovements / totalMovements) * FACTOR_MAX.CLASSIFICATION_QUALITY);
    breakdown.push({
      factor: "CLASSIFICATION_QUALITY",
      score: classificationScore,
      maxScore: FACTOR_MAX.CLASSIFICATION_QUALITY,
      label: "Calidad de clasificación",
      message:
        totalMovements === 0
          ? "Sin operaciones registradas."
          : `${classifiedMovements} de ${totalMovements} operaciones clasificadas.`,
    });

    // 4. Alert resolution
    const alertScore = totalAlerts === 0 ? 15 : Math.round((resolvedAlerts / totalAlerts) * FACTOR_MAX.ALERT_RESOLUTION);
    breakdown.push({
      factor: "ALERT_RESOLUTION",
      score: alertScore,
      maxScore: FACTOR_MAX.ALERT_RESOLUTION,
      label: "Resolución de alertas",
      message: totalAlerts === 0 ? "Sin alertas registradas." : `${resolvedAlerts} de ${totalAlerts} alertas resueltas.`,
    });

    // 5. DTE health
    const rejectedCount =
      documentGroups.find((g) => g.status === "REJECTED")?._count.status ?? 0;
    const pendingCount =
      (documentGroups.find((g) => g.status === "DRAFT")?._count.status ?? 0) +
      (documentGroups.find((g) => g.status === "PENDING")?._count.status ?? 0);

    let dteScore = 10;
    let dteMessage = "Sin documentos rechazados ni pendientes.";
    if (rejectedCount > 1) {
      dteScore = 0;
      dteMessage = "Múltiples documentos rechazados.";
    } else if (rejectedCount === 1) {
      dteScore = 3;
      dteMessage = "Un documento rechazado.";
    } else if (pendingCount > 0) {
      dteScore = 7;
      dteMessage = "Documentos pendientes de envío.";
    }
    breakdown.push({
      factor: "DTE_HEALTH",
      score: dteScore,
      maxScore: FACTOR_MAX.DTE_HEALTH,
      label: "Salud DTE",
      message: dteMessage,
    });

    // 6. SII readiness
    let siiScore = 0;
    let siiMessage = "Sin configuración SII.";
    if (profile?.isValidated && profile.rut) {
      const [credential, caf] = await Promise.all([
        getActiveCredential("PRODUCCION", profile.rut),
        getActiveCaf("33"),
      ]);
      const hasCredential = credential !== null;
      const hasCaf = caf !== null && caf.currentFolio <= caf.folioEnd;

      if (hasCredential && hasCaf) {
        siiScore = 10;
        siiMessage = "Credencial activa y CAF disponible.";
      } else if (hasCredential) {
        siiScore = 6;
        siiMessage = "Credencial activa sin CAF disponible.";
      } else if (hasCaf) {
        siiScore = 4;
        siiMessage = "CAF disponible sin credencial activa.";
      }
    } else if (profile) {
      siiMessage = "Perfil no validado; no se puede verificar SII.";
    }
    breakdown.push({
      factor: "SII_READINESS",
      score: siiScore,
      maxScore: FACTOR_MAX.SII_READINESS,
      label: "Preparación SII",
      message: siiMessage,
    });

    // 7. Audit health
    const criticalAudit =
      auditCounts.find((g) => g.severity === "CRITICAL")?._count.severity ?? 0;
    const errorAudit =
      auditCounts.find((g) => g.severity === "ERROR")?._count.severity ?? 0;
    const warningAudit =
      auditCounts.find((g) => g.severity === "WARNING")?._count.severity ?? 0;

    let auditScore = 10;
    let auditMessage = "Sin eventos de auditoría negativos recientes.";
    if (criticalAudit > 0) {
      auditScore = 0;
      auditMessage = "Eventos críticos recientes en auditoría.";
    } else if (errorAudit > 0) {
      auditScore = 3;
      auditMessage = "Errores recientes en auditoría.";
    } else if (warningAudit > 0) {
      auditScore = 6;
      auditMessage = "Advertencias recientes en auditoría.";
    }
    breakdown.push({
      factor: "AUDIT_HEALTH",
      score: auditScore,
      maxScore: FACTOR_MAX.AUDIT_HEALTH,
      label: "Salud de auditoría",
      message: auditMessage,
    });

    // 8. Risk control
    const riskScoreValue = riskScore?.score ?? 100;
    const riskControlScore = riskScore ? Math.round((100 - riskScoreValue) * 0.15) : 0;
    breakdown.push({
      factor: "RISK_CONTROL",
      score: riskControlScore,
      maxScore: FACTOR_MAX.RISK_CONTROL,
      label: "Control de riesgo",
      message: riskScore
        ? `Tax Risk Score ${riskScoreValue}; aporte inverso al Smart Score.`
        : "Sin score de riesgo disponible.",
    });

    const rawScore = breakdown.reduce((sum, item) => sum + item.score, 0);
    const score = capSmartScore(rawScore);
    const level = resolveSmartTaxScoreLevel(score);
    const evaluatedAt = new Date();
    const previousScore = await getLatestSmartTaxScoreByUserId(userId);

    await saveSmartTaxScore({
      userId,
      score,
      level,
      breakdown,
      evaluatedAt,
    });

    if (score < 41) {
      const alertResult = await createAlert({
        userId,
        category: "COMPLIANCE",
        severity: "HIGH",
        title: "Score tributario deficiente",
        message: `El Smart Tax Score es ${score}/100 (${level}). Revisa identidad tributaria, clasificación de operaciones y alertas pendientes.`,
        source: "smart_tax_score",
        metadata: { score, level, breakdown },
      });

      if (!alertResult.ok) {
        console.error("[smart-tax-score] failed to create deficient score alert", alertResult.message);
      }
    }

    await recordAuditEvent({
      userId,
      actorId: userId,
      category: "TAX",
      severity: "INFO",
      event: "smart_tax_score_calculated",
      description: `Smart Tax Score calculado: ${score}/100 (${level})`,
      result: "SUCCESS",
      entityType: "SmartTaxScore",
      entityId: userId,
      metadata: { score, level, breakdown },
    });

    await recordTimelineEvent({
      userId,
      category: "SMART_SCORE",
      severity: level === "OPTIMAL" ? "SUCCESS" : level === "HEALTHY" ? "INFO" : "WARNING",
      title: "Smart Tax Score actualizado",
      description: `Tu Smart Tax Score es ${score}/100 (${level}).`,
      entityType: "SmartTaxScore",
      entityId: userId,
      metadata: { score, level, previousLevel: previousScore?.level ?? null },
    });

    if (previousScore && previousScore.level !== level) {
      await recordTimelineEvent({
        userId,
        category: "SMART_SCORE",
        severity: level === "OPTIMAL" ? "SUCCESS" : level === "HEALTHY" ? "INFO" : "WARNING",
        title: "Nivel de Smart Tax Score cambió",
        description: `Tu nivel cambió de ${previousScore.level} a ${level}.`,
        entityType: "SmartTaxScore",
        entityId: userId,
        metadata: { previousLevel: previousScore.level, newLevel: level, score },
      });
    }

    console.info("[tax-score]", {
      event: "smart_tax_score_calculated",
      userId,
      score,
      level,
      evaluatedAt: evaluatedAt.toISOString(),
    });

    return { ok: true, score, level, breakdown, evaluatedAt };
  } catch (error) {
    console.error("[calculateSmartTaxScore]", error);
    return { ok: false, message: "Error al calcular Smart Tax Score." };
  }
}
