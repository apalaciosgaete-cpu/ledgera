import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("checkout page shows coupon input and apply button", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /Código promocional/);
  assert.match(source, /Aplicar/);
  assert.match(source, /LANZAMIENTO50/);
});

test("checkout page displays discount and final amount", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /discountAmount/);
  assert.match(source, /finalAmount/);
  assert.match(source, /Total a pagar/);
});

test("checkout page calls coupon validation API", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /\/api\/billing\/coupons\/validate/);
});

test("checkout page persists coupon in pendingCheckout", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /coupon:/);
  assert.match(source, /originalAmount/);
  assert.match(source, /discountAmount/);
});

test("checkout coupon validation API emits telemetry", () => {
  const source = read("src/app/api/billing/coupons/validate/route.ts");

  assert.match(source, /coupon_validated/);
});
