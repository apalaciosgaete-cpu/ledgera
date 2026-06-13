-- CreateTable
CREATE TABLE "billing_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "max_redemptions" INTEGER,
    "current_redemptions" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "applicable_plans" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_coupon_redemptions" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "checkout_id" TEXT,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_coupons_code_key" ON "billing_coupons"("code");

-- CreateIndex
CREATE INDEX "billing_coupons_status_idx" ON "billing_coupons"("status");

-- CreateIndex
CREATE INDEX "billing_coupons_code_idx" ON "billing_coupons"("code");

-- CreateIndex
CREATE INDEX "billing_coupon_redemptions_coupon_id_idx" ON "billing_coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "billing_coupon_redemptions_user_id_idx" ON "billing_coupon_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "billing_coupon_redemptions_checkout_id_idx" ON "billing_coupon_redemptions"("checkout_id");

-- AddForeignKey
ALTER TABLE "billing_coupon_redemptions" ADD CONSTRAINT "billing_coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "billing_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
