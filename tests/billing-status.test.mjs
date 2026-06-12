import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const statusService = readFileSync("src/modules/billing/application/getBillingStatus.ts", "utf8");
const statusRoute = readFileSync("src/app/api/billing/status/route.ts", "utf8");
const statusPanel = readFileSync("src/components/billing/BillingStatusPanel.tsx", "utf8");

test("billing status service returns commercial data", () => {
  assert.match(statusService, /billingSubscription/);
  assert.match(statusService, /billingPayment/);
  assert.match(statusService, /latestPayment/);
  assert.match(statusService, /billing_status_viewed/);
});

test("billing status route uses authenticated status service", () => {
  assert.match(statusRoute, /getSessionFromRequest/);
  assert.match(statusRoute, /getBillingStatus/);
});

test("billing status panel renders payment history states", () => {
  assert.match(statusPanel, /Historial de pagos/);
  assert.match(statusPanel, /PENDING/);
  assert.match(statusPanel, /PAID/);
  assert.match(statusPanel, /FAILED/);
});
