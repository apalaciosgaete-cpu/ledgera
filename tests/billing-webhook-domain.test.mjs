import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const webhookDomain = readFileSync("src/modules/billing/domain/webhook.ts", "utf8");
const webhookRoute = readFileSync("src/app/api/billing/webhook/route.ts", "utf8");
const processor = readFileSync("src/modules/billing/application/processBillingWebhook.ts", "utf8");

test("billing webhook domain normalizes supported provider events", () => {
  assert.match(webhookDomain, /payment_succeeded/);
  assert.match(webhookDomain, /payment_failed/);
  assert.match(webhookDomain, /subscription_cancelled/);
});

test("billing webhook route persists webhook events and handles duplicates", () => {
  assert.match(webhookRoute, /billingWebhookEvent\.create/);
  assert.match(webhookRoute, /providerEventId/);
  assert.match(webhookRoute, /duplicate/);
  assert.match(webhookRoute, /BILLING_WEBHOOK_SECRET/);
});

test("billing webhook processor activates subscriptions", () => {
  assert.match(processor, /billingSubscription\.create/);
  assert.match(processor, /subscription_plan/);
  assert.match(processor, /subscription_expires_at/);
  assert.match(processor, /upgrade_completed/);
});
