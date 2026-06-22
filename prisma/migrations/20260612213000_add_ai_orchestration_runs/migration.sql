CREATE TABLE IF NOT EXISTS ai_orchestration_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_updated BOOLEAN NOT NULL DEFAULT false,
  recommendations_created INTEGER NOT NULL DEFAULT 0,
  automations_created INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_orchestration_runs_user_id_idx ON ai_orchestration_runs(user_id);
CREATE INDEX IF NOT EXISTS ai_orchestration_runs_status_idx ON ai_orchestration_runs(status);
CREATE INDEX IF NOT EXISTS ai_orchestration_runs_executed_at_idx ON ai_orchestration_runs(executed_at);
