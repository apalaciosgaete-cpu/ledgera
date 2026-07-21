# LEDGERA — Migración al sistema de diseño (Propuesta B "Cierre")

> **ESTADO: EN CORRECCIÓN ACTIVA.** La base del sistema está instalada, pero la auditoría visual detectó convivencia de paletas antiguas con los tokens nuevos. Desde esta actualización, la fuente TypeScript `src/styles/tokens.ts` ya no define una paleta independiente en hex; funciona como fachada hacia variables CSS (`var(--bg)`, `var(--text)`, `var(--accent)`, etc.).
>
> Cambios aplicados en `main` en esta fase:
> - `src/styles/tokens.ts`: eliminada paleta antigua clara/azul/verde; todos los colores apuntan al sistema CSS global.
> - `src/components/landing/LandingConversacional.tsx`: landing principal migrado desde azul/dorado hardcodeado a tokens LEDGERA.
> - `src/components/public/PublicLayout.tsx`: layout público, header, footer, CTA y shells legales normalizados a tokens.
> - `src/app/planes/page.tsx`: página comercial de planes migrada desde `emerald/slate/white` a tokens.
> - `src/app/blog/page.tsx`: página de blog migrada desde fallback `Manrope` y colores por artículo hacia tokens.
>
> Pendiente de barrido posterior: componentes protegidos y módulos secundarios que aún puedan usar colores hardcodeados por estado, marca, gráficos, QR, PDF o logos.

## Fundamento instalado

- `src/app/layout.tsx`: IBM Plex Mono vía `next/font/google` para datos técnicos; Manrope se sirve localmente y cubre display/body.
- `tailwind.config.ts`: tokens de color (`bg`, `bg-elev`, `accent`, `gain`, `loss`, `warn`, …), `fontFamily` (`display`/`body`/`mono`) y `borderRadius` (`DEFAULT` 10px, `card` 12px).
- `src/app/globals.css`: variables base del modo oscuro + remapeo de variables `--color-*` legadas al sistema actual.
- `src/styles/tokens.ts`: fachada TypeScript para consumidores inline, sin paleta propia.

## Mapa obligatorio de reemplazo

| Uso anterior | Token nuevo |
|---|---|
| Fondo página | `bg` / `var(--bg)` |
| Superficie/card | `bg-elev` / `var(--bg-elev)` |
| Superficie hundida | `bg-sunken` / `var(--bg-sunken)` |
| Borde | `border` / `var(--border)` |
| Borde fuerte | `border-strong` / `var(--border-strong)` |
| Texto primario | `text` / `var(--text)` |
| Texto secundario | `text-soft` / `var(--text-soft)` |
| Texto tenue | `text-faint` / `var(--text-faint)` |
| Acento/marca | `accent` / `var(--accent)` |
| Ganancia/confirmado | `gain` / `var(--gain)` |
| Pérdida/rechazado | `loss` / `var(--loss)` |
| Advertencia/pendiente | `warn` / `var(--warn)` |

Números, montos, folios, hashes y celdas tabulares deben usar `font-mono tabular-nums` o `fonts.mono`.

## Regla de exclusión

No re-tematizar estos casos salvo rediseño explícito:

- Fondos blancos de códigos QR, necesarios para escaneo.
- Logos y colores de marca de terceros: Google, Binance, bancos, exchanges, wallets y activos.
- Rutas de generación de PDF, `icon`, `apple-icon`, `opengraph-image`, `manifest` y assets de marca.
- Colores de estado que estén centralizados en `semanticTones` o variables semánticas del sistema.

## Criterio de aceptación para cerrar esta migración

La migración solo puede volver a marcarse como completada cuando:

1. No existan usos no justificados de `text-slate-*`, `bg-slate-*`, `text-gray-*`, `bg-gray-*`, `bg-emerald-*`, `text-emerald-*`, `text-white`, `bg-white/*` en pantallas de producto o páginas públicas.
2. No existan hex antiguos de identidad visual en componentes de UI, salvo logos, QR, PDF, imágenes o marcas externas.
3. Las páginas públicas principales (`/`, `/planes`, `/blog`, `/preguntas`, `/quienes-somos`, `/como-funciona` y legales) consuman `PublicLayout`/tokens.
4. Las pantallas protegidas usen `var(--bg)`, `var(--bg-elev)`, `var(--text)`, `var(--accent)`, `var(--gain)`, `var(--loss)` y `var(--warn)` o `semanticTones`.
5. El build de producción y el chequeo válido de Vercel (`Vercel – ledgera`) estén verdes.

## Notas de mantenimiento

- No crear nuevas paletas paralelas en componentes.
- No definir colores de marca LEDGERA en hex dentro de páginas.
- Si se necesita un nuevo matiz semántico, agregarlo primero en `globals.css` y exponerlo en `tailwind.config.ts`/`src/styles/tokens.ts`.
- Las excepciones deben quedar comentadas junto al uso, no escondidas como clases utilitarias genéricas.
