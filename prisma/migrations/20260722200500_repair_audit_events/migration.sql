-- Repair databases where the historical audit migration was baselined without
-- creating its physical table. The statements are idempotent for environments
-- where the table and indexes already exist.
CREATE TABLE IF NOT EXISTS "audit_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_id" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_events_user_id_idx"
    ON "audit_events"("user_id");

CREATE INDEX IF NOT EXISTS "audit_events_actor_id_idx"
    ON "audit_events"("actor_id");

CREATE INDEX IF NOT EXISTS "audit_events_category_idx"
    ON "audit_events"("category");

CREATE INDEX IF NOT EXISTS "audit_events_event_idx"
    ON "audit_events"("event");

CREATE INDEX IF NOT EXISTS "audit_events_created_at_idx"
    ON "audit_events"("created_at");
