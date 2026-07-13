-- Retira las tablas residuales del adaptador OAuth/NextAuth.
DROP TABLE IF EXISTS "auth_accounts" CASCADE;
DROP TABLE IF EXISTS "auth_sessions" CASCADE;
DROP TABLE IF EXISTS "auth_verification_tokens" CASCADE;
