import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("public checkout does not advertise inactive campaign codes", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.doesNotMatch(source, /LANZAMIENTO50/);
  assert.doesNotMatch(source, /Código promocional/);
  assert.doesNotMatch(source, /coupon:/);
});

test("checkout calculates the payable amount from server-owned plan prices", () => {
  const source = read("src/app/api/billing/checkout/route.ts");

  assert.match(source, /getCheckoutPlanConfig\(plan, interval\)/);
  assert.match(source, /amount: config\.amount/);
  assert.match(source, /netAmount: config\.netAmount/);
  assert.match(source, /taxAmount: config\.taxAmount/);
  assert.doesNotMatch(source, /body\.amount/);
  assert.doesNotMatch(source, /body\.discountAmount/);
});

test("coupon validation remains server-side and validates all inputs", () => {
  const source = read("src/app/api/billing/coupons/validate/route.ts");

  assert.match(source, /validateCoupon/);
  assert.match(source, /if \(!code\)/);
  assert.match(source, /if \(!plan\)/);
  assert.match(source, /if \(amount <= 0\)/);
  assert.match(source, /coupon_validated/);
});

test("coupon administration remains restricted to administrators", () => {
  const source = read("src/app/api/billing/coupons/route.ts");

  assert.match(source, /getSessionFromRequest/);
  assert.match(source, /role === "admin"/);
  assert.match(source, /role === "super_admin"/);
  assert.match(source, /status: 403/);
});
