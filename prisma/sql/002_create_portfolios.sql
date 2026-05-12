-- ============================================
-- LEDGERA — Migración manual
-- Tabla: portfolios
-- ============================================

CREATE TABLE IF NOT EXISTS portfolios (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Main Portfolio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);