import { prisma } from "@/lib/prisma";
import { resolveTaxFileStatus, type TaxFileListItem } from "@/modules/tax-file/domain/taxFile";

export type ListTaxFilesResult =
  | { ok: true; files: TaxFileListItem[] }
  | { ok: false; message: string };

export async function listTaxFiles(filters?: {
  status?: "HEALTHY" | "ATTENTION_REQUIRED" | "HIGH_RISK" | "CRITICAL";
  riskLevel?: string;
  plan?: string;
  limit?: number;
}): Promise<ListTaxFilesResult> {
  try {
    const users = await prisma.users.findMany({
      where: {
        status: "active",
        ...(filters?.plan ? { subscription_plan: filters.plan } : {}),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        subscription_plan: true,
      },
      take: filters?.limit ?? 100,
      orderBy: { created_at: "desc" },
    });

    const files: TaxFileListItem[] = [];
    const now = new Date();

    for (const user of users) {
      const [
        latestRiskScore,
        latestSmartScore,
        openAlerts,
        criticalAlerts,
        pendingTasks,
        rejectedDocuments,
      ] = await prisma.$transaction([
        prisma.taxRiskScore.findFirst({
          where: { userId: user.id },
          orderBy: { evaluatedAt: "desc" },
        }),
        prisma.smartTaxScore.findFirst({
          where: { userId: user.id },
          orderBy: { evaluatedAt: "desc" },
        }),
        prisma.alert.count({ where: { userId: user.id, status: "OPEN" } }),
        prisma.alert.count({
          where: { userId: user.id, status: "OPEN", severity: "CRITICAL" },
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        }),
        prisma.taxDocument.count({
          where: { userId: user.id, status: "REJECTED" },
        }),
      ]);

      const status = resolveTaxFileStatus({
        riskLevel: latestRiskScore?.level ?? null,
        criticalOverdueTasks: 0,
        rejectedDocuments,
        openCriticalAlerts: criticalAlerts,
        smartScoreLevel: latestSmartScore?.level ?? null,
        openAlerts,
        pendingTasks,
        profileValidated: false,
      });

      if (filters?.status && filters.status !== status) {
        continue;
      }

      if (filters?.riskLevel && latestRiskScore?.level !== filters.riskLevel) {
        continue;
      }

      files.push({
        userId: user.id,
        userEmail: user.email,
        userName: user.full_name,
        status,
        riskScore: latestRiskScore?.score ?? null,
        riskLevel: latestRiskScore?.level ?? null,
        smartScore: latestSmartScore?.score ?? null,
        smartLevel: latestSmartScore?.level ?? null,
        openAlerts,
        pendingTasks,
        plan: user.subscription_plan ?? "BASICO",
        generatedAt: now,
      });
    }

    return { ok: true, files };
  } catch (error) {
    console.error("[tax-file/listTaxFiles]", error);
    return { ok: false, message: "Error al listar expedientes tributarios." };
  }
}
