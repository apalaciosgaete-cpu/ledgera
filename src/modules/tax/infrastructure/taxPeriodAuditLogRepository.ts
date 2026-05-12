// src/modules/tax/infrastructure/taxPeriodAuditLogRepository.ts
import { prisma } from "@/lib/prisma";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TaxPeriodAuditAction = "CLOSE" | "REOPEN";

type CreateTaxPeriodAuditLogInput = {
  year:        number;
  action:      TaxPeriodAuditAction;
  reason?:     string | null;
  actorId?:    string | null;
  actorEmail?: string | null;
  metadata?:   Record<string, unknown> | null;
};

export interface TaxPeriodAuditLogEntry {
  id:         string;
  year:       number;
  action:     TaxPeriodAuditAction;
  reason:     string | null;
  actorId:    string | null;
  actorEmail: string | null;
  metadata:   string | null;
  createdAt:  Date;
}

// ── Crear registro ────────────────────────────────────────────────────────────

export async function createTaxPeriodAuditLog(
  input: CreateTaxPeriodAuditLogInput,
): Promise<TaxPeriodAuditLogEntry> {
  const createdAt   = new Date();
  const metadataStr = input.metadata ? JSON.stringify(input.metadata) : null;

  const raw = await prisma.taxPeriodAuditLog.create({
    data: {
      year:       input.year,
      action:     input.action,
      reason:     input.reason     ?? null,
      actorId:    input.actorId    ?? null,
      actorEmail: input.actorEmail ?? null,
      metadata:   metadataStr,
      createdAt,
    },
  });

  return {
    ...raw,
    action: raw.action as TaxPeriodAuditAction,
  };
}

// ── Listar por año ────────────────────────────────────────────────────────────

export async function listTaxPeriodAuditLogsByYear(
  year: number,
): Promise<TaxPeriodAuditLogEntry[]> {
  const rows = await prisma.taxPeriodAuditLog.findMany({
    where:   { year },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((raw) => ({
    ...raw,
    action: raw.action as TaxPeriodAuditAction,
  }));
}