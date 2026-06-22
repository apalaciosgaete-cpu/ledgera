import { prisma } from "@/lib/prisma";
import type { CreateOrchestrationRunInput, OrchestrationResult } from "@/modules/ai-orchestrator/domain/orchestration";

type Row = {
  id: string;
  userId: string;
  status: string;
  riskUpdated: boolean;
  recommendationsCreated: number;
  automationsCreated: number;
  errors: unknown;
  executedAt: Date;
};

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  status,
  risk_updated AS "riskUpdated",
  recommendations_created AS "recommendationsCreated",
  automations_created AS "automationsCreated",
  errors,
  executed_at AS "executedAt"
`;

export async function saveOrchestrationRun(input: CreateOrchestrationRunInput): Promise<OrchestrationResult> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO ai_orchestration_runs (id, user_id, status, risk_updated, recommendations_created, automations_created, errors, executed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)
     RETURNING ${SELECT_FIELDS}`,
    crypto.randomUUID(),
    input.userId,
    input.status,
    input.riskUpdated ?? false,
    input.recommendationsCreated ?? 0,
    input.automationsCreated ?? 0,
    JSON.stringify(input.errors ?? []),
  );

  return mapRow(rows[0]);
}

export async function listUserOrchestrationRuns(userId: string, limit = 20): Promise<OrchestrationResult[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM ai_orchestration_runs WHERE user_id = $1 ORDER BY executed_at DESC LIMIT ${limit}`,
    userId,
  );
  return rows.map(mapRow);
}

export async function listOrchestrationRuns(limit = 100): Promise<OrchestrationResult[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM ai_orchestration_runs ORDER BY executed_at DESC LIMIT ${limit}`,
  );
  return rows.map(mapRow);
}

function mapRow(row: Row): OrchestrationResult {
  return {
    ...row,
    status: row.status as OrchestrationResult["status"],
    errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
  };
}
