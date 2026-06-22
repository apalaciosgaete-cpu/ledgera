# Guía de Deploy en Vercel — LEDGERA

> **Advertencia crítica resuelta:** El script de build anterior ejecutaba `prisma db push --accept-data-loss` en cada deploy. Esto fue eliminado. **Las migraciones de base de datos nunca deben ejecutarse automáticamente en el build de Vercel.**

---

## 1. Requisitos Previos

- [ ] Cuenta en [Vercel](https://vercel.com)
- [ ] Proyecto configurado en Vercel (ya existe: `prj_9GofBloeCC0iVvoX3XISlEfZKLDj`)
- [ ] Base de datos PostgreSQL provisionada (Vercel Postgres, Neon, Supabase, AWS RDS, etc.)
- [ ] Node.js 20+ localmente

---

## 2. Estructura de Deploy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
   Git Push    ──►   Vercel Build  ──►   Next.js Serverless
               │     (next build)    │     Functions (Node 20)
               │     prisma generate │
               │     (postinstall)   │
               └─────────────┘     └─────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  PostgreSQL  │
                                    │   (fra1)     │
                                    └─────────────┘
```

---

## 3. Configuración de Base de Datos

### 3.1 Crear base de datos (si no existe)

**Opción A: Vercel Postgres (recomendado)**
```bash
# Desde el dashboard de Vercel:
# Storage > Create New > PostgreSQL > Region: Frankfurt (fra1) > Connect to Project
```

**Opción B: Neon**
```bash
# Crear proyecto en https://neon.tech
# Usar la connection string del pooler (PgBouncer) para DATABASE_URL
# Usar la connection string directa para DIRECT_URL
```

### 3.2 Variables de conexión

| Variable | Uso | Pooler |
|----------|-----|--------|
| `DATABASE_URL` | Queries de la app (Prisma Client) | ✅ Sí (pgbouncer) |
| `DIRECT_URL` | Migraciones (Prisma Migrate) | ❌ No (directa) |

Ejemplo para Vercel Postgres:
```
DATABASE_URL=postgres://default:...@ep-...-pooler.us-east-1.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15
DIRECT_URL=postgres://default:...@ep-....us-east-1.postgres.vercel-storage.com/verceldb?connect_timeout=15
```

### 3.3 Ejecutar migraciones iniciales (MANUAL, solo una vez)

```bash
# 1. Asegúrate de tener DIRECT_URL configurado en tu .env local
# 2. Ejecuta desde tu máquina (NO en Vercel):

npx prisma migrate deploy
# o si aún no tienes migraciones:
npx prisma migrate dev --name init

# 3. Verificar conexión:
npx prisma db pull
```

> ⚠️ **NUNCA** agregues `prisma migrate deploy` ni `prisma db push` al `buildCommand` de Vercel.

---

## 4. Variables de Entorno en Vercel

Configura en **Vercel Dashboard > Project Settings > Environment Variables**:

### Obligatorias (App no arranca sin ellas)

| Variable | Entornos | Secret |
|----------|----------|--------|
| `DATABASE_URL` | Production, Preview, Development | ✅ |
| `DIRECT_URL` | Production, Preview, Development | ✅ |
| `APP_SECRET` | Production, Preview, Development | ✅ |
| `ENCRYPTION_KEY` | Production, Preview, Development | ✅ |
| `NEXT_PUBLIC_APP_URL` | Production, Preview, Development | ❌ |

### Funcionalidad completa

| Variable | Entornos | Secret | Propósito |
|----------|----------|--------|-----------|
| `SENTRY_DSN` | Production, Preview | ✅ | Monitoreo de errores |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production, Preview | ❌ | Analytics |
| `RESEND_API_KEY` | Production, Preview | ✅ | Emails |
| `VAPID_PRIVATE_KEY` | Production, Preview | ✅ | Web Push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production, Preview | ❌ | Web Push |

Puedes copiar el contenido de `.env.example` como referencia.

---

## 5. Deploy

### 5.1 Deploy automático (Git)

```bash
# Cada push a main dispara deploy automático
git push origin main
```

Configurado en `vercel.json`:
- `main`: ✅ Deploy automático (Production)
- `staging`: ✅ Deploy automático (Preview)
- `develop`: ❌ No deploya automáticamente

### 5.2 Deploy manual (CLI)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy a Preview
vercel

# Deploy a Production
vercel --prod

# Con variables específicas
vercel --build-env NEXT_PUBLIC_APP_URL=https://ledgera.cl
```

---

## 6. Verificación Post-Deploy

### Checklist de smoke tests

```bash
# 1. Health check básico
curl https://ledgera.cl/api/health
# Esperado: {"status":"ok"}

# 2. Conexión a base de datos
curl https://ledgera.cl/api/health/db
# Esperado: {"status":"ok","db":"connected"}

# 3. Prisma Client generado correctamente
# Revisar logs de build en Vercel Dashboard:
# "prisma:client:libraryEngine ... loaded"
```

### Endpoints críticos a validar

- [ ] `GET /` — Landing page carga
- [ ] `GET /dashboard` — Redirige a login si no hay sesión
- [ ] `POST /api/auth/login` — Login funciona
- [ ] `GET /api/investor/dashboard` — Datos del dashboard (con auth)
- [ ] `GET /api/tax/overview` — Resumen tributario (con auth)
- [ ] Generación de PDF reporte tributario (con auth)

---

## 7. Operaciones Post-Deploy

### 7.1 Agregar un nuevo exchange connector

1. Implementar normalizador en `src/modules/integrations/exchanges/{exchange}/`
2. Verificar que no escribe directo al motor tributario (solo `portfolio_movements`)
3. Deploy a Preview → test → merge a `main`

### 7.2 Modificar schema de Prisma

```bash
# 1. Desarrollo local: crear migración
npx prisma migrate dev --name descripcion_cambio

# 2. Commit del archivo de migración generado
#    (ej: prisma/migrations/20240605120000_descripcion_cambio/)

# 3. Deploy a Vercel (NO ejecuta migración automáticamente)

# 4. Ejecutar migración manualmente en producción:
DIRECT_URL="..." npx prisma migrate deploy
```

### 7.3 Backups de base de datos

- **Vercel Postgres**: Backups automáticos diarios. Restaurar desde dashboard.
- **Neon**: PITR (Point-in-Time Recovery) configurable.
- **Manual**: `pg_dump $DIRECT_URL > backup_$(date +%Y%m%d_%H%M%S).dump`

---

## 8. Troubleshooting

### Error: "Prisma Client could not locate the Query Engine"

**Causa:** El cliente de Prisma no se generó en el entorno serverless.

**Solución:**
```json
// package.json — ya configurado:
"postinstall": "prisma generate"
```

Si persiste, agregar explícitamente:
```bash
# En Vercel Dashboard > Project Settings > Build & Development Settings
# Build Command: prisma generate && next build
```

### Error: "Can't reach database server"

**Causa:** `DATABASE_URL` apunta a la connection string directa en vez de al pooler.

**Solución:** Usar la URL del pooler para `DATABASE_URL` (sin `?schema=public` de más).

### Error: "Migration engine error" durante build

**Causa:** Intentaste correr `prisma migrate deploy` en el build.

**Solución:** El `vercel.json` y `package.json` corregidos ya eliminaron esto. Verifica que tu build command sea solo `next build`.

### Error: "Serverless Function has timed out" en importaciones

**Causa:** Importar CSVs grandes o sincronizar exchanges excede el límite de 10s default.

**Solución:** Ya configurado en `vercel.json`:
```json
"src/app/api/import/**/*.ts": { "maxDuration": 60 }
```

### Cold starts lentos

**Causa:** Prisma Client en serverless reinicializa conexiones.

**Solución:**
- Usar `DATABASE_URL` con `pgbouncer=true` (ya configurado)
- Considerar implementar Prisma Accelerate si la latencia persiste:
  ```bash
  npx prisma accelerate enable
  # Cambiar DATABASE_URL por la URL de Prisma Accelerate
  ```

---

## 9. Configuración de Dominio Personalizado

```bash
# Vercel CLI
vercel domains add ledgera.cl

# O desde Dashboard:
# Project Settings > Domains > Add
# Configurar DNS: A record → 76.76.21.21 (Vercel)
# O CNAME → cname.vercel-dns.com
```

Redirección `www` → apex ya configurada en `next.config.ts` y `vercel.json`.

---

## 10. Rollback

```bash
# Vercel permite revertir a cualquier deploy anterior
# Dashboard > Deployments > ... > Promote to Production

# O via CLI:
vercel --prod --version anterior-deploy-id
```

---

## Archivos de deploy gestionados

| Archivo | Propósito |
|---------|-----------|
| `vercel.json` | Configuración de build, funciones, crons, headers, redirects |
| `.env.example` | Template de variables de entorno |
| `DEPLOY.md` | Esta guía |
| `next.config.ts` | Configuración de Next.js (headers de seguridad, rewrites) |
| `package.json` | Scripts de build corregidos |

---

## Contacto / Soporte

- Vercel Status: https://www.vercel-status.com
- Prisma Docs (Deploy to Vercel): https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel
