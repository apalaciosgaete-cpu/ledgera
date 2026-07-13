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

## Autenticacion

LEDGERA utiliza autenticacion propia mediante correo, contraseña, sesiones `HttpOnly` y verificacion TOTP. La integracion de acceso con Google y Auth.js fue retirada; no existen endpoints OAuth ni providers sociales activos.

Variables de seguridad utilizadas por el flujo propio:

```env
AUTH_SECRET=replace-with-a-32-byte-secret
REGISTRATION_2FA_TOKEN_SECRET=replace-with-a-32-byte-secret
NEXT_PUBLIC_APP_URL=https://ledgera.cl
```

## Stack estable

El stack queda en Next 14.2.x, React 18.3.x y Tailwind 3.4.x. Se reemplazo `@tailwindcss/postcss` por `tailwindcss` + `autoprefixer` en PostCSS.

## Buda.com

El conector Buda firma requests con HMAC-SHA384, valida credenciales con `/balances`, cifra secretos antes de guardarlos y permite importar trades a `ExchangeImportRecord` y `StagingEvent` desde `/api/connectors/buda`.
