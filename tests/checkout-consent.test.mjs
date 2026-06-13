import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("checkout page renders consent section with checkboxes", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /type="checkbox"/);
  assert.match(source, /ConsentStep/);
  assert.match(source, /PaymentStep/);
});

test("checkout page mentions secure payment redirection", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /plataforma de pago segura/i);
});

test("checkout page links to legal terms, privacy and commercial policy", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /href="\/legal\/terminos"/);
  assert.match(source, /href="\/legal\/privacidad"/);
  assert.match(source, /href="\/legal\/comercial"/);
});

test("checkout page persists consent in sessionStorage and emits telemetry", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /sessionStorage\.setItem\(\s*"checkoutConsent"/);
  assert.match(source, /sessionStorage\.setItem\(\s*"pendingCheckout"/);
  assert.match(source, /sessionStorage\.setItem\(\s*"paidFirstCheckout"/);
  assert.match(source, /checkout_terms_accepted/);
  assert.match(source, /checkout_payment_completed/);
});

test("checkout page has two-step flow: consent then payment", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /type CheckoutStep = "consent" \| "payment"/);
  assert.match(source, /setStep\("payment"\)/);
  assert.match(source, /Continuar después del pago/);
});

test("checkout page integrates coupon input and validation", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /Código promocional/);
  assert.match(source, /\/api\/billing\/coupons\/validate/);
  assert.match(source, /discountAmount/);
  assert.match(source, /finalAmount/);

  const apiSource = read("src/app/api/billing/coupons/validate/route.ts");
  assert.match(apiSource, /coupon_validated/);
});

test("checkout page disables continue button until all consents are accepted", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /canContinue/);
  assert.match(source, /disabled=\{!canContinue\}/);
});

test("planes page redirects paid monthly plans to checkout", () => {
  const source = read("src/app/planes/page.tsx");

  assert.match(source, /BillingCheckoutButton/);
  assert.match(source, /checkoutMode/);
  assert.match(source, /checkoutPlan/);
});

test("legal commercial policy page exists", () => {
  const source = read("src/app/legal/comercial/page.tsx");

  assert.match(source, /Política Comercial/);
  assert.match(source, /renovación automática/i);
  assert.match(source, /cancelación/i);
  assert.match(source, /reembolsos/i);
});

test("next.config redirects /legal/terminos and /legal/privacidad", () => {
  const source = read("next.config.mjs");

  assert.match(source, /\/legal\/terminos/);
  assert.match(source, /\/legal\/privacidad/);
  assert.match(source, /destination:\s*"\/terminos"/);
  assert.match(source, /destination:\s*"\/privacidad"/);
});
