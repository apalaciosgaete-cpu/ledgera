# LEDGERA — Migración al sistema de diseño (Propuesta B "Cierre")

> **ESTADO: COMPLETADA.** Todas las pantallas y componentes de `src/app`,
> `src/components` y `src/shared` fueron migrados a los tokens del sistema
> (fundamento + landing + auth + chrome de la app + componentes compartidos +
> páginas públicas/legales/admin + ~70 pantallas protegidas). El mapeo se hizo
> por **rol de propiedad + semántica de matiz** (texto→claro, fondo→oscuro,
> borde→borde, verde/rojo/ámbar→accent/loss/warn).
>
> **Excepciones intencionales (no se migran, son funcionales/de marca):**
> - Fondos blancos de códigos **QR** (necesarios para escaneo).
> - Colores de marca: logo de **Google** (sign-in), **Binance**, logos de activos.
> - Acentos de **identidad de rol** en `(protected)/layout.tsx` (personal/
>   profesional/empresa/admin) — escala de identidad, no del sistema semántico.
> - Rutas de generación de **PDF**, `icon`/`apple-icon`/`opengraph-image`/`manifest`.

Este documento se conserva como guía histórica del mapeo aplicado.
El **fundamento** del sistema (fuentes, tokens de Tailwind y variables de
`globals.css`) quedó instalado, y los colores/fuentes hardcodeadas se
reemplazaron por los tokens sin tocar lógica de negocio ni endpoints.

## Estado — instalado en esta entrega

- `src/app/layout.tsx`: fuentes vía `next/font/google` (Space Grotesk / Inter / IBM Plex Mono) → variables `--font-display`, `--font-body`, `--font-mono` en `<html>`.
- `tailwind.config.ts`: tokens de color (`bg`, `bg-elev`, `accent`, `gain`, `loss`, `warn`, …), `fontFamily` (`display`/`body`/`mono`) y `borderRadius` (`DEFAULT` 10px, `card` 12px).
- `src/app/globals.css`: variables base del modo oscuro + remapeo de las variables `--color-*` legadas al nuevo sistema (compat).

## Mapa de reemplazo (color hardcodeado → token)

| Antes (light) | Token nuevo |
|---|---|
| Fondo página `#F6F8FA` | `bg` / `var(--bg)` |
| Superficie/card `#FFFFFF` | `bg-elev` / `var(--bg-elev)` |
| Superficie hundida `#F8FAFC` | `bg-sunken` / `var(--bg-sunken)` |
| Borde `#E2E8F0` | `border` / `var(--border)` |
| Texto primario `#0F172A` | `text` / `var(--text)` |
| Texto secundario `#475569` | `text-soft` / `var(--text-soft)` |
| Texto tenue `#94A3B8` | `text-faint` / `var(--text-faint)` |
| Acento/marca `#0F2A3D` / `#16A34A` | `accent` / `var(--accent)` |
| Ganancia `#16A34A` | `gain` / `var(--gain)` |
| Pérdida `#DC2626` / `#EF4444` | `loss` / `var(--loss)` |
| Alerta `#F59E0B` | `warn` / `var(--warn)` |

Números (montos, folios, hashes, celdas de tablas): añadir `font-mono tabular-nums`.

## Regla de exclusión

**No** re-tematizar: rutas de generación de PDF (`src/app/api/**/pdf/*`), `icon.tsx`,
`apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts` y logos con color de marca fijo.
Esos colores son funcionales, no temáticos.

## Inventario — archivos con colores hardcodeados (`#RRGGBB` inline)

