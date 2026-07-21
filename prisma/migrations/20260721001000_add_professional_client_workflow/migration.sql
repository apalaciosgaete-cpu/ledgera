ALTER TABLE "professional_client_access"
ADD COLUMN IF NOT EXISTS "workflowStatus" TEXT NOT NULL DEFAULT 'INVITED',
ADD COLUMN IF NOT EXISTS "workflowNote" TEXT,
ADD COLUMN IF NOT EXISTS "workflowUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS "professional_client_access_professionalUserId_workflowStatus_idx"
ON "professional_client_access" ("professionalUserId", "workflowStatus");

UPDATE "professional_client_access"
SET "workflowStatus" = CASE
  WHEN "status" = 'ACTIVE' THEN 'DATA_PENDING'
  WHEN "status" IN ('REVOKED', 'DECLINED') THEN 'BLOCKED'
  ELSE 'INVITED'
END,
"workflowUpdatedAt" = COALESCE("updatedAt", NOW());
