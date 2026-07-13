import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { recordAuditEvent } from "@/modules/audit/application/recordAuditEvent";
import {
  type TaxCase,
  type TaxCasePriority,
  type TaxCaseStatus,
  type TaxCaseSummary,
  PRIORITY_ORDER,
} from "@/modules/tax-cases/domain/taxCase";
import { analyzeTaxCase, determineInitialStatus } from "@/modules/tax-cases/application/analyzeTaxCase";

const ACTIVE_STATUSES: TaxCaseStatus[] = ["OPEN", "INVESTIGATING", "ACTION_REQUIRED", "WAITING_USER", "WAITING_SII"];

interface TaxonSource {
  title: string;
  description: string;
  sourceType: string;
  sourceId: string | null;
  priority: TaxCasePriority;
}

function buildSourceKey(sourceType: string, sourceId: string | null): string {
  return `${sourceType}::${sourceId ?? "null"}`;
}

function deduplicateAgainstExisting(sources: TaxonSource[], existing: TaxCase[]): TaxonSource[] {
  const existingKeys = new Set(
    existing.map((c) => buildSourceKey(c.sourceType, c.sourceId)),
  );
  return sources.filter((s) => !existingKeys.has(buildSourceKey(s.sourceType, s.sourceId)));
}

async function fetchExistingActiveCases(userId: string): Promise<TaxCase[]> {
  const rows = await prisma.taxCase.findMany({
    where: {
      userId,
      status: { in: ACTIVE_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(mapRowToTaxCase);
}

function mapRowToTaxCase(row: Record<string, unknown>): TaxCase {
  return {
    id: row.id as string,
    userId: row.userId as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as TaxCaseStatus,
    priority: row.priority as TaxCasePriority,
    sourceType: row.sourceType as string,
    sourceId: (row.sourceId as string) ?? null,
    aiSummary: row.aiSummary as string,
    aiRecommendation: row.aiRecommendation as string,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt as string),
  };
}

export async function buildTaxCases(userId: string): Promise<TaxCaseSummary> {
  const [riskScore, rejectedDocs, activeRecommendations] = await Promise.all([
    prisma.taxRiskScore
      .findFirst({ where: { userId }, orderBy: { evaluatedAt: "desc" } })
      .catch(() => null),
    prisma.taxDocument
      .count({ where: { userId, status: "REJECTED" } })
      .catch(() => 0),
    prisma.recommendation
      .findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
      .catch(() => []),
  ]);

  const monitorData = await evaluateMonitoringForCases(userId).catch(() => []);

  const sources: TaxonSource[] = [];

  if (riskScore) {
    const r = riskScore as { id: string; level?: string; score?: number };
    if (r.level === "CRITICAL") {
      sources.push({
        title: "Riesgo tributario crítico",
        description: `LEDGERA detectó un nivel de riesgo crítico (score: ${r.score ?? "?"}). Se requiere revisión inmediata del expediente tributario.`,
        sourceType: "RIESGO_CRITICO",
        sourceId: r.id,
        priority: "CRITICAL",
      });
    } else if (r.level === "HIGH") {
      sources.push({
        title: "Riesgo tributario elevado",
        description: `LEDGERA detectó un nivel de riesgo alto (score: ${r.score ?? "?"}). Recomendamos revisar las señales y tomar acciones preventivas.`,
        sourceType: "RIESGO_CRITICO",
        sourceId: r.id,
        priority: "HIGH",
      });
    }
  }

  if (rejectedDocs > 0) {
    sources.push({
      title: `Documentos tributarios rechazados (${rejectedDocs})`,
      description: `Existen ${rejectedDocs} documento(s) tributario(s) rechazado(s). Deben corregirse y reenviarse para evitar observaciones del SII.`,
      sourceType: "DOCUMENTACION_RECHAZADA",
      sourceId: "rejected-docs",
      priority: "CRITICAL",
    });
  }

  for (const signal of monitorData) {
    sources.push({
      title: signal.title,
      description: signal.description,
      sourceType: signal.sourceType,
      sourceId: signal.sourceId,
      priority: signal.priority as TaxCasePriority,
    });
  }

  if (activeRecommendations.length >= 5) {
    sources.push({
      title: `Múltiples recomendaciones pendientes (${activeRecommendations.length})`,
      description: `Tienes ${activeRecommendations.length} recomendaciones tributarias activas. LEDGERA sugiere revisarlas y priorizarlas.`,
      sourceType: "CUMPLIMIENTO",
      sourceId: "recommendations-bulk",
      priority: "MEDIUM",
    });
  }

  const existing = await fetchExistingActiveCases(userId);
  const newSources = deduplicateAgainstExisting(sources, existing);

  const createdCases: TaxCase[] = [];
  for (const source of newSources) {
    const analysis = analyzeTaxCase(source.sourceType, source.description);
    const status = determineInitialStatus(source.priority);

    const created = await prisma.taxCase
      .create({
        data: {
          userId,
          title: source.title,
          description: source.description,
          status,
          priority: source.priority,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          aiSummary: analysis.summary,
          aiRecommendation: analysis.nextSteps.join("\n"),
        },
      })
      .catch(() => null);

    if (created) {
      createdCases.push(mapRowToTaxCase(created as unknown as Record<string, unknown>));

      await recordAuditEvent({
        userId,
        category: "COMPLIANCE",
        severity: source.priority === "CRITICAL" ? "CRITICAL" : "INFO",
        event: "tax_case_created",
        description: source.title,
        result: "SUCCESS",
        entityType: "TaxCase",
        entityId: created.id,
        metadata: { sourceType: source.sourceType, priority: source.priority },
      }).catch(() => null);
    }
  }

  const allCases = [...existing, ...createdCases].sort((a, b) => {
    const prioDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (prioDiff !== 0) return prioDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    openCount: allCases.filter((c) => c.status === "OPEN" || c.status === "ACTION_REQUIRED").length,
    criticalCount: allCases.filter((c) => c.priority === "CRITICAL").length,
    investigatingCount: allCases.filter((c) => c.status === "INVESTIGATING").length,
    resolvedCount: allCases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
    totalCount: allCases.length,
    items: allCases,
  };
}

async function evaluateMonitoringForCases(
  userId: string,
): Promise<Array<{ title: string; description: string; sourceType: string; sourceId: string; priority: string }>> {
  const signals: Array<{ title: string; description: string; sourceType: string; sourceId: string; priority: string }> = [];

  const pendingTasks = await prisma.task
    .count({ where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } } })
    .catch(() => 0);

  if (pendingTasks >= 15) {
    signals.push({
      title: `Tareas acumuladas (${pendingTasks})`,
      description: `El monitor registró ${pendingTasks} tareas pendientes, lo que indica una carga operativa alta.`,
      sourceType: "CUMPLIMIENTO",
      sourceId: "monitor-tasks",
      priority: "MEDIUM",
    });
  }

  return signals;
}

export async function getTaxCaseById(caseId: string, userId: string): Promise<TaxCase | null> {
  const row = await prisma.taxCase.findFirst({
    where: { id: caseId, userId },
  });
  if (!row) return null;
  return mapRowToTaxCase(row as unknown as Record<string, unknown>);
}

export async function getAllTaxCases(
  userId: string,
  filters?: { status?: string; priority?: string },
): Promise<TaxCaseSummary> {
  const where: Prisma.TaxCaseWhereInput = { userId };
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  const rows = await prisma.taxCase.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const items = rows.map((r) => mapRowToTaxCase(r as unknown as Record<string, unknown>));

  return {
    openCount: items.filter((c) => c.status === "OPEN" || c.status === "ACTION_REQUIRED").length,
    criticalCount: items.filter((c) => c.priority === "CRITICAL").length,
    investigatingCount: items.filter((c) => c.status === "INVESTIGATING").length,
    resolvedCount: items.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
    totalCount: items.length,
    items,
  };
}

export async function getAllTaxCasesExpert(
  filters?: { status?: string; priority?: string; userId?: string },
): Promise<{
  totalUsers: number;
  criticalCount: number;
  openCount: number;
  resolvedCount: number;
  items: TaxCase[];
}> {
  const where: Prisma.TaxCaseWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.userId) where.userId = filters.userId;

  const rows = await prisma.taxCase.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const items = rows.map((r) => mapRowToTaxCase(r as unknown as Record<string, unknown>));
  const uniqueUserIds = new Set(items.map((c) => c.userId));

  return {
    totalUsers: uniqueUserIds.size,
    criticalCount: items.filter((c) => c.priority === "CRITICAL").length,
    openCount: items.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
    resolvedCount: items.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
    items,
  };
}

export async function updateTaxCaseStatus(
  caseId: string,
  userId: string,
  newStatus: TaxCaseStatus,
): Promise<TaxCase | null> {
  const existing = await prisma.taxCase.findFirst({ where: { id: caseId, userId } });
  if (!existing) return null;

  const updated = await prisma.taxCase.update({
    where: { id: caseId },
    data: { status: newStatus },
  });

  const eventName =
    newStatus === "RESOLVED"
      ? "tax_case_resolved"
      : newStatus === "CLOSED"
        ? "tax_case_closed"
        : "tax_case_updated";

  await recordAuditEvent({
    userId,
    category: "COMPLIANCE",
    severity: "INFO",
    event: eventName,
    description: `Caso "${updated.title}" → ${newStatus}`,
    result: "SUCCESS",
    entityType: "TaxCase",
    entityId: caseId,
    metadata: { fromStatus: existing.status, toStatus: newStatus },
  }).catch(() => null);

  return mapRowToTaxCase(updated as unknown as Record<string, unknown>);
}

export async function getTaxCaseByIdExpert(caseId: string): Promise<TaxCase | null> {
  const row = await prisma.taxCase.findFirst({
    where: { id: caseId },
  });
  if (!row) return null;
  return mapRowToTaxCase(row as unknown as Record<string, unknown>);
}

export async function reopenTaxCase(caseId: string, userId: string): Promise<TaxCase | null> {
  const existing = await prisma.taxCase.findFirst({ where: { id: caseId, userId } });
  if (!existing) return null;

  const currentStatus = existing.status as TaxCaseStatus;
  if (currentStatus !== "RESOLVED" && currentStatus !== "CLOSED") {
    return mapRowToTaxCase(existing as unknown as Record<string, unknown>);
  }

  const updated = await prisma.taxCase.update({
    where: { id: caseId },
    data: { status: "OPEN" },
  });

  await recordAuditEvent({
    userId,
    category: "COMPLIANCE",
    severity: "INFO",
    event: "tax_case_reopened",
    description: `Caso "${updated.title}" reabierto (estaba: ${currentStatus})`,
    result: "SUCCESS",
    entityType: "TaxCase",
    entityId: caseId,
    metadata: { fromStatus: currentStatus, toStatus: "OPEN" },
  }).catch(() => null);

  return mapRowToTaxCase(updated as unknown as Record<string, unknown>);
}
