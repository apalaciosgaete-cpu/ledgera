CREATE TABLE IF NOT EXISTS agent_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  expected_impact TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  steps JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  executed_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS agent_plans_user_id_idx ON agent_plans(user_id);
CREATE INDEX IF NOT EXISTS agent_plans_status_idx ON agent_plans(status);
CREATE INDEX IF NOT EXISTS agent_plans_priority_idx ON agent_plans(priority);
CREATE INDEX IF NOT EXISTS agent_plans_source_idx ON agent_plans(source_type, source_id);
CREATE INDEX IF NOT EXISTS agent_plans_created_at_idx ON agent_plans(created_at);
