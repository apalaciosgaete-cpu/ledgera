import { prisma } from "@/lib/prisma";
import type { TaxMemoryPattern, UpsertTaxMemoryPatternInput } from "@/modules/tax-memory/domain/taxMemory";

type Row = {
  id: string;
  userId: string;
  category: string;
  title: string;
  description: string;
  strength: string;
  occurrenceCount: number;
  lastSeenAt: Date;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export async function upsertTaxMemoryPattern(input: UpsertTaxMemoryPatternInput): Promise<TaxMemoryPattern> {
  const rows = await prisma.$queryRaw<Row[]>`
    INSERT INTO tax_memory_patterns (id, user_id, category, title, description, strength, occurrence_count, last_seen_at, metadata, created_at, updated_at)
    VALUES (${crypto.randomUUID()}, ${input.userId}, ${input.category}, ${input.title}, ${input.description}, ${input.strength}, ${input.occurrenceCount ?? 1}, CURRENT_TIMESTAMP, ${JSON.stringify(input.metadata ?? null)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, category, title)
    DO UPDATE SET
      description = EXCLUDED.description,
      strength = EXCLUDED.strength,
      occurrence_count = tax_memory_patterns.occurrence_count + EXCLUDED.occurrence_count,
      last_seen_at = CURRENT_TIMESTAMP,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
    RETURNING
      id,
      user_id AS "userId",
      category,
      title,
      description,
      strength,
      occurrence_count AS "occurrenceCount",
      last_seen_at AS "lastSeenAt",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  return mapRow(rows[0]);
}

export async function listUserTaxMemoryPatterns(userId: string, limit = 50): Promise<TaxMemoryPattern[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      id,
      user_id AS "userId",
      category,
      title,
      description,
      strength,
      occurrence_count AS "occurrenceCount",
      last_seen_at AS "lastSeenAt",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM tax_memory_patterns
    WHERE user_id = ${userId}
    ORDER BY strength DESC, occurrence_count DESC, last_seen_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(mapRow);
}

function mapRow(row: Row): TaxMemoryPattern {
  return {
    ...row,
    category: row.category as TaxMemoryPattern["category"],
    strength: row.strength as TaxMemoryPattern["strength"],
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}
