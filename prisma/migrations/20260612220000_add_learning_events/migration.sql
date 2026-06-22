CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_module TEXT NOT NULL,
  outcome TEXT NOT NULL,
  score_impact DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS learning_events_user_id_idx ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS learning_events_event_type_idx ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS learning_events_source_module_idx ON learning_events(source_module);
CREATE INDEX IF NOT EXISTS learning_events_outcome_idx ON learning_events(outcome);
CREATE INDEX IF NOT EXISTS learning_events_created_at_idx ON learning_events(created_at);
