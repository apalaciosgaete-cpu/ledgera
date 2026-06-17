import { prisma } from "@/lib/prisma";
import type { CreateExecutionRequestInput, ExecutionRequest, ExecutionStatus } from "@/modules/execution-engine/domain/execution";

type Row = {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  sourceType: string | null;
  sourceId: string | null;
  payload: unknown;
  result: unknown;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  type,
  title,
  description,
  status,
  source_type AS "sourceType",
  source_id AS "sourceId",
  payload,
  result,
  error,
  created_at AS "createdAt",
  started_at AS "startedAt",
  completed_at AS "completedAt"
`;

export async function createExecutionRequest(input: CreateExecutionRequestInput): Promise<ExecutionRequest> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO execution_requests (id, user_id, type, title, description, status, source_type, source_id, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8::jsonb, CURRENT_TIMESTAMP)
     RETURNING ${SELECT_FIELDS}`,
    crypto.randomUUID(),
    input.userId,
    input.type,
    input.title,
    input.description,
    input.sourceType ?? null,
    input.sourceId ?? null,
    JSON.stringify(input.payload ?? null),
  );
  return mapRow(rows[0]);
}

export async function listUserExecutionRequests(userId: string, limit = 50): Promise<ExecutionRequest[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM execution_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT ${limit}`,
    userId,
  );
  return rows.map(mapRow);
}

export async function getExecutionRequestById(id: string): Promise<ExecutionRequest | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS} FROM execution_requests WHERE id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateExecutionStatus(
  id: string,
  status: ExecutionStatus,
  result?: Record<string, unknown> | null,
  error?: string | null,
): Promise<ExecutionRequest | null> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `UPDATE execution_requests
     SET status = $1,
       result = COALESCE($2::jsonb, result),
       error = $3,
       started_at = CASE WHEN $1 = 'RUNNING' THEN CURRENT_TIMESTAMP ELSE started_at END,
       completed_at = CASE WHEN $1 IN ('COMPLETED', 'FAILED', 'REJECTED') THEN CURRENT_TIMESTAMP ELSE completed_at END
     WHERE id = $4
     RETURNING ${SELECT_FIELDS}`,
    status,
    result ? JSON.stringify(result) : null,
    error ?? null,
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

function mapRow(row: Row): ExecutionRequest {
  return {
    ...row,
    type: row.type as ExecutionRequest["type"],
    status: row.status as ExecutionRequest["status"],
    payload: (row.payload as Record<string, unknown>) ?? null,
    result: (row.result as Record<string, unknown>) ?? null,
  };
}
