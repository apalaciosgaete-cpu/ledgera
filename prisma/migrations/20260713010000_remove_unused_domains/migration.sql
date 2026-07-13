-- Remove database structures owned by modules that have no runtime consumers.
-- Historical migrations are intentionally preserved; this migration closes the schema cleanly.

DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;

DROP TABLE IF EXISTS workspace_audit_logs CASCADE;
DROP TABLE IF EXISTS workspace_invites CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

DROP TABLE IF EXISTS automation_proposals CASCADE;
DROP TABLE IF EXISTS agent_assessments CASCADE;
DROP TABLE IF EXISTS agent_plans CASCADE;
DROP TABLE IF EXISTS job_queue CASCADE;
DROP TABLE IF EXISTS laios_states CASCADE;

-- These two models used Prisma's default table names in older schemas.
DROP TABLE IF EXISTS "AIConversation" CASCADE;
DROP TABLE IF EXISTS "AIInsight" CASCADE;

-- Defensive cleanup for environments where those tables were created with snake_case names.
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
