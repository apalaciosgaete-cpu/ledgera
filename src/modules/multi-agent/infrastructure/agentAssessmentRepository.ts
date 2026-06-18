import { prisma } from "@/lib/prisma";
import {
  type AgentAssessment,
  type AgentAssessmentSeverity,
  type SpecializedAgentType,
  type SubjectType,
} from "@/modules/multi-agent/domain/agent";

export interface SaveAssessmentInput {
  userId: string;
  agentType: SpecializedAgentType;
  subjectType: SubjectType;
  subjectId: string;
  severity: AgentAssessmentSeverity;
  confidence: number;
  summary: string;
  recommendation: string;
  metadata: Record<string, unknown> | null;
}

function mapRow(row: Record<string, unknown>): AgentAssessment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    agentType: row.agent_type as SpecializedAgentType,
    subjectType: row.subject_type as SubjectType,
    subjectId: row.subject_id as string,
    severity: row.severity as AgentAssessmentSeverity,
    confidence: Number(row.confidence),
    summary: row.summary as string,
    recommendation: row.recommendation as string,
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
  };
}

export async function saveAssessment(input: SaveAssessmentInput): Promise<AgentAssessment> {
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();

  await prisma.$executeRawUnsafe(
    `INSERT INTO agent_assessments (id, user_id, agent_type, subject_type, subject_id, severity, confidence, summary, recommendation, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::timestamptz)`,
    id,
    input.userId,
    input.agentType,
    input.subjectType,
    input.subjectId,
    input.severity,
    input.confidence,
    input.summary,
    input.recommendation,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now,
  );

  return {
    id,
    userId: input.userId,
    agentType: input.agentType,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity: input.severity,
    confidence: input.confidence,
    summary: input.summary,
    recommendation: input.recommendation,
    metadata: input.metadata,
    createdAt: new Date(now),
  };
}

export async function findAssessmentsBySubject(
  userId: string,
  subjectType: SubjectType,
  subjectId: string,
): Promise<AgentAssessment[]> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, user_id, agent_type, subject_type, subject_id, severity, confidence, summary, recommendation, metadata, created_at
     FROM agent_assessments
     WHERE user_id = $1 AND subject_type = $2 AND subject_id = $3
     ORDER BY created_at DESC`,
    userId,
    subjectType,
    subjectId,
  );
  return rows.map(mapRow);
}

export async function findLatestAssessmentsByUser(
  userId: string,
  limit = 20,
): Promise<AgentAssessment[]> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, user_id, agent_type, subject_type, subject_id, severity, confidence, summary, recommendation, metadata, created_at
     FROM agent_assessments
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    userId,
    limit,
  );
  return rows.map(mapRow);
}

export async function findAssessmentsForExpert(
  filters?: { severity?: string; agentType?: string; userId?: string },
): Promise<AgentAssessment[]> {
  let sql = `SELECT id, user_id, agent_type, subject_type, subject_id, severity, confidence, summary, recommendation, metadata, created_at
     FROM agent_assessments WHERE 1=1`;
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters?.severity) {
    sql += ` AND severity = $${paramIndex++}`;
    params.push(filters.severity);
  }
  if (filters?.agentType) {
    sql += ` AND agent_type = $${paramIndex++}`;
    params.push(filters.agentType);
  }
  if (filters?.userId) {
    sql += ` AND user_id = $${paramIndex++}`;
    params.push(filters.userId);
  }

  sql += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params);
  return rows.map(mapRow);
}
