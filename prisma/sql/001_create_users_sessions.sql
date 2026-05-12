-- ============================================
-- LEDGERA — Migración manual
-- Tablas: users, sessions
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email              TEXT NOT NULL UNIQUE,
  full_name          TEXT NOT NULL,
  password_hash      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda por token
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Índice para búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
