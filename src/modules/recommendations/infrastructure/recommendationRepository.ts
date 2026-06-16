import { prisma } from "@/lib/prisma";
import type {
  CreateRecommendationInput,
  Recommendation,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationStatus,
} from "@/modules/recommendations/domain/recommendation";

export async function createRecommendation(
  input: CreateRecommendationInput,
): Promise<Recommendation> {
  const row = await prisma.recommendation.create({
    data: {
      userId: input.userId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
      actionLabel: input.actionLabel,
      actionUrl: input.actionUrl,
      status: "ACTIVE",
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      metadata: (input.metadata ?? undefined) as unknown as undefined,
    },
  });

  return mapRecommendation(row);
}

export async function getRecommendationById(id: string): Promise<Recommendation | null> {
  const row = await prisma.recommendation.findUnique({ where: { id } });
  return row ? mapRecommendation(row) : null;
}

export async function listUserRecommendations(
  userId: string,
  filters?: {
    status?: RecommendationStatus;
    category?: RecommendationCategory;
    priority?: RecommendationPriority;
  },
): Promise<Recommendation[]> {
  const rows = await prisma.recommendation.findMany({
    where: {
      userId,
      status: filters?.status,
      category: filters?.category,
      priority: filters?.priority,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return rows.map(mapRecommendation);
}

export async function listRecommendations(filters?: {
  status?: RecommendationStatus;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  userId?: string;
  limit?: number;
}): Promise<Recommendation[]> {
  const rows = await prisma.recommendation.findMany({
    where: {
      status: filters?.status,
      category: filters?.category,
      priority: filters?.priority,
      userId: filters?.userId,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: filters?.limit,
  });

  return rows.map(mapRecommendation);
}

export async function getActiveRecommendationsForUser(userId: string): Promise<Recommendation[]> {
  const rows = await prisma.recommendation.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return rows.map(mapRecommendation);
}

export async function findActiveRecommendationBySource(
  userId: string,
  sourceType: string,
  sourceId?: string | null,
): Promise<Recommendation | null> {
  const row = await prisma.recommendation.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      sourceType,
      sourceId: sourceId ?? null,
    },
  });

  return row ? mapRecommendation(row) : null;
}

export async function upsertRecommendation(
  input: CreateRecommendationInput,
): Promise<{ recommendation: Recommendation; isNew: boolean }> {
  const existing = await findActiveRecommendationBySource(
    input.userId,
    input.sourceType,
    input.sourceId,
  );

  if (existing) {
    const row = await prisma.recommendation.update({
      where: { id: existing.id },
      data: {
        category: input.category,
        priority: input.priority,
        title: input.title,
        description: input.description,
        actionLabel: input.actionLabel,
        actionUrl: input.actionUrl,
        metadata: (input.metadata ?? undefined) as unknown as undefined,
      },
    });

    return { recommendation: mapRecommendation(row), isNew: false };
  }

  const created = await createRecommendation(input);
  return { recommendation: created, isNew: true };
}

export async function dismissRecommendation(id: string): Promise<Recommendation | null> {
  try {
    const row = await prisma.recommendation.update({
      where: { id, status: "ACTIVE" },
      data: { status: "DISMISSED" },
    });

    return mapRecommendation(row);
  } catch {
    return null;
  }
}

export async function completeRecommendation(id: string): Promise<Recommendation | null> {
  try {
    const row = await prisma.recommendation.update({
      where: { id, status: "ACTIVE" },
      data: { status: "COMPLETED" },
    });

    return mapRecommendation(row);
  } catch {
    return null;
  }
}

export async function deleteRecommendation(id: string): Promise<boolean> {
  try {
    await prisma.recommendation.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

function mapRecommendation(row: {
  id: string;
  userId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  status: string;
  sourceType: string;
  sourceId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Recommendation {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as RecommendationCategory,
    priority: row.priority as RecommendationPriority,
    title: row.title,
    description: row.description,
    actionLabel: row.actionLabel,
    actionUrl: row.actionUrl,
    status: row.status as RecommendationStatus,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
