import { prisma } from "@/lib/prisma";
import { createAlert } from "@/modules/alerts/application/createAlert";
import type { TaxRiskBreakdownItem, TaxRiskLevel } from "@/modules/risk/domain/risk";
import {
  capScore,
  resolveTaxRiskLevel,
} from "@/modules/risk/domain/risk";
import { saveTaxRiskScore } from "@/modules/risk/infrastructure/taxRiskScoreRepository";

export type CalculateTaxRiskScoreResult =
  | { ok: true; score: number; level: TaxRiskLevel; breakdown: TaxRiskBreakdownItem[] }
  | { ok: false; message: string };

export async function calculateTaxRiskScore(
  userId: string,
): Promise<CalculateTaxRiskScoreResult> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscription_expires_at: true,
    },
  });

  if (!user) {
    return { ok: false, message: "Usuario no encontrado." };
  }

  const [
    openAlerts,
    taxProfile,
    taxDocuments,
    siiCredential,
    unclassifiedMovements,
    failedConnections,
    failedImports,
  ] = await Promise.all([
    prisma.alert.groupBy({
      by: ["severity"],
      where: { userId, status: "OPEN" },
      _count: { severity: true },
    }),
    prisma.taxProfile.findUnique({ where: { userId } }),
    prisma.taxDocument.groupBy({
      by: ["status"],
      where: { userId, status: { in: ["DRAFT", "READY_TO_SEND", "REJECTED"] } },
      _count: { status: true },
    }),
    prisma.siiCredential.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.portfolioMovement.count({
      where: {
        userId,
        OR: [{ suggestedTaxCategory: "UNCLASSIFIED" }, { appliedTaxCategory: null }],
      },
    }),
    prisma.exchangeConnection.count({
      where: { userId, status: { not: "ACTIVE" } },
    }),
    prisma.exchangeImportRecord.count({
      where: { userId, status: { in: ["FAILED", "PARTIAL"] } },
    }),
  ]);

  const breakdown: TaxRiskBreakdownItem[] = [];

  // Alertas abiertas: CRITICAL=10, HIGH=6, MEDIUM=3, LOW=1, cap 25
  const alertScore = capScore(
    openAlerts.reduce((sum, group) => {
      const points =
        group.severity === "CRITICAL"
          ? 10
          : group.severity === "HIGH"
            ? 6
            : group.severity === "MEDIUM"
              ? 3
              : 1;
      return sum + group._count.severity * points;
    }, 0),
    25,
  );
  breakdown.push({
    factor: "ALERTS",
    score: alertScore,
    maxScore: 25,
    label: "Alertas abiertas",
    message:
      alertScore === 0
        ? "No hay alertas abiertas."
        : `Hay alertas abiertas que suman ${alertScore} puntos de riesgo.`,
  });

  // Perfil tributario: sin perfil 15, no validado 10, validado 0
  const profileScore = taxProfile
    ? taxProfile.isValidated
      ? 0
      : 10
    : 15;
  breakdown.push({
    factor: "TAX_PROFILE",
    score: profileScore,
    maxScore: 15,
    label: "Perfil tributario",
    message: taxProfile
      ? taxProfile.isValidated
        ? "Perfil tributario validado."
        : "Perfil tributario pendiente de validación."
      : "No existe perfil tributario configurado.",
  });

  // DTE pendientes: DRAFT=3, READY_TO_SEND=4, REJECTED=8, cap 15
  const dteScore = capScore(
    taxDocuments.reduce((sum, group) => {
      const points =
        group.status === "REJECTED" ? 8 : group.status === "READY_TO_SEND" ? 4 : 3;
      return sum + group._count.status * points;
    }, 0),
    15,
  );
  breakdown.push({
    factor: "DTE",
    score: dteScore,
    maxScore: 15,
    label: "DTE pendientes",
    message:
      dteScore === 0
        ? "No hay documentos tributarios pendientes críticos."
        : `Existen documentos tributarios pendientes que suman ${dteScore} puntos.`,
  });

  // SII: no configurado 10, certificado vencido 15, desconectado 12, conectado 0
  const now = new Date();
  let siiScore = 0;
  let siiMessage = "Integración SII conectada.";

  if (!siiCredential) {
    siiScore = 10;
    siiMessage = "No hay credenciales SII configuradas.";
  } else if (!siiCredential.isActive) {
    siiScore = 12;
    siiMessage = "Credencial SII inactiva o desconectada.";
  } else if (
    siiCredential.certificateExpires &&
    siiCredential.certificateExpires.getTime() <= now.getTime()
  ) {
    siiScore = 15;
    siiMessage = "Certificado SII vencido.";
  }

  breakdown.push({
    factor: "SII",
    score: siiScore,
    maxScore: 15,
    label: "Integración SII",
    message: siiMessage,
  });

  // Operaciones sin clasificar: cap 15
  const operationsScore = capScore(unclassifiedMovements * 3, 15);
  breakdown.push({
    factor: "UNCLASSIFIED_OPERATIONS",
    score: operationsScore,
    maxScore: 15,
    label: "Operaciones sin clasificar",
    message:
      operationsScore === 0
        ? "Todas las operaciones tienen clasificación tributaria."
        : `Hay ${unclassifiedMovements} operaciones sin clasificar.`,
  });

  // Conexiones/importaciones: cap 10
  const connectionScore = capScore((failedConnections + failedImports) * 3, 10);
  breakdown.push({
    factor: "CONNECTIONS",
    score: connectionScore,
    maxScore: 10,
    label: "Conexiones e importaciones",
    message:
      connectionScore === 0
        ? "Todas las conexiones e importaciones están activas."
        : `Hay conexiones caídas o importaciones fallidas.`,
  });

  // Suscripción/comercial: cap 5
  let commercialScore = 0;
  if (user.subscription_expires_at) {
    const expiresAt = new Date(user.subscription_expires_at);
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiration <= 7) {
      commercialScore = 5;
    }
  }
  breakdown.push({
    factor: "COMMERCIAL",
    score: commercialScore,
    maxScore: 5,
    label: "Suscripción",
    message:
      commercialScore === 0
        ? "Suscripción activa."
        : "Suscripción vencida o próxima a vencer.",
  });

  const totalScore = capScore(
    breakdown.reduce((sum, item) => sum + item.score, 0),
    100,
  );
  const level = resolveTaxRiskLevel(totalScore);

  await saveTaxRiskScore({ userId, score: totalScore, level, breakdown });

  if (level === "HIGH" || level === "CRITICAL") {
    await createAlert({
      userId,
      category: "TRIBUTARY",
      severity: level === "CRITICAL" ? "CRITICAL" : "HIGH",
      title: `Riesgo tributario ${level === "CRITICAL" ? "crítico" : "alto"} detectado`,
      message: `El score de riesgo tributario es ${totalScore}/100 (${level}). Revisa tu situación tributaria.`,
      source: "tax_risk_engine",
      metadata: { score: totalScore, level, breakdown },
    });
  }

  console.info("[risk]", {
    event: "tax_risk_score_calculated",
    userId,
    score: totalScore,
    level,
  });

  return { ok: true, score: totalScore, level, breakdown };
}
