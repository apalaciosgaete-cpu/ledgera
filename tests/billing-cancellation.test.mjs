import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync("src/modules/billing/application/cancelSubscription.ts", "utf8");
const cancelRoute = readFileSync("src/app/api/billing/cancel/route.ts", "utf8");
const downgradeRoute = readFileSync("src/app/api/billing/downgrade/route.ts", "utf8");
const actions = readFileSync("src/components/billing/BillingCancellationActions.tsx", "utf8");
const statusPanel = readFileSync("src/components/billing/BillingStatusPanel.tsx", "utf8");

test("billing cancellation service supports cancel at period end", () => {
  assert.match(service, /CANCEL_AT_PERIOD_END/);
  assert.match(service, /subscription_cancel_scheduled/);
});

test("billing cancellation service supports immediate downgrade", () => {
  assert.match(service, /downgrade_now/);
  assert.match(service, /subscription_plan: "BASICO"/);
  assert.match(service, /subscription_downgraded/);
});

test("billing cancellation routes are authenticated", () => {
  assert.match(cancelRoute, /getSessionFromRequest/);
  assert.match(downgradeRoute, /getSessionFromRequest/);
});

test("billing cancellation UI exposes both actions", () => {
  assert.match(actions, /Cancelar renovación/);
  assert.match(actions, /Volver a Free ahora/);
});

test("billing status panel renders cancel at period end state", () => {
  assert.match(statusPanel, /CANCEL_AT_PERIOD_END/);
  assert.match(statusPanel, /Cancela al vencimiento/);
});
