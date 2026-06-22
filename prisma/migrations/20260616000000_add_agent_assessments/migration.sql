-- CreateTable
CREATE TABLE IF NOT EXISTS agent_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS agent_assessments_user_id_idx ON agent_assessments(user_id);
CREATE INDEX IF NOT EXISTS agent_assessments_subject_idx ON agent_assessments(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS agent_assessments_agent_type_idx ON agent_assessments(agent_type);
CREATE INDEX IF NOT EXISTS agent_assessments_severity_idx ON agent_assessments(severity);
