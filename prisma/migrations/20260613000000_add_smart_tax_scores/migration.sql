CREATE TABLE IF NOT EXISTS "smart_tax_scores" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "level" TEXT NOT NULL,
  "breakdown" JSONB NOT NULL,
  "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "smart_tax_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "smart_tax_scores_user_id_idx" ON "smart_tax_scores" ("user_id");
CREATE INDEX IF NOT EXISTS "smart_tax_scores_level_idx" ON "smart_tax_scores" ("level");
CREATE INDEX IF NOT EXISTS "smart_tax_scores_evaluated_at_idx" ON "smart_tax_scores" ("evaluated_at");
