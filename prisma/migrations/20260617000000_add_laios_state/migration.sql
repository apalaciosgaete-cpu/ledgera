-- CreateTable
CREATE TABLE IF NOT EXISTS laios_states (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  operating_status TEXT NOT NULL,

  active_cases INTEGER NOT NULL,
  active_workflows INTEGER NOT NULL,
  pending_decisions INTEGER NOT NULL,
  pending_executions INTEGER NOT NULL,

  adaptive_profile_score DOUBLE PRECISION,
  tax_health_score DOUBLE PRECISION,

  executive_summary TEXT NOT NULL,

  engine_states JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS laios_states_user_id_idx ON laios_states(user_id);
CREATE INDEX IF NOT EXISTS laios_states_operating_status_idx ON laios_states(operating_status);
CREATE INDEX IF NOT EXISTS laios_states_created_at_idx ON laios_states(created_at);
