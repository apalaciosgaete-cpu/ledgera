-- Keep the production users table aligned with the Prisma model.
-- IF NOT EXISTS makes this migration safe for environments where some columns
-- were created manually or by an earlier partial deployment.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboardingData" JSONB,
  ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "activationSource" TEXT;
