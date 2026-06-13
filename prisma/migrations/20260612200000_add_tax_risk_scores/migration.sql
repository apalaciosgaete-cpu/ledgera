-- CreateTable
CREATE TABLE "tax_risk_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "breakdown" JSONB NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_risk_scores_user_id_idx" ON "tax_risk_scores"("user_id");

-- CreateIndex
CREATE INDEX "tax_risk_scores_level_idx" ON "tax_risk_scores"("level");

-- CreateIndex
CREATE INDEX "tax_risk_scores_evaluated_at_idx" ON "tax_risk_scores"("evaluated_at");

-- AddForeignKey
ALTER TABLE "tax_risk_scores" ADD CONSTRAINT "tax_risk_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
