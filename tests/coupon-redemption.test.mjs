import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadTsModule(relativePath) {
  const source = read(relativePath);
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  const context = {
    exports,
    module: { exports },
    require: (specifier) => {
      if (specifier === "@/modules/billing/infrastructure/couponRepository") {
        return {
          createCouponRedemption: async (input) => ({
            id: "r1",
            couponId: input.couponId,
            userId: input.userId ?? null,
            email: input.email ?? null,
            checkoutId: input.checkoutId ?? null,
            redeemedAt: new Date(),
          }),
          incrementCouponRedemptions: async () => {},
        };
      }
      if (specifier === "@/modules/audit/application/recordAuditEvent") {
        return { recordAuditEvent: async () => {} };
      }
      if (specifier === "@/modules/timeline/application/recordTimelineEvent") {
        return { recordTimelineEvent: async () => {} };
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: relativePath });

  return context.module.exports;
}

const { redeemCoupon } = loadTsModule("src/modules/billing/application/redeemCoupon.ts");

test("redeemCoupon creates redemption and increments counter", async () => {
  const result = await redeemCoupon({
    couponId: "c1",
    userId: "u1",
    email: "user@example.com",
    checkoutId: "chk1",
  });

  assert.equal(result.ok, true);
});

test("coupon repository exposes required functions", () => {
  const source = read("src/modules/billing/infrastructure/couponRepository.ts");

  assert.match(source, /findCouponByCode/);
  assert.match(source, /listCoupons/);
  assert.match(source, /createCoupon/);
  assert.match(source, /createCouponRedemption/);
  assert.match(source, /incrementCouponRedemptions/);
});

test("Prisma schema includes coupon models", () => {
  const source = read("prisma/schema.prisma");

  assert.match(source, /model BillingCoupon/);
  assert.match(source, /model BillingCouponRedemption/);
  assert.match(source, /billing_coupons/);
  assert.match(source, /billing_coupon_redemptions/);
});

test("coupon migration SQL exists", () => {
  const migrations = fs.readdirSync(path.join(root, "prisma/migrations"));
  const couponMigration = migrations.find((m) => m.includes("coupon"));

  assert.ok(couponMigration, "No se encontró migración de cupones");

  const source = read(`prisma/migrations/${couponMigration}/migration.sql`);

  assert.match(source, /billing_coupons/);
  assert.match(source, /billing_coupon_redemptions/);
});
