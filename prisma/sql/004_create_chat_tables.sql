-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id           TEXT PRIMARY KEY,
  "userId"     TEXT,
  "sessionId"  TEXT UNIQUE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN',
  "guestName"  TEXT,
  "guestEmail" TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user   ON chat_conversations ("userId");
CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON chat_conversations (status);
CREATE INDEX IF NOT EXISTS idx_chat_conv_created ON chat_conversations ("createdAt");

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id               TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender           TEXT NOT NULL,
  content          TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "readAt"         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv    ON chat_messages ("conversationId");
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages ("createdAt");

-- Push subscriptions for admin notifications
CREATE TABLE IF NOT EXISTS chat_push_subscriptions (
  id        TEXT PRIMARY KEY,
  endpoint  TEXT UNIQUE NOT NULL,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
