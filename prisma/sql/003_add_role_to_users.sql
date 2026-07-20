-- ============================================
-- LEDGERA — Migración
-- Agregar campo role a users
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'personal';

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('personal', 'contador', 'empresa', 'support', 'admin'));
