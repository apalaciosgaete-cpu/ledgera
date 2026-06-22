import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const checkoutButton = readFileSync("src/components/billing/BillingCheckoutButton.tsx", "utf8");
const checkoutPage = readFileSync("src/app/checkout/page.tsx", "utf8");
const registerPage = readFileSync("src/app/register/page.tsx", "utf8");

test("public paid plan selection uses checkout first flow", () => {
  assert.match(checkoutButton, /router\.push\(`\/checkout/);
  assert.match(checkoutButton, /checkout_first/);
  assert.doesNotMatch(checkoutButton, /router\.push\(`\/register\?\$\{params\.toString\(\)\}`\)/);
});

test("public checkout captures plan before registration", () => {
  assert.match(checkoutPage, /Checkout primero/);
  assert.match(checkoutPage, /pendingCheckout/);
  assert.match(checkoutPage, /paidFirstCheckout/);
  assert.match(checkoutPage, /provider_before_registration/);
  assert.match(checkoutPage, /Continuar después del pago/);
});

test("registration recognizes paid first acquisition", () => {
  assert.match(registerPage, /checkout.*paid-first/);
  assert.match(registerPage, /Activar cuenta pagada/);
  assert.match(registerPage, /configuracion\/facturacion\?checkout=success/);
});
