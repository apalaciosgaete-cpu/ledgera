import { prisma } from "@/lib/prisma";
import type {
  Alert,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  CreateAlertInput,
} from "@/modules/alerts/domain/alert";

export async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const row = await prisma.alert.create({
    data: {
      userId: input.userId,
      category: input.category,
      severity: input.severity,
      title: input.title,
      message: input.message,
      status: "OPEN",
      metadata: (input.metadata ?? undefined) as unknown as undefined,
      source: input.source ?? null,
    },
  });

  return mapAlert(row);
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const row = await prisma.alert.findUnique({ where: { id } });
  return row ? mapAlert(row) : null;
}

export async function listUserAlerts(
  userId: string,
  filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    category?: AlertCategory;
  },
): Promise<Alert[]> {
  const rows = await prisma.alert.findMany({
    where: {
      userId,
      status: filters?.status,
      severity: filters?.severity,
      category: filters?.category,
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapAlert);
}

export async function listOpenAlerts(filters?: {
  severity?: AlertSeverity;
  category?: AlertCategory;
}): Promise<Alert[]> {
  const rows = await prisma.alert.findMany({
    where: {
      status: "OPEN",
      severity: filters?.severity,
      category: filters?.category,
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return rows.map(mapAlert);
}

export async function acknowledgeAlert(id: string): Promise<Alert | null> {
  const row = await prisma.alert.updateMany({
    where: { id, status: "OPEN" },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });

  if (row.count === 0) {
    return null;
  }

  return getAlertById(id);
}

export async function resolveAlert(id: string): Promise<Alert | null> {
  const row = await prisma.alert.updateMany({
    where: { id, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  if (row.count === 0) {
    return null;
  }

  return getAlertById(id);
}

function mapAlert(row: {
  id: string;
  userId: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  metadata: unknown;
  source: string | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Alert {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as AlertCategory,
    severity: row.severity as AlertSeverity,
    title: row.title,
    message: row.message,
    status: row.status as AlertStatus,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    source: row.source,
    acknowledgedAt: row.acknowledgedAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
