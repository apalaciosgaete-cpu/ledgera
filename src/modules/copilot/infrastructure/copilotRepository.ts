import { prisma } from "@/lib/prisma";
import type { CopilotConversation, CopilotMessage, CopilotRole } from "@/modules/copilot/domain/copilot";

type ConversationRow = {
  id: string;
  userId: string;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type MessageRow = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  metadata: unknown;
  createdAt: Date;
};

export async function createConversation(userId: string, title: string): Promise<CopilotConversation> {
  const rows = await prisma.$queryRawUnsafe<ConversationRow[]>(
    `INSERT INTO copilot_conversations (id, user_id, title, last_message_at, created_at, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, user_id AS "userId", title, last_message_at AS "lastMessageAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    crypto.randomUUID(),
    userId,
    title,
  );
  return rows[0];
}

export async function getConversationById(id: string): Promise<CopilotConversation | null> {
  const rows = await prisma.$queryRawUnsafe<ConversationRow[]>(
    `SELECT id, user_id AS "userId", title, last_message_at AS "lastMessageAt", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM copilot_conversations WHERE id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ?? null;
}

export async function listUserConversations(userId: string, limit = 20): Promise<CopilotConversation[]> {
  return prisma.$queryRawUnsafe<ConversationRow[]>(
    `SELECT id, user_id AS "userId", title, last_message_at AS "lastMessageAt", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM copilot_conversations WHERE user_id = $1 ORDER BY last_message_at DESC LIMIT ${limit}`,
    userId,
  );
}

export async function addMessage(
  conversationId: string,
  role: CopilotRole,
  content: string,
  metadata?: Record<string, unknown> | null,
): Promise<CopilotMessage> {
  const rows = await prisma.$queryRawUnsafe<MessageRow[]>(
    `INSERT INTO copilot_messages (id, conversation_id, role, content, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, CURRENT_TIMESTAMP)
     RETURNING id, conversation_id AS "conversationId", role, content, metadata, created_at AS "createdAt"`,
    crypto.randomUUID(),
    conversationId,
    role,
    content,
    JSON.stringify(metadata ?? null),
  );

  await prisma.$executeRawUnsafe(
    `UPDATE copilot_conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    conversationId,
  );

  return mapMessage(rows[0]);
}

export async function listConversationMessages(conversationId: string): Promise<CopilotMessage[]> {
  const rows = await prisma.$queryRawUnsafe<MessageRow[]>(
    `SELECT id, conversation_id AS "conversationId", role, content, metadata, created_at AS "createdAt"
     FROM copilot_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    conversationId,
  );
  return rows.map(mapMessage);
}

function mapMessage(row: MessageRow): CopilotMessage {
  return {
    ...row,
    role: row.role as CopilotRole,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}
