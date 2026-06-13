import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import type {
  BillingCoupon,
  CouponRedemption,
  CreateCouponInput,
} from "@/modules/billing/domain/coupons";

function parseApplicablePlans(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeApplicablePlans(plans: string[]): string {
  return JSON.stringify(plans);
}

function mapBillingCoupon(row: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  value: number | Decimal;
  maxRedemptions: number | null;
  currentRedemptions: number;
  validFrom: Date;
  validUntil: Date | null;
  applicablePlans: string;
  status: string;
  createdAt: Date;
}): BillingCoupon {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    type: row.type as BillingCoupon["type"],
    value: Number(row.value),
    maxRedemptions: row.maxRedemptions,
    currentRedemptions: row.currentRedemptions,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    applicablePlans: parseApplicablePlans(row.applicablePlans),
    status: row.status as BillingCoupon["status"],
    createdAt: row.createdAt,
  };
}

function mapCouponRedemption(row: {
  id: string;
  couponId: string;
  userId: string | null;
  email: string | null;
  checkoutId: string | null;
  redeemedAt: Date;
}): CouponRedemption {
  return {
    id: row.id,
    couponId: row.couponId,
    userId: row.userId,
    email: row.email,
    checkoutId: row.checkoutId,
    redeemedAt: row.redeemedAt,
  };
}

export async function findCouponByCode(
  code: string,
): Promise<BillingCoupon | null> {
  const coupon = await prisma.billingCoupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) return null;

  return mapBillingCoupon(coupon);
}

export async function listCoupons(): Promise<BillingCoupon[]> {
  const coupons = await prisma.billingCoupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return coupons.map(mapBillingCoupon);
}

export async function createCoupon(input: CreateCouponInput): Promise<BillingCoupon> {
  const coupon = await prisma.billingCoupon.create({
    data: {
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      maxRedemptions: input.maxRedemptions ?? null,
      currentRedemptions: 0,
      validFrom: input.validFrom,
      validUntil: input.validUntil ?? null,
      applicablePlans: serializeApplicablePlans(input.applicablePlans),
      status: input.status ?? "ACTIVE",
    },
  });

  return mapBillingCoupon(coupon);
}

export async function incrementCouponRedemptions(id: string): Promise<void> {
  await prisma.billingCoupon.update({
    where: { id },
    data: { currentRedemptions: { increment: 1 } },
  });
}

export async function createCouponRedemption(
  input: {
    couponId: string;
    userId?: string | null;
    email?: string | null;
    checkoutId?: string | null;
  },
): Promise<CouponRedemption> {
  const redemption = await prisma.billingCouponRedemption.create({
    data: {
      couponId: input.couponId,
      userId: input.userId ?? null,
      email: input.email ?? null,
      checkoutId: input.checkoutId ?? null,
    },
  });

  return mapCouponRedemption(redemption);
}
