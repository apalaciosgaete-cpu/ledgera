-- ============================================
-- LEDGERA — Migración
-- Agregar campo role a users
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'personal'
  CHECK (role IN ('personal', 'contador', 'empresa'));