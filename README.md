# LEDGERA

Plataforma web para ordenar movimientos cripto, valorizar activos y preparar respaldos tributarios para usuarios en Chile.

## Stack

- Next.js 14 / App Router
- React 18
- TypeScript
- Prisma
- PostgreSQL
- Vercel

## Scripts principales

```bash
npm run dev        # desarrollo local
npm run build      # build productivo
npm run lint       # revisión ESLint
npm run typecheck  # revisión TypeScript
npm run test:ci    # smoke test CI mínimo
```

## Rutas principales

- `/panel`
- `/origen-fondos`
- `/cryptoactivos`
- `/obligaciones-tributarias`
- `/declaraciones`
- `/configuracion`
- `/ayuda`

Las rutas legacy se redirigen desde `next.config.mjs`.

## Variables de entorno

Las variables locales no se versionan. Usar `.env.local` en desarrollo y variables de entorno configuradas en Vercel para producción.

Variables críticas:

- `DATABASE_URL`
- `DIRECT_URL`
- `APP_SECRET`
- `ENCRYPTION_KEY`
- `NEXT_PUBLIC_APP_URL`

## Deploy

Producción sale desde la rama `main` hacia el proyecto Vercel `ledgera`.

El check válido de producción es `Vercel – ledgera`.

Última actualización operativa: rutas legacy retiradas.
