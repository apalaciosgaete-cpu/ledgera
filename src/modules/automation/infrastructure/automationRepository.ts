import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type {
  AutomationProposal,
  AutomationProposalFilters,
  AutomationType,
  CreateAutomationProposalInput,
} from "@/modules/automation/domain/automation";

type Row = {
  id: string;
  userId: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  status: string;
  metadata: unknown;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  executedAt: Date | null;
  failureReason: string | null;
};

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  type,
  priority,
  title,
  description,
  source_entity AS "sourceEntity",
  source_entity_id AS "sourceEntityId",
  status,
  metadata,
  created_at AS "createdAt",
  approved_at AS "approvedAt",
  approved_by AS "approvedBy",
  rejected_at AS "rejectedAt",
  rejected_by AS "rejectedBy",
  executed_at AS "executedAt",
  failure_reason AS "failureReason"
`;

export async function createProposal(input: CreateAutomationProposalInput): Promise<AutomationProposal> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO automation_proposals (id, user_id, type, priority, title, description, source_entity, source_entity_id, status, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PROPOSED', $9::jsonb, CURRENT_TIMESTAMP)
     RETURNING ${SELECT_FIELDS}`,
    crypto.randomUUID(),
    input.userId,
    input.type,
    input.priority ?? "MEDIUM",
    input.title,
    input.description,
    input.sourceEntity ?? null,
    input.sourceEntityId ?? null,
    JSON.stringify(input.metadata ?? null),
  );

  return mapProposal(rows[0]);
}

export async function findActiveProposalBySource(
  userId: string,
  type: AutomationType,
  sourceEntity?: string | null,
  sourceEntityId?: string | null,
): Promise<AutomationProposal | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM automation_proposals
     WHERE user_id = $1 AND type = $2
       AND source_entity IS NOT DISTINCT FROM $3
       AND source_entity_id IS NOT DISTINCT FROM $4
       AND status = 'PROPOSED'
     LIMIT 1`,
    userId,
    type,
    sourceEntity ?? null,
    sourceEntityId ?? null,
  );

  return rows[0] ? mapProposal(rows[0]) : null;
}

export async function getProposalById(id: string): Promise<AutomationProposal | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM automation_proposals WHERE id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ? mapProposal(rows[0]) : null;
}

export async function listUserProposals(userId: string, filters?: AutomationProposalFilters): Promise<AutomationProposal[]> {
  return listProposals({ ...filters, userId });
}

export async function listProposals(filters?: AutomationProposalFilters): Promise<AutomationProposal[]> {
  const limit = filters?.limit && filters.limit > 0 ? filters.limit : 100;
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM automation_proposals
     WHERE ($1::text IS NULL OR user_id = $1)
       AND ($2::text IS NULL OR status = $2)
       AND ($3::text IS NULL OR type = $3)
       AND ($4::text IS NULL OR priority = $4)
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    filters?.userId ?? null,
    filters?.status ?? null,
    filters?.type ?? null,
    filters?.priority ?? null,
  );
  return rows.map(mapProposal);
}

export async function approveProposal(id: string, approvedBy: string): Promise<AutomationProposal | null> {
  return updateProposal(id, "APPROVED", "approved_at = CURRENT_TIMESTAMP, approved_by = $2", approvedBy);
}

export async function rejectProposal(id: string, rejectedBy: string): Promise<AutomationProposal | null> {
  return updateProposal(id, "REJECTED", "rejected_at = CURRENT_TIMESTAMP, rejected_by = $2", rejectedBy);
}

export async function markExecuted(id: string): Promise<AutomationProposal | null> {
  return updateProposal(id, "EXECUTED", "executed_at = CURRENT_TIMESTAMP, failure_reason = NULL");
}

export async function markFailed(id: string, reason: string): Promise<AutomationProposal | null> {
  return updateProposal(id, "FAILED", "failure_reason = $2", reason);
}

async function updateProposal(id: string, status: string, extraSet: string, value?: string): Promise<AutomationProposal | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE automation_proposals SET status = $1, ${extraSet} WHERE id = ${value === undefined ? "$2" : "$3"} RETURNING ${SELECT_FIELDS}`,
    ...(value === undefined ? [status, id] : [status, value, id]),
  );
  return rows[0] ? mapProposal(rows[0]) : null;
}

function mapProposal(row: Row): AutomationProposal {
  return {
    ...row,
    type: row.type as AutomationProposal["type"],
    priority: row.priority as AutomationProposal["priority"],
    status: row.status as AutomationProposal["status"],
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}
