CREATE TABLE IF NOT EXISTS copilot_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT copilot_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id)
    REFERENCES copilot_conversations(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS copilot_conversations_user_id_idx ON copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS copilot_conversations_last_message_at_idx ON copilot_conversations(last_message_at);
CREATE INDEX IF NOT EXISTS copilot_messages_conversation_id_idx ON copilot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS copilot_messages_created_at_idx ON copilot_messages(created_at);
