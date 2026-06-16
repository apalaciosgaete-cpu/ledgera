import { prisma } from "@/lib/prisma";
import type { AgentPlan, AgentPlanStatus, AgentStep, CreateAgentPlanInput } from "@/modules/agent/domain/agent";

type Row = {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  expectedImpact: string;
  sourceType: string | null;
  sourceId: string | null;
  steps: unknown;
  metadata: unknown;
  createdAt: Date;
  approvedAt: Date | null;
  executedAt: Date | null;
  completedAt: Date | null;
};

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  title,
  description,
  priority,
  status,
  expected_impact AS "expectedImpact",
  source_type AS "sourceType",
  source_id AS "sourceId",
  steps,
  metadata,
  created_at AS "createdAt",
  approved_at AS "approvedAt",
  executed_at AS "executedAt",
  completed_at AS "completedAt"
`;

export async function createAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan> {
  const steps: AgentStep[] = input.steps.map((step) => ({
    ...step,
    id: crypto.randomUUID(),
    status: "PENDING",
  }));

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO agent_plans (id, user_id, title, description, priority, status, expected_impact, source_type, source_id, steps, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, 'PROPOSED', $6, $7, $8, $9::jsonb, $10::jsonb, CURRENT_TIMESTAMP)
     RETURNING ${SELECT_FIELDS}`,
    crypto.randomUUID(),
    input.userId,
    input.title,
    input.description,
    input.priority,
    input.expectedImpact,
    input.sourceType ?? null,
    input.sourceId ?? null,
    JSON.stringify(steps),
    JSON.stringify(input.metadata ?? null),
  );

  return mapRow(rows[0]);
}

export async function listUserAgentPlans(userId: string, status?: AgentPlanStatus): Promise<AgentPlan[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS}
     FROM agent_plans
     WHERE user_id = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC`,
    userId,
    status ?? null,
  );

  return rows.map(mapRow);
}

export async function getAgentPlanById(id: string): Promise<AgentPlan | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM agent_plans WHERE id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateAgentPlanStatus(id: string, status: AgentPlanStatus): Promise<AgentPlan | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE agent_plans
     SET status = $1,
       approved_at = CASE WHEN $1 = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE approved_at END,
       executed_at = CASE WHEN $1 = 'EXECUTING' THEN CURRENT_TIMESTAMP ELSE executed_at END,
       completed_at = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END,
       rejected_at = CASE WHEN $1 = 'REJECTED' THEN CURRENT_TIMESTAMP ELSE rejected_at END
     WHERE id = $2
     RETURNING ${SELECT_FIELDS}`,
    status,
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function completeAgentPlanSteps(id: string, steps: AgentStep[]): Promise<AgentPlan | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE agent_plans SET steps = $1::jsonb, status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING ${SELECT_FIELDS}`,
    JSON.stringify(steps),
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

function mapRow(row: Row): AgentPlan {
  return {
    ...row,
    priority: row.priority as AgentPlan["priority"],
    status: row.status as AgentPlan["status"],
    steps: Array.isArray(row.steps) ? (row.steps as AgentStep[]) : [],
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}
