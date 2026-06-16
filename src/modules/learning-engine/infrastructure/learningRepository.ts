import { prisma } from "@/lib/prisma";
import type { CreateLearningEventInput, LearningEvent } from "@/modules/learning-engine/domain/learning";

type Row = {
  id: string;
  userId: string;
  eventType: string;
  sourceModule: string;
  outcome: string;
  scoreImpact: number | null;
  metadata: unknown;
  createdAt: Date;
};

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  event_type AS "eventType",
  source_module AS "sourceModule",
  outcome,
  score_impact AS "scoreImpact",
  metadata,
  created_at AS "createdAt"
`;

export async function createLearningEvent(input: CreateLearningEventInput): Promise<LearningEvent> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO learning_events (id, user_id, event_type, source_module, outcome, score_impact, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)
     RETURNING ${SELECT_FIELDS}`,
    crypto.randomUUID(),
    input.userId,
    input.eventType,
    input.sourceModule,
    input.outcome,
    input.scoreImpact ?? null,
    JSON.stringify(input.metadata ?? null),
  );

  return mapRow(rows[0]);
}

export async function listUserLearningEvents(userId: string, limit = 200): Promise<LearningEvent[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT ${SELECT_FIELDS}
     FROM learning_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    userId,
  );

  return rows.map(mapRow);
}

export async function countLearningEvents(userId: string, eventType?: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count
     FROM learning_events
     WHERE user_id = $1 AND ($2::text IS NULL OR event_type = $2)`,
    userId,
    eventType ?? null,
  );

  return Number(rows[0]?.count ?? 0);
}

function mapRow(row: Row): LearningEvent {
  return {
    ...row,
    eventType: row.eventType as LearningEvent["eventType"],
    outcome: row.outcome as LearningEvent["outcome"],
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}
