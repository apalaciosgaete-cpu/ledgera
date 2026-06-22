-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_user_id_idx" ON "timeline_events"("user_id");

-- CreateIndex
CREATE INDEX "timeline_events_category_idx" ON "timeline_events"("category");

-- CreateIndex
CREATE INDEX "timeline_events_severity_idx" ON "timeline_events"("severity");

-- CreateIndex
CREATE INDEX "timeline_events_occurred_at_idx" ON "timeline_events"("occurred_at");

-- CreateIndex
CREATE INDEX "timeline_events_user_id_occurred_at_idx" ON "timeline_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_events_entity_type_entity_id_idx" ON "timeline_events"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
