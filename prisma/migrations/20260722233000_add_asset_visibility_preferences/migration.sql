CREATE TABLE IF NOT EXISTS asset_visibility_preferences (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", symbol)
);

CREATE INDEX IF NOT EXISTS idx_asset_visibility_user
ON asset_visibility_preferences ("userId");
