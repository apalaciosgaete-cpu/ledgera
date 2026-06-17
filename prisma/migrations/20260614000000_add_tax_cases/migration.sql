-- CreateTable
CREATE TABLE "tax_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "aiSummary" TEXT NOT NULL,
    "aiRecommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_cases_userId_idx" ON "tax_cases"("userId");

-- CreateIndex
CREATE INDEX "tax_cases_status_idx" ON "tax_cases"("status");

-- CreateIndex
CREATE INDEX "tax_cases_priority_idx" ON "tax_cases"("priority");

-- AddForeignKey
ALTER TABLE "tax_cases" ADD CONSTRAINT "tax_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
