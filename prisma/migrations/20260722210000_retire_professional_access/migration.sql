DO $$
BEGIN
  IF to_regclass('public.professional_client_access') IS NOT NULL THEN
    ALTER TABLE "professional_client_access"
      ADD COLUMN IF NOT EXISTS "workflowStatus" TEXT NOT NULL DEFAULT 'INVITED',
      ADD COLUMN IF NOT EXISTS "workflowNote" TEXT,
      ADD COLUMN IF NOT EXISTS "workflowUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW();

    UPDATE "professional_client_access"
    SET
      "status" = 'REVOKED',
      "revokedAt" = COALESCE("revokedAt", NOW()),
      "workflowStatus" = 'BLOCKED',
      "workflowNote" = CASE
        WHEN COALESCE(TRIM("workflowNote"), '') = ''
          THEN 'Función de acceso profesional retirada por LEDGERA.'
        ELSE "workflowNote"
      END,
      "workflowUpdatedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "status" IN ('PENDING', 'ACTIVE');
  END IF;
END $$;
