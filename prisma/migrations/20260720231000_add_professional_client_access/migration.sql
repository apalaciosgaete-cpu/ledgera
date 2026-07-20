CREATE TABLE "professional_client_access" (
    "id" TEXT NOT NULL,
    "professionalUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "permissions" JSONB,
    "invitedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_client_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professional_client_access_professionalUserId_clientUserId_key"
    ON "professional_client_access"("professionalUserId", "clientUserId");

CREATE INDEX "professional_client_access_professionalUserId_status_idx"
    ON "professional_client_access"("professionalUserId", "status");

CREATE INDEX "professional_client_access_clientUserId_status_idx"
    ON "professional_client_access"("clientUserId", "status");

ALTER TABLE "professional_client_access"
    ADD CONSTRAINT "professional_client_access_professionalUserId_fkey"
    FOREIGN KEY ("professionalUserId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_client_access"
    ADD CONSTRAINT "professional_client_access_clientUserId_fkey"
    FOREIGN KEY ("clientUserId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
