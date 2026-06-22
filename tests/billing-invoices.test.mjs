import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("prisma/migrations/20260612143000_add_billing_invoices/migration.sql", "utf8");
const service = readFileSync("src/modules/billing/application/getBillingInvoices.ts", "utf8");
const route = readFileSync("src/app/api/billing/invoices/route.ts", "utf8");
const panel = readFileSync("src/components/billing/BillingInvoicesPanel.tsx", "utf8");

test("billing invoices migration creates invoice table", () => {
  assert.match(migration, /billing_invoices/);
  assert.match(migration, /invoice_number/);
  assert.match(migration, /payment_id/);
  assert.match(migration, /subscription_id/);
});

test("billing invoices service returns invoice states", () => {
  assert.match(service, /billing_invoices_viewed/);
  assert.match(service, /totalAmount/);
  assert.match(service, /pdfUrl/);
  assert.match(service, /xmlUrl/);
});

test("billing invoices route is authenticated", () => {
  assert.match(route, /getSessionFromRequest/);
  assert.match(route, /getBillingInvoices/);
});

test("billing invoices panel renders invoice lifecycle", () => {
  assert.match(panel, /DRAFT/);
  assert.match(panel, /ISSUED/);
  assert.match(panel, /PAID/);
  assert.match(panel, /VOID/);
  assert.match(panel, /Facturas/);
});
