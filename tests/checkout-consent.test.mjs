import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("checkout renders a canonical plan summary before contracting", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /PLAN_SUMMARIES/);
  assert.match(source, /rawPlan === "PERSONAL" \|\| rawPlan === "PROFESIONAL"/);
  assert.match(source, /Resumen de contratación/);
  assert.match(source, /Valor del plan/);
  assert.match(source, /\+ IVA\/\{period\}/);
});

test("checkout preserves the selected plan when authentication is required", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /const resumePath = plan/);
  assert.match(source, /\/login\?next=/);
  assert.match(source, /\/register\?next=/);
  assert.match(source, /Inicia sesión o crea tu cuenta/);
});

test("authenticated checkout delegates payment creation to the guarded button", () => {
  const source = read("src/app/checkout/page.tsx");

  assert.match(source, /isAuthenticated/);
  assert.match(source, /<BillingCheckoutButton/);
  assert.match(source, /plan=\{plan\}/);
  assert.match(source, /billing=\{billing\}/);
});

test("public plan selection persists only resumable checkout intent", () => {
  const source = read("src/components/billing/BillingCheckoutButton.tsx");

  assert.match(source, /sessionStorage\.setItem\(\s*"pendingCheckout"/);
  assert.match(source, /flow: "checkout_first"/);
  assert.match(source, /router\.push\(`\/checkout/);
  assert.doesNotMatch(source, /paidFirstCheckout/);
  assert.doesNotMatch(source, /checkout_payment_completed/);
});

test("billing stays fail-closed until a live external provider is configured", () => {
  const source = read("src/app/api/billing/checkout/route.ts");
  const guardIndex = source.indexOf("if (!isLiveBillingEnabled())");
  const authIndex = source.indexOf("getSessionFromRequest(request)");
  const paymentIndex = source.indexOf("prisma.billingPayment.create");

  assert.ok(guardIndex >= 0);
  assert.ok(authIndex > guardIndex);
  assert.ok(paymentIndex > authIndex);
  assert.match(source, /status: 503/);
  assert.match(source, /createExternalGatewayCheckout/);
});

test("planes page sends paid monthly and annual plans through checkout", () => {
  const source = read("src/app/planes/page.tsx");

  assert.match(source, /BillingCheckoutButton/);
  assert.match(source, /checkoutPlan: "PERSONAL"/);
  assert.match(source, /checkoutPlan: "PROFESIONAL"/);
  assert.match(source, /billing=\{billing\}/);
});

test("legal commercial policy page exists", () => {
  const source = read("src/app/legal/comercial/page.tsx");

  assert.match(source, /Política Comercial/);
  assert.match(source, /renovación automática/i);
  assert.match(source, /cancelación/i);
  assert.match(source, /reembolsos/i);
});

test("next.config redirects legacy legal paths", () => {
  const source = read("next.config.mjs");

  assert.match(source, /\/legal\/terminos/);
  assert.match(source, /\/legal\/privacidad/);
  assert.match(source, /destination:\s*"\/terminos"/);
  assert.match(source, /destination:\s*"\/privacidad"/);
});
