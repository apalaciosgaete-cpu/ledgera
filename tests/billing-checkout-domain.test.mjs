import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/modules/billing/domain/checkout.ts", "utf8");

test("billing checkout domain includes future payment providers", () => {
  assert.match(source, /stripe/);
  assert.match(source, /flow/);
  assert.match(source, /mercadopago/);
});

test("billing checkout domain defines canonical checkout plans", () => {
  assert.match(source, /PERSONAL/);
  assert.match(source, /PROFESIONAL/);
  assert.doesNotMatch(source, /EMPRESA/);
  assert.match(source, /COMMERCIAL_PLANS/);
});

test("billing checkout return URL uses checkout status and payment id", () => {
  assert.match(source, /checkout/);
  assert.match(source, /paymentId/);
});
