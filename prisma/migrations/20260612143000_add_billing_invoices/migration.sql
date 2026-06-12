-- CAPA 4.3.02 — Billing invoices

CREATE TABLE IF NOT EXISTS billing_invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id TEXT NULL REFERENCES billing_payments(id) ON DELETE SET NULL,
  subscription_id TEXT NULL REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  currency TEXT NOT NULL DEFAULT 'CLP',
  subtotal_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  provider TEXT NULL,
  provider_invoice_id TEXT NULL,
  pdf_url TEXT NULL,
  xml_url TEXT NULL,
  issued_at TIMESTAMP NULL,
  paid_at TIMESTAMP NULL,
  voided_at TIMESTAMP NULL,
  metadata TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_payment_id ON billing_invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON billing_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_created_at ON billing_invoices(created_at);
