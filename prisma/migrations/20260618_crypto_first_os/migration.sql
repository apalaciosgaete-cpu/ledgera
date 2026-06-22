-- CAPA 2 — Sistema Operativo Crypto First

CREATE TABLE IF NOT EXISTS digital_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  risk_level TEXT NOT NULL DEFAULT 'UNASSESSED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crypto_assets (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC,
  estimated_value_clp NUMERIC,
  acquisition_cost_clp NUMERIC,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exchange_accounts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_wallets (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  owner_declared BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_of_funds (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_clp NUMERIC,
  evidence_status TEXT NOT NULL DEFAULT 'PARTIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_obligations_crypto (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_documents_crypto (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES digital_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PARTIAL',
  file_url TEXT,
  related_module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_system_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES digital_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_profiles_user_id ON digital_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_profile_id ON crypto_assets(profile_id);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_exchange_accounts_profile_id ON exchange_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_digital_wallets_profile_id ON digital_wallets(profile_id);
CREATE INDEX IF NOT EXISTS idx_source_of_funds_profile_id ON source_of_funds(profile_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_crypto_profile_id ON tax_obligations_crypto(profile_id);
CREATE INDEX IF NOT EXISTS idx_digital_documents_crypto_profile_id ON digital_documents_crypto(profile_id);
CREATE INDEX IF NOT EXISTS idx_digital_system_events_user_id ON digital_system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_system_events_created_at ON digital_system_events(created_at);
