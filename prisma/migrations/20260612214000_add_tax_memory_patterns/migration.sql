CREATE TABLE IF NOT EXISTS tax_memory_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  strength TEXT NOT NULL DEFAULT 'LOW',
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS tax_memory_patterns_unique_key
  ON tax_memory_patterns(user_id, category, title);

CREATE INDEX IF NOT EXISTS tax_memory_patterns_user_id_idx ON tax_memory_patterns(user_id);
CREATE INDEX IF NOT EXISTS tax_memory_patterns_category_idx ON tax_memory_patterns(category);
CREATE INDEX IF NOT EXISTS tax_memory_patterns_strength_idx ON tax_memory_patterns(strength);
CREATE INDEX IF NOT EXISTS tax_memory_patterns_last_seen_at_idx ON tax_memory_patterns(last_seen_at);
