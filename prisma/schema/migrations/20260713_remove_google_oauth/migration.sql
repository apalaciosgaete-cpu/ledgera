-- Retira las tablas residuales del adaptador OAuth/NextAuth.
DROP TABLE IF EXISTS "auth_accounts" CASCADE;
DROP TABLE IF EXISTS "auth_sessions" CASCADE;

-- La antigua tabla de verification tokens fue reutilizada por los flujos propios
-- de verificación de correo y recuperación de contraseña. Se conserva su data,
-- pero se elimina el nombre y acoplamiento heredado de Auth.js.
DO $$
BEGIN
  IF to_regclass('public.one_time_tokens') IS NULL THEN
    IF to_regclass('public.auth_verification_tokens') IS NOT NULL THEN
      ALTER TABLE "auth_verification_tokens" RENAME TO "one_time_tokens";
    ELSE
      CREATE TABLE "one_time_tokens" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      );
    END IF;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "one_time_tokens_token_key"
  ON "one_time_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "one_time_tokens_identifier_token_key"
  ON "one_time_tokens"("identifier", "token");

-- La ejecución se considera correcta solo si no queda ninguna tabla OAuth
-- y el almacenamiento propio de tokens continúa disponible.
DO $$
BEGIN
  IF to_regclass('public.auth_accounts') IS NOT NULL
     OR to_regclass('public.auth_sessions') IS NOT NULL
     OR to_regclass('public.auth_verification_tokens') IS NOT NULL
     OR to_regclass('public.one_time_tokens') IS NULL THEN
    RAISE EXCEPTION 'OAuth cleanup verification failed';
  END IF;
END
$$;