- `src/app/(protected)/alertas/page.tsx`
- `src/app/(protected)/ayuda/page.tsx`
- `src/app/(protected)/bank/movements/page.tsx`
- `src/app/(protected)/bank/page.tsx`
- `src/app/(protected)/bank/uploads/[id]/page.tsx`
- `src/app/(protected)/casos/page.tsx`
- `src/app/(protected)/configuracion/ConfiguracionShell.tsx`
- `src/app/(protected)/configuracion/auditoria/page.tsx`
- `src/app/(protected)/configuracion/layout.tsx`
- `src/app/(protected)/decisiones/page.tsx`
- `src/app/(protected)/declaraciones/page.tsx`
- `src/app/(protected)/documentos/page.tsx`
- `src/app/(protected)/ejecuciones/page.tsx`
- `src/app/(protected)/experto/ai-center/page.tsx`
- `src/app/(protected)/experto/alertas/page.tsx`
- `src/app/(protected)/experto/auditoria/page.tsx`
- `src/app/(protected)/experto/casos/page.tsx`
- `src/app/(protected)/experto/dashboard/page.tsx`
- `src/app/(protected)/experto/decisiones/page.tsx`
- `src/app/(protected)/experto/declaraciones/page.tsx`
- `src/app/(protected)/experto/documentos/page.tsx`
- `src/app/(protected)/experto/expedientes/[userId]/page.tsx`
- `src/app/(protected)/experto/expedientes/page.tsx`
- `src/app/(protected)/experto/layout.tsx`
- `src/app/(protected)/experto/memoria-tributaria/page.tsx`
- `src/app/(protected)/experto/multiagente/page.tsx`
- `src/app/(protected)/experto/operaciones/MovimientosBlock.tsx`
- `src/app/(protected)/experto/operaciones/PeriodoBlock.tsx`
- `src/app/(protected)/experto/operaciones/RevisionBlock.tsx`
- `src/app/(protected)/experto/operaciones/page.tsx`
- `src/app/(protected)/experto/operating-system/page.tsx`
- `src/app/(protected)/experto/page.tsx`
- `src/app/(protected)/experto/perfiles-adaptativos/page.tsx`
- `src/app/(protected)/experto/recomendaciones/page.tsx`
- `src/app/(protected)/experto/riesgo/page.tsx`
- `src/app/(protected)/experto/score-tributario/page.tsx`
- `src/app/(protected)/experto/tareas/page.tsx`
- `src/app/(protected)/experto/tributario/page.tsx`
- `src/app/(protected)/experto/tributario/sii/page.tsx`
- `src/app/(protected)/experto/verificaciones/page.tsx`
- `src/app/(protected)/experto/workflows/page.tsx`
- `src/app/(protected)/import/bank/page.tsx`
- `src/app/(protected)/importaciones/page.tsx`
- `src/app/(protected)/impuestos/reportes/page.tsx`
- `src/app/(protected)/integraciones/page.tsx`
- `src/app/(protected)/inversiones/page.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/memoria-tributaria/page.tsx`
- `src/app/(protected)/mi-expediente/page.tsx`
- `src/app/(protected)/mi-perfil-tributario/page.tsx`
- `src/app/(protected)/mi-situacion/page.tsx`
- `src/app/(protected)/monitor/page.tsx`
- `src/app/(protected)/movements/page.tsx`
- `src/app/(protected)/multiagente/page.tsx`
- `src/app/(protected)/notificaciones/page.tsx`
- `src/app/(protected)/operating-system/page.tsx`
- `src/app/(protected)/origen-fondos/bancos/[bankId]/page.tsx`
- `src/app/(protected)/origen-fondos/bancos/page.tsx`
- `src/app/(protected)/origen-fondos/documentacion/page.tsx`
- `src/app/(protected)/origen-fondos/exchanges/[exchangeId]/page.tsx`
- `src/app/(protected)/origen-fondos/exchanges/page.tsx`
- `src/app/(protected)/origen-fondos/wallets/[walletId]/page.tsx`
- `src/app/(protected)/origen-fondos/wallets/page.tsx`
- `src/app/(protected)/panel/AssetSearch.tsx`
- `src/app/(protected)/panel/InvestorDashboard.tsx`
- `src/app/(protected)/recomendaciones/page.tsx`
- `src/app/(protected)/riesgo/page.tsx`
- `src/app/(protected)/score-tributario/page.tsx`
- `src/app/(protected)/simulador/page.tsx`
- `src/app/(protected)/tareas/page.tsx`
- `src/app/(protected)/tax/book/page.tsx`
- `src/app/(protected)/tributario/page.tsx`
- `src/app/(protected)/workflows/page.tsx`
- `src/app/admin/audit/page.tsx`
- `src/app/admin/chat/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/api/audit/dashboard/route.ts`
- `src/app/api/tax/evidence/route.ts`
- `src/app/api/tax/health/route.ts`
- `src/app/blocked/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/como-funciona/page.tsx`
- `src/app/cookies/page.tsx`
- `src/app/legal/comercial/page.tsx`
- `src/app/login/page.tsx`
- `src/app/mantenimiento/page.tsx`
- `src/app/not-found.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/planes/page.tsx`
- `src/app/preguntas/page.tsx`
- `src/app/privacidad/page.tsx`
- `src/app/quienes-somos/page.tsx`
- `src/app/register/page.tsx`
- `src/app/terminos/page.tsx`
- `src/app/verify/report/[validationCode]/page.tsx`
- `src/app/verify/report/page.tsx`
- `src/app/verify/staging/[validationCode]/page.tsx`
- `src/components/CookieBanner.tsx`
- `src/components/auth/AuthEntryTrustOverlay.tsx`
- `src/components/auth/TwoFASetupPanel.tsx`
- `src/components/bank/BankTabs.tsx`
- `src/components/billing/BillingCancellationActions.tsx`
- `src/components/billing/BillingCheckoutButton.tsx`
- `src/components/billing/BillingCheckoutStatusBanner.tsx`
- `src/components/billing/BillingInvoicesPanel.tsx`
- `src/components/billing/BillingPaymentStatusBanner.tsx`
- `src/components/billing/BillingStatusPanel.tsx`
- `src/components/billing/SubscriptionPortalPanel.tsx`
- `src/components/brand/Logo.tsx`
- `src/components/chat/ChatWidget.tsx`
- `src/components/crypto-first/CryptoFirstModulePage.tsx`
- `src/components/landing/LandingConversacional.tsx`
- `src/components/profile/UserProfileDropdown.tsx`
- `src/components/public/PublicLayout.tsx`
- `src/components/seo/SeoContentPage.tsx`
- `src/components/staking/StakingPage.tsx`
- `src/components/subscription/PlanComparison.tsx`
- `src/components/subscription/UpgradeCard.tsx`
- `src/components/subscription/UpgradeModal.tsx`
- `src/components/wealth/WealthFlowPage.tsx`

## Inventario — archivos con fuentes hardcodeadas (`Manrope`, `font-family` inline)

- `src/app/(protected)/bank/uploads/[id]/page.tsx`
- `src/app/(protected)/import/bank/page.tsx`
- `src/app/(protected)/memoria-tributaria/page.tsx`
- `src/app/(protected)/tributario/page.tsx`
- `src/app/blocked/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/como-funciona/page.tsx`
- `src/app/cookies/page.tsx`
- `src/app/layout.tsx`
- `src/app/legal/comercial/page.tsx`
- `src/app/planes/page.tsx`
- `src/app/preguntas/page.tsx`
- `src/app/privacidad/page.tsx`
- `src/app/quienes-somos/page.tsx`
- `src/app/terminos/page.tsx`
- `src/app/verify/report/[validationCode]/page.tsx`
- `src/components/CookieBanner.tsx`
- `src/components/auth/AuthEntryTrustOverlay.tsx`
- `src/components/landing/LandingConversacional.tsx`
- `src/components/seo/SeoContentPage.tsx`
