# Ledgera v2 Critical Fixes

## Dolar observado

`FxRateService` consulta `https://mindicador.cl/api/dolar`, guarda el valor diario en `FxRate` y reutiliza el cache por `currency/date`. Las transacciones de fin de semana usan el dia habil anterior. El cron de Vercel llama `/api/cron/fx-rate` a las 14:00 UTC y exige `Authorization: Bearer $CRON_SECRET`.

## Clasificacion tributaria

`TaxClassificationService` centraliza la clasificacion tributaria:

- `SELL`, `SWAP`, `CONVERT` y `DUST_CONVERT`: `CAPITAL_GAIN`.
- `STAKING`, `AIRDROP`, `INTEREST` y `DEFI_YIELD`: `ORDINARY_INCOME`.
- `MINING`: `ORDINARY_INCOME_MINING`.
- `BUY`: `NON_TAXABLE`.
- transferencias entre wallets propias: `NON_TAXABLE`; otros casos quedan `UNCLASSIFIED`.

## Auth.js

Se agrego Auth.js v5 con ruta `/api/auth/[...nextauth]`, provider Google y credentials con `bcrypt`. Las tablas del adaptador se mapearon como `auth_accounts`, `auth_sessions` y `auth_verification_tokens` para preservar la tabla `users` existente.

Variables requeridas:

```env
NEXTAUTH_URL=https://ledgera.cl
NEXTAUTH_SECRET=replace-with-a-32-byte-secret
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
```

## Stack estable

El stack queda en Next 14.2.x, React 18.3.x y Tailwind 3.4.x. Se reemplazo `@tailwindcss/postcss` por `tailwindcss` + `autoprefixer` en PostCSS.

## Buda.com

El conector Buda firma requests con HMAC-SHA384, valida credenciales con `/balances`, cifra secretos antes de guardarlos y permite importar trades a `ExchangeImportRecord` y `StagingEvent` desde `/api/connectors/buda`.
