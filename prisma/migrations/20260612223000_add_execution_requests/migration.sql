CREATE TABLE IF NOT EXISTS execution_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  source_type TEXT,
  source_id TEXT,
  payload JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS execution_requests_user_id_idx ON execution_requests(user_id);
CREATE INDEX IF NOT EXISTS execution_requests_status_idx ON execution_requests(status);
CREATE INDEX IF NOT EXISTS execution_requests_type_idx ON execution_requests(type);
CREATE INDEX IF NOT EXISTS execution_requests_source_idx ON execution_requests(source_type, source_id);
CREATE INDEX IF NOT EXISTS execution_requests_created_at_idx ON execution_requests(created_at);
