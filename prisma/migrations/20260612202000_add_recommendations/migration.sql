-- CAPA 5.1.06 — Recomendaciones Tributarias Automatizadas

CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_label" TEXT NOT NULL,
    "action_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recommendations_user_id_idx" ON "recommendations"("user_id");
CREATE INDEX "recommendations_priority_idx" ON "recommendations"("priority");
CREATE INDEX "recommendations_status_idx" ON "recommendations"("status");
CREATE INDEX "recommendations_source_type_idx" ON "recommendations"("source_type");
CREATE INDEX "recommendations_user_id_status_idx" ON "recommendations"("user_id", "status");

ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
