import { prisma } from "@/lib/prisma";
import type {
  CreateDocumentInput,
  Document,
  DocumentCategory,
  DocumentStatus,
  DocumentType,
} from "@/modules/documents/domain/document";

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const row = await prisma.document.create({
    data: {
      userId: input.userId,
      category: input.category,
      type: input.type,
      status: "ACTIVE",
      name: input.name,
      description: input.description ?? null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKey: input.storageKey,
      checksum: input.checksum ?? null,
      tags: input.tags as unknown as undefined,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      uploadedBy: input.uploadedBy ?? null,
    },
  });

  return mapDocument(row);
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const row = await prisma.document.findUnique({ where: { id } });
  return row ? mapDocument(row) : null;
}

export async function listUserDocuments(
  userId: string,
  filters?: {
    category?: DocumentCategory;
    status?: DocumentStatus;
    type?: DocumentType;
    relatedEntityType?: string;
    relatedEntityId?: string;
  },
): Promise<Document[]> {
  const rows = await prisma.document.findMany({
    where: {
      userId,
      category: filters?.category,
      status: filters?.status,
      type: filters?.type,
      relatedEntityType: filters?.relatedEntityType,
      relatedEntityId: filters?.relatedEntityId,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return rows.map(mapDocument);
}

export async function listDocuments(filters?: {
  userId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  type?: DocumentType;
  limit?: number;
}): Promise<Document[]> {
  const rows = await prisma.document.findMany({
    where: {
      userId: filters?.userId,
      category: filters?.category,
      status: filters?.status,
      type: filters?.type,
    },
    orderBy: [{ createdAt: "desc" }],
    take: filters?.limit,
  });

  return rows.map(mapDocument);
}

export async function updateDocument(
  id: string,
  input: Partial<Pick<Document, "name" | "description" | "tags" | "category" | "relatedEntityType" | "relatedEntityId">>,
): Promise<Document | null> {
  try {
    const row = await prisma.document.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags as unknown as undefined } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.relatedEntityType !== undefined ? { relatedEntityType: input.relatedEntityType } : {}),
        ...(input.relatedEntityId !== undefined ? { relatedEntityId: input.relatedEntityId } : {}),
      },
    });

    return mapDocument(row);
  } catch {
    return null;
  }
}

export async function updateDocumentStatus(id: string, status: DocumentStatus): Promise<Document | null> {
  try {
    const row = await prisma.document.update({
      where: { id },
      data: { status },
    });

    return mapDocument(row);
  } catch {
    return null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  return !!(await updateDocumentStatus(id, "DELETED"));
}

export async function countDocuments(filters?: {
  userId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  createdAfter?: Date;
}): Promise<number> {
  return prisma.document.count({
    where: {
      userId: filters?.userId,
      category: filters?.category,
      status: filters?.status,
      createdAt: filters?.createdAfter ? { gte: filters.createdAfter } : undefined,
    },
  });
}

export async function getDocumentMetrics(userId: string): Promise<{
  total: number;
  tax: number;
  pendingReview: number;
  last30Days: number;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, tax, pendingReview, last30Days] = await Promise.all([
    prisma.document.count({ where: { userId, status: { not: "DELETED" } } }),
    prisma.document.count({ where: { userId, status: { not: "DELETED" }, category: "TAX" } }),
    prisma.document.count({ where: { userId, status: "ACTIVE", category: "TAX" } }),
    prisma.document.count({ where: { userId, status: { not: "DELETED" }, createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return { total, tax, pendingReview: tax - pendingReview < 0 ? 0 : tax - pendingReview, last30Days };
}

function mapDocument(row: {
  id: string;
  userId: string;
  category: string;
  type: string;
  status: string;
  name: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  checksum: string | null;
  tags: unknown;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Document {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as DocumentCategory,
    type: row.type as DocumentType,
    status: row.status as DocumentStatus,
    name: row.name,
    description: row.description,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    storageKey: row.storageKey,
    checksum: row.checksum,
    tags: (row.tags as string[]) ?? [],
    relatedEntityType: row.relatedEntityType,
    relatedEntityId: row.relatedEntityId,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
