CREATE TABLE IF NOT EXISTS automation_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source_entity TEXT,
  source_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by TEXT,
  rejected_at TIMESTAMP,
  rejected_by TEXT,
  executed_at TIMESTAMP,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS automation_proposals_user_id_idx ON automation_proposals(user_id);
CREATE INDEX IF NOT EXISTS automation_proposals_status_idx ON automation_proposals(status);
CREATE INDEX IF NOT EXISTS automation_proposals_type_idx ON automation_proposals(type);
CREATE INDEX IF NOT EXISTS automation_proposals_priority_idx ON automation_proposals(priority);
CREATE INDEX IF NOT EXISTS automation_proposals_source_idx ON automation_proposals(source_entity, source_entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS automation_proposals_active_dedupe_idx
  ON automation_proposals(user_id, type, COALESCE(source_entity, ''), COALESCE(source_entity_id, ''))
  WHERE status = 'PROPOSED';
