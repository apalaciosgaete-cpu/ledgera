# Roadmap LEDGERA — Bloques Cerrables

> **Versión:** 1.0  
> **Metodología:** Entregas por capas. Cada fase termina con un producto usable y medible.  
> **Principio:** No se avanza de fase sin que la anterior esté cerrada, probada y documentada.

---

## Cómo leer este roadmap

Cada bloque tiene:
- **Entregable:** Qué se toca físicamente en la UI o API.
- **Criterios de cierre (Definition of Done):** Checklist técnico y de producto.
- **Dependencias:** Qué bloques deben existir antes.
- **Riesgo:** Qué puede salir mal.
- **Estimación:** Complejidad relativa (S / M / L / XL).
- **Tickets derivados:** Desglose en tareas concretas.

---

## Fase A — Capa 1: LEDGERA se entiende

**Objetivo:** Un usuario nuevo entra, entiende cuánto tiene y cómo le va en menos de 10 segundos.  
**Duración estimada:** 2–3 semanas  
**Equipo:** 1 frontend + 1 backend  

---

### A.1 — Dashboard Inversor

| Campo | Valor |
|-------|-------|
| **Bloque** | 1.1 Dashboard Inversor |
| **Entregable** | Vista `/dashboard` funcional y responsive |
| **Estimación** | M |
| **Dependencias** | Auth básico (login/sesión), modelo `PortfolioMovement` con datos de prueba |

#### Criterios de cierre (DoD)

- [ ] Patrimonio total CLP con timestamp de última actualización de precio.
- [ ] Rentabilidad total % con indicador visual (verde/rojo).
- [ ] Ganancia/pérdida no realizada calculada por FIFO.
- [ ] Distribución por activo (gráfico donut, mínimo 5 colores).
- [ ] Mejor y peor activo (por rentabilidad %) con selector de período (24h / 7d / 30d / YTD / total).
- [ ] Estado tributario simple: etiqueta `Al día`, `Revisar`, `Declara este año`, `Urgente`.
- [ ] Próxima acción recomendada contextual (ver definición en arquitectura).
- [ ] Empty state ilustrado cuando no hay movimientos, con CTA a `/import`.
- [ ] Responsive correcto: mobile cards apiladas, desktop grid 2x2.
- [ ] Carga inicial < 1.5s (Time to First Meaningful Paint).
- [ ] Tests: al menos 3 casos de uso (usuario vacío, usuario con 1 activo, usuario con múltiples activos).

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| A.1.1 | Endpoint `GET /api/investor/dashboard` con agregaciones | Backend | Backend |
| A.1.2 | Servicio de precios en tiempo real (CoinGecko/CMC) con cache Redis/memory | Backend | Backend |
| A.1.3 | Componente `DashboardSummary` (patrimonio + rentabilidad) | Frontend | Frontend |
| A.1.4 | Componente `AssetAllocationChart` (donut) | Frontend | Frontend |
| A.1.5 | Componente `TopMovers` (mejor/peor activo) | Frontend | Frontend |
| A.1.6 | Componente `TaxStatusBadge` + `NextActionBanner` | Frontend | Frontend |
| A.1.7 | Empty state `/dashboard` | Frontend | Frontend |
| A.1.8 | Tests E2E dashboard | QA / Frontend | Frontend |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Precios desactualizados generan desconfianza | Cache de 60s + indicador visual de "última actualización" |
| FIFO lento con muchos movimientos | Pre-calcular en `AnnualTaxSummary`, no calcular en cada request |

---

### A.2 — Mis Inversiones

| Campo | Valor |
|-------|-------|
| **Bloque** | 1.2 Mis Inversiones |
| **Entregable** | Vista `/investments` con tabla de activos |
| **Estimación** | S |
| **Dependencias** | A.1 (servicio de precios y FIFO) |

#### Criterios de cierre (DoD)

- [ ] Tabla simple: activo, cantidad, precio actual, valor actual CLP, costo estimado FIFO, ganancia/pérdida, rentabilidad %.
- [ ] Tooltip en "costo estimado" explicando método FIFO.
- [ ] Ordenamiento por valor, rentabilidad o nombre.
- [ ] Filtro básico por tipo de activo (crypto, fiat, otros).
- [ ] Responsive: tabla scrollable en mobile, cards opcional.
- [ ] Tests: ordenamiento y cálculo de costo FIFO correcto.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| A.2.1 | Endpoint `GET /api/investor/investments` (lista paginada) | Backend | Backend |
| A.2.2 | Componente `InvestmentsTable` con sort/filters | Frontend | Frontend |
| A.2.3 | Hook `usePortfolioCalculations` reusable entre dashboard e inversiones | Frontend | Frontend |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Usuario confunde "costo estimado" con exacto | Tooltip + nota en UI + documentación |

---

### A.3 — Staking Simple

| Campo | Valor |
|-------|-------|
| **Bloque** | 1.3 Staking Simple |
| **Entregable** | Vista `/investments/staking` + movimiento tipo `STAKING_REWARD` |
| **Estimación** | M |
| **Dependencias** | A.1, A.2, modelo `PortfolioMovement` con `type = STAKING_REWARD` |

#### Criterios de cierre (DoD)

- [ ] Movimiento tipo `STAKING_REWARD` registrable manualmente y visible en tabla.
- [ ] Ingresos acumulados por staking mostrados en CLP.
- [ ] Staking por activo (cuánto generó cada uno).
- [ ] Separación visual clara entre staking y ganancia por venta.
- [ ] Etiqueta "Ingreso potencialmente declarable" con tooltip explicativo.
- [ ] Staking incluido en cálculo de patrimonio total del dashboard.
- [ ] Tests: staking reward genera `PortfolioMovement` correcto sin afectar FIFO de ventas.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| A.3.1 | Extender `PortfolioMovement.type` con `STAKING_REWARD` | Backend | Backend |
| A.3.2 | Endpoint `POST /api/movements` aceptando staking | Backend | Backend |
| A.3.3 | Vista `/investments/staking` con tabla y totales | Frontend | Frontend |
| A.3.4 | Actualizar dashboard para incluir staking en totales | Frontend | Frontend |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Usuario no entiende por qué staking es "ingreso" y no "ganancia de capital" | Tooltip + contenido educativo en `/blog` o `/como-funciona` |

---

## Fase B — Capa 2: LEDGERA responde si declarar o pagar

**Objetivo:** El usuario sabe, sin entender FIFO, si debe declarar o pagar impuestos.  
**Duración estimada:** 3–4 semanas  
**Equipo:** 1 backend (motor tributario) + 1 frontend + 0.5 producto (copy legal)  

---

### B.1 — Resumen Tributario Simple

| Campo | Valor |
|-------|-------|
| **Bloque** | 2.1 Resumen Tributario Simple |
| **Entregable** | Vista `/tax/overview` con estado claro |
| **Estimación** | L |
| **Dependencias** | A.1, A.2, A.3 (todos los movimientos deben existir), motor de cálculo FIFO anual |

#### Criterios de cierre (DoD)

- [ ] Año tributario seleccionable (default: año actual, editable: año anterior).
- [ ] Ganancias realizadas (ventas con rentabilidad positiva).
- [ ] Pérdidas realizadas (ventas con rentabilidad negativa).
- [ ] Ingresos por staking consolidados.
- [ ] Base imponible estimada en CLP.
- [ ] Impuesto estimado (regla simple: base imponible × tasa efectiva estimada).
- [ ] Estado visual: `Sin acción` / `Declarar` / `Pagar` / `Revisar`.
- [ ] Explicación simple de por qué está en ese estado (copy de 1–2 líneas).
- [ ] Cálculo ejecutado en background si hay > 500 movimientos (no bloquear UI).
- [ ] Tests: escenarios de usuario sin ventas, con ganancias, con pérdidas, con staking.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| B.1.1 | Motor FIFO anual con cálculo de PnL realizada | Backend | Backend |
| B.1.2 | Tabla `AnnualTaxSummary` con recálculo por demanda | Backend | Backend |
| B.1.3 | Endpoint `GET /api/tax/overview?year=` | Backend | Backend |
| B.1.4 | Componente `TaxStatusCard` con estados visuales | Frontend | Frontend |
| B.1.5 | Componente `TaxBreakdown` (ganancias + pérdidas + staking) | Frontend | Frontend |
| B.1.6 | Copy legal para cada estado tributario | Producto | Producto |
| B.1.7 | Tests E2E resumen tributario | QA | QA |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Cálculo FIFO incorrecto destruye confianza | Comparar salida con hoja de cálculo manual de referencia |
| Copy legal impreciso genera liability | Revisión por abogado tributario antes de cerrar |

---

### B.2 — Revisión Tributaria

| Campo | Valor |
|-------|-------|
| **Bloque** | 2.2 Revisión Tributaria |
| **Entregable** | Vista `/tax/review` con lista de operaciones clasificables |
| **Estimación** | M |
| **Dependencias** | B.1 (motor FIFO genera los tax events) |

#### Criterios de cierre (DoD)

- [ ] Lista de operaciones tributarias (tax events) con paginación.
- [ ] Clasificación simple por tipo: Venta, Staking, Dividendo, Airdrop, Hard Fork, Otro.
- [ ] Alertas de revisión: movimiento sin categoría, precio faltante, exchange desconocido.
- [ ] Indicador `taxHealth`: verde / amarillo / rojo con conteo de alertas.
- [ ] Cambios bloqueados si período cerrado (reglas: usuario no puede, contador sí con motivo, admin sin restricción).
- [ ] Campo `classifiedBy` preservado (`USER`, `ACCOUNTANT`, `SYSTEM`).
- [ ] Tests: usuario intenta editar período cerrado → 409 Conflict.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| B.2.1 | Endpoint `GET /api/tax/events?year=` con filtros | Backend | Backend |
| B.2.2 | Endpoint `PATCH /api/tax/events/:id/classify` | Backend | Backend |
| B.2.3 | Middleware `requirePeriodOpen` | Backend | Backend |
| B.2.4 | Componente `TaxEventList` con filtros y paginación | Frontend | Frontend |
| B.2.5 | Componente `TaxHealthIndicator` | Frontend | Frontend |
| B.2.6 | Modal de confirmación al clasificar | Frontend | Frontend |

---

### B.3 — Reportes Tributarios

| Campo | Valor |
|-------|-------|
| **Bloque** | 2.3 Reportes Tributarios |
| **Entregable** | Vistas `/tax/reports` con descarga de CSV y PDF |
| **Estimación** | L |
| **Dependencias** | B.1, B.2 (tax events calculados y revisados) |

#### Criterios de cierre (DoD)

- [ ] CSV Técnico (con IDs internos para debugging).
- [ ] CSV Contador (sin IDs, columnas fiscales legibles, compatible Excel).
- [ ] PDF Informativo (resumen gráfico, sin técnico FIFO).
- [ ] PDF Contador (detalle + resumen de criterios aplicados).
- [ ] QR de verificación visible en PDF (apunta a `/verify/report/[hash]`).
- [ ] Hash SHA-256 visible en pie de página del PDF.
- [ ] Bloqueo strict si `taxHealth !== 'OK'` (deshabilitar botón con mensaje claro).
- [ ] Botón de descarga deshabilitado hasta que período esté revisado.
- [ ] Tests: hash verificable, PDF genera sin errores, bloqueo funciona.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| B.3.1 | Servicio `ReportGenerator` (CSV + PDF) | Backend | Backend |
| B.3.2 | Tabla `ReportValidation` con hash y revocación | Backend | Backend |
| B.3.3 | Endpoint `POST /api/tax/reports` (generar) | Backend | Backend |
| B.3.4 | Endpoint `GET /api/tax/reports/:id/download` | Backend | Backend |
| B.3.5 | Componente `ReportGeneratorPanel` | Frontend | Frontend |
| B.3.6 | Componente `ReportHistory` con QR preview | Frontend | Frontend |
| B.3.7 | Vista pública `/verify/report/[code]` | Frontend | Frontend |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Generación de PDF pesada causa timeout en serverless | Usar `maxDuration: 60` en Vercel + generación async con `JobQueue` |
| Reporte con datos incorrectos genera liability | Bloqueo strict si hay alertas sin resolver |

---

## Fase C — Capa 3: LEDGERA puede ser defendido

**Objetivo:** Un contador o auditor puede verificar cualquier cálculo sin pedir explicaciones externas.  
**Duración estimada:** 2–3 semanas  
**Equipo:** 1 backend (audit trail) + 0.5 frontend  

---

### C.1 — Auditoría de Movimientos y Tax Events

| Campo | Valor |
|-------|-------|
| **Bloque** | 3.1 Auditoría Movimientos/TaxEvents |
| **Entregable** | Vista `/audit` con trazabilidad completa |
| **Estimación** | M |
| **Dependencias** | B.1, B.2, B.3 |

#### Criterios de cierre (DoD)

- [ ] Movimiento origen visible desde tax event (navegación bidireccional).
- [ ] Evento tributario derivado visible desde movimiento.
- [ ] FIFO explicable: mostrar qué lotes se consumieron y en qué orden.
- [ ] Cost basis visible por evento (en USD y CLP).
- [ ] PnL visible con desglose (proceeds - cost basis - fees).
- [ ] Trazabilidad por fecha: línea de tiempo del movimiento → evento → reporte.
- [ ] Tests: para un evento dado, se puede reconstruir el cálculo manualmente.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| C.1.1 | Endpoint `GET /api/audit/tax-event/:id/trace` | Backend | Backend |
| C.1.2 | Endpoint `GET /api/audit/movement/:id/events` | Backend | Backend |
| C.1.3 | Componente `AuditTrace` (timeline movimiento → evento) | Frontend | Frontend |
| C.1.4 | Componente `FifoExplanation` (lotes consumidos) | Frontend | Frontend |

---

### C.2 — Auditoría de Períodos

| Campo | Valor |
|-------|-------|
| **Bloque** | 3.2 Auditoría Períodos |
| **Entregable** | Vista `/tax/periods` con cierre/reapertura trazable |
| **Estimación** | M |
| **Dependencias** | B.2 (bloqueo de período), C.1 |

#### Criterios de cierre (DoD)

- [ ] Cierre de período con snapshot de todos los tax events y hashes.
- [ ] Reapertura con motivo obligatorio.
- [ ] Bloqueo real de edición (DB constraint + middleware).
- [ ] Historial inmutable en `TaxPeriodAuditLog`: actor, fecha, IP, user agent, metadata.
- [ ] Snapshot de estado del período al momento de cierre (`TaxPeriodSnapshot`).
- [ ] Tests: reapertura genera log, modificación en período cerrado es rechazada.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| C.2.1 | Endpoint `POST /api/tax/periods/:year/close` | Backend | Backend |
| C.2.2 | Endpoint `POST /api/tax/periods/:year/reopen` | Backend | Backend |
| C.2.3 | Middleware `requirePeriodOpen` con validación DB | Backend | Backend |
| C.2.4 | Tabla `TaxPeriodSnapshot` con hash de contenido | Backend | Backend |
| C.2.5 | Componente `PeriodAdminPanel` | Frontend | Frontend |
| C.2.6 | Componente `PeriodAuditLog` | Frontend | Frontend |

---

### C.3 — Auditoría DDJJ

| Campo | Valor |
|-------|-------|
| **Bloque** | 3.3 Auditoría DDJJ |
| **Entregable** | Vista `/tax/declarations/audit` + verificación pública |
| **Estimación** | M |
| **Dependencias** | B.3 (reportes generados), C.2 |

#### Criterios de cierre (DoD)

- [ ] Máquina de estados implementada: `DRAFT` → `REVIEWED` → `CONFIRMED` → `EXPORTED`.
- [ ] Cada transición genera `TaxDeclarationAuditLog` con hash de estado anterior y nuevo.
- [ ] Estados de auditoría: `DECLARATION_CREATED`, `DECLARATION_REVIEWED`, `DECLARATION_CONFIRMED`, `DECLARATION_VOIDED`, `DECLARATION_EXPORTED`, `DECLARATION_INTEGRITY_VERIFIED`.
- [ ] Vista `/tax/declarations/audit` con timeline de la declaración.
- [ ] Verificación pública `/verify/declaration/:code` (hash + fecha + estado, sin datos sensibles).
- [ ] Tests: hash de declaración coincide con contenido generado.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| C.3.1 | Máquina de estados `TaxDeclaration` con validaciones | Backend | Backend |
| C.3.2 | Servicio de hash de declaración (SHA-256) | Backend | Backend |
| C.3.3 | Endpoint `GET /api/tax/declarations/:id/audit` | Backend | Backend |
| C.3.4 | Componente `DeclarationAuditTrail` | Frontend | Frontend |
| C.3.5 | Vista pública `/verify/declaration/:code` | Frontend | Frontend |

---

## Fase D — Capa 4: LEDGERA administra clientes reales

**Objetivo:** LEDGERA opera como SaaS con planes, pagos y administración de usuarios.  
**Duración estimada:** 2–3 semanas  
**Equipo:** 1 backend (billing/auth) + 1 frontend  

---

### D.1 — Admin Usuarios

| Campo | Valor |
|-------|-------|
| **Bloque** | 4.1 Admin Usuarios |
| **Entregable** | Vista `/admin/users` |
| **Estimación** | M |
| **Dependencias** | Auth con roles (`ADMIN`), soft delete implementado |

#### Criterios de cierre (DoD)

- [ ] Listar usuarios con paginación, búsqueda y filtros.
- [ ] Ver estado: `ACTIVE`, `SUSPENDED`, `PENDING_DELETION`, `ANONYMIZED`.
- [ ] Suspender usuario (reversible, deshabilita login).
- [ ] Reactivar usuario.
- [ ] Eliminar usuario controladamente:
  - Soft delete default (datos preservados 6 años).
  - Anonymization (reemplaza PII por hashes, conserva movimientos).
  - Hard delete solo si usuario sin movimientos.
- [ ] Ver plan y fecha de suscripción.
- [ ] Tests: soft delete impide login, anonymization remueve email/RUT.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| D.1.1 | Endpoint `GET /api/admin/users` con filtros | Backend | Backend |
| D.1.2 | Endpoint `PATCH /api/admin/users/:id/status` | Backend | Backend |
| D.1.3 | Endpoint `DELETE /api/admin/users/:id` (controlado) | Backend | Backend |
| D.1.4 | Componente `AdminUserTable` | Frontend | Frontend |
| D.1.5 | Modal de confirmación para cada acción destructiva | Frontend | Frontend |

---

### D.2 — Admin Audit

| Campo | Valor |
|-------|-------|
| **Bloque** | 4.2 Admin Audit |
| **Entregable** | Vista `/admin/audit` |
| **Estimación** | S |
| **Dependencias** | D.1 (acciones administrativas generan logs) |

#### Criterios de cierre (DoD)

- [ ] Tabla `AdminAuditLog` poblada automáticamente en cada acción admin.
- [ ] Campos: actor, acción, target, IP, user agent, metadata, timestamp.
- [ ] Filtros por actor, acción, rango de fechas.
- [ ] Paginación (mínimo 50 items por página).
- [ ] Tests: cada acción de D.1 genera log automático.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| D.2.1 | Middleware `auditAdminAction` | Backend | Backend |
| D.2.2 | Endpoint `GET /api/admin/audit` con filtros | Backend | Backend |
| D.2.3 | Componente `AdminAuditLog` | Frontend | Frontend |

---

### D.3 — Planes y Acceso

| Campo | Valor |
|-------|-------|
| **Bloque** | 4.3 Planes y Acceso |
| **Entregable** | Planes funcionales con bloqueo/upsell |
| **Estimación** | L |
| **Dependencias** | D.1, modelo `BillingSubscription` |

#### Criterios de cierre (DoD)

- [ ] Planes definidos: `Free`, `Basic`, `Pro`, `Business`.
- [ ] Matriz de features por plan documentada.
- [ ] Features visibles pero diferenciadas (activo vs bloqueado con candado).
- [ ] Bloqueo por plan con mensaje contextual (no genérico).
- [ ] Middleware `requireActiveSubscription` operativo.
- [ ] Middleware `requirePlan(minPlan)` operativo.
- [ ] Pantalla 402 homogénea: `<UpgradeRequired plan="pro" feature="tax-reports" />`.
- [ ] Tests: usuario Free accede a `/tax/reports` → 402 con upsell.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| D.3.1 | Servicio `PlanService` con matriz de features | Backend | Backend |
| D.3.2 | Middleware `requireActiveSubscription` | Backend | Backend |
| D.3.3 | Middleware `requirePlan` | Backend | Backend |
| D.3.4 | Componente `FeatureGate` (wrapper por plan) | Frontend | Frontend |
| D.3.5 | Componente `UpgradeRequired` (pantalla 402) | Frontend | Frontend |
| D.3.6 | Integración proveedor de pagos (Flow/Khipu/Stripe) | Backend | Backend |

---

## Fase E — Capa 5: LEDGERA escala

**Objetivo:** Reducir carga manual con importaciones e integraciones.  
**Duración estimada:** 3–4 semanas  
**Equipo:** 1 backend (integraciones) + 0.5 frontend  

---

### E.1 — Importación Manual

| Campo | Valor |
|-------|-------|
| **Bloque** | 5.1 Importación Manual |
| **Entregable** | Vistas `/import` con CSV |
| **Estimación** | M |
| **Dependencias** | A.1 (dashboard muestra resultados) |

#### Criterios de cierre (DoD)

- [ ] Upload de CSV con drag & drop.
- [ ] Validación previa: headers requeridos, tipos de datos, fechas válidas.
- [ ] Preview de primeras 10 filas antes de confirmar.
- [ ] Confirmación explícita del usuario.
- [ ] Normalización a `portfolio_movements`.
- [ ] Errores claros: fila 23, columna 'price': valor no numérico.
- [ ] Rebuild tributario automático post-importación (async).
- [ ] Tests: CSV válido crea N movimientos, CSV inválido rechaza con detalle.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| E.1.1 | Servicio `CsvParser` con validación de schema | Backend | Backend |
| E.1.2 | Endpoint `POST /api/import/csv/validate` | Backend | Backend |
| E.1.3 | Endpoint `POST /api/import/csv/confirm` | Backend | Backend |
| E.1.4 | Componente `CsvUploader` con drag & drop | Frontend | Frontend |
| E.1.5 | Componente `CsvPreviewTable` | Frontend | Frontend |
| E.1.6 | Job `RebuildTaxEngine` post-importación | Backend | Backend |

---

### E.2 — Integraciones Exchanges

| Campo | Valor |
|-------|-------|
| **Bloque** | 5.2 Integraciones Exchanges |
| **Entregable** | Conectores Binance, Coinbase, Kraken |
| **Estimación** | XL |
| **Dependencias** | E.1 (normalización de movimientos), modelo `ExchangeConnection` |

#### Criterios de cierre (DoD)

- [ ] Conector Binance (API key read-only).
- [ ] Conector Coinbase (OAuth preferido).
- [ ] Conector Kraken (API key).
- [ ] Normalizador común (Anti-Corruption Layer) con tabla de mapeo documentada.
- [ ] Tipos soportados: trades, depósitos, retiros, fees, staking rewards.
- [ ] API keys encriptadas en reposo (`ENCRYPTION_KEY`).
- [ ] No escribir directo al motor tributario (solo `portfolio_movements`).
- [ ] Sync periódico via cron (`/api/jobs/sync-exchanges`).
- [ ] Tests: payload de exchange X → `PortfolioMovement` normalizado correcto.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| E.2.1 | Arquitectura del normalizador común | Backend | Backend |
| E.2.2 | Servicio de encriptación de API keys | Backend | Backend |
| E.2.3 | Conector Binance con paginación | Backend | Backend |
| E.2.4 | Conector Coinbase OAuth | Backend | Backend |
| E.2.5 | Conector Kraken | Backend | Backend |
| E.2.6 | Vista `/integrations` para gestionar conectores | Frontend | Frontend |
| E.2.7 | Cron job de sincronización periódica | Backend | Backend |

#### Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| API keys robadas | Encriptación AES-256 + permisos read-only + rotación cada 90 días |
| Rate limiting de exchanges | Exponential backoff + cola de jobs (`JobQueue`) |
| Exchange cambia schema | Normalizador aislado + tests de contrato |

---

### E.3 — Seguridad y Operación

| Campo | Valor |
|-------|-------|
| **Bloque** | 5.3 Seguridad y Operación |
| **Entregable** | Configuración hardening + monitoreo |
| **Estimación** | M |
| **Dependencias** | Todas las fases anteriores |

#### Criterios de cierre (DoD)

- [ ] 2FA con TOTP (no SMS).
- [ ] Rate limiting por endpoint: login (5/15min), API (100/min), import (1 concurrente).
- [ ] Session rotation: refresh token 7 días, access token 15 min.
- [ ] CSRF protection (SameSite + token header).
- [ ] CSP estricto en `next.config.ts` (ya implementado, validar).
- [ ] Backups automáticos diarios de PostgreSQL.
- [ ] Restore documentado (RTO < 4h, RPO < 1h).
- [ ] Sentry configurado (frontend + backend + source maps).
- [ ] Logs operacionales estructurados (JSON) con retención 1 año.
- [ ] Webhook signature verification (si aplica).
- [ ] Política de retención de PII (anonimizar después de 1 año o según ley).
- [ ] Penetration test básico (OWASP ZAP o similar) con reporte.

#### Tickets derivados

| # | Ticket | Tipo | Owner |
|---|--------|------|-------|
| E.3.1 | Implementación TOTP 2FA | Backend | Backend |
| E.3.2 | Rate limiting con Redis/Upstash | Backend | Backend |
| E.3.3 | Session rotation + refresh tokens | Backend | Backend |
| E.3.4 | Validación CSP y headers de seguridad | DevOps / Backend | Backend |
| E.3.5 | Configuración backups y RTO/RPO | DevOps | DevOps |
| E.3.6 | Sentry source maps en CI/CD | DevOps | DevOps |
| E.3.7 | Pentest básico y reporte | Externo / Seguridad | Seguridad |

---

## Dependencias Cruzadas entre Fases

```
Fase A ──► Fase B ──► Fase C ──► Fase D ──► Fase E
  │          │           │           │           │
  │          │           │           │           └── E.1 (CSV) debe existir antes de E.2 (exchanges)
  │          │           │           └── D.3 requiere B.3 (reportes son feature de pago)
  │          │           └── C.3 requiere B.3 (auditoría de reportes generados)
  │          └── B.1 requiere A.2 (movimientos calculados)
  └── A.3 requiere A.1 (dashboard muestra staking)
```

### Reglas de avance

1. **No avanzar de fase sin cierre de bloques.** Un bloque se cierra cuando cumple todos sus criterios de DoD y tiene al menos una demo grabada.
2. **Fase B no inicia sin A cerrada.** El motor tributario necesita datos reales de inversión.
3. **Fase E puede paralelizarse con D.** La capa de integraciones no depende de planes/billing, pero sí de tener movimientos funcionales (Fase A).

---

## Métricas de Éxito por Fase

| Fase | Métrica | Target | Cómo medir |
|------|---------|--------|-----------|
| A | Time to Value | < 10 segundos | Usabilidad test: usuario nuevo entiende su patrimonio |
| B | Claridad tributaria | > 80% | Encuesta: "¿Entiendes si debes declarar?" Sí/No |
| C | Auditabilidad | 100% | Contador externo valida cálculo sin preguntas |
| D | Conversión Freemium | > 5% | Usuarios Free que pasan a Pro en 30 días |
| E | Operaciones manuales | < 20% | % de movimientos que vienen de import manual vs integración |

---

## Calendario Tentativo (8–10 semanas totales)

| Semana | Foco | Bloques | Entregable demo |
|--------|------|---------|-----------------|
| 1 | A.1 | Dashboard | Dashboard funcional con datos de prueba |
| 2 | A.2, A.3 | Inversiones + Staking | Usuario ve activos y staking |
| 3 | Cierre A, inicio B | — | **Release Alpha**: Capa 1 usable |
| 4 | B.1 | Resumen tributario | Usuario sabe si debe declarar |
| 5 | B.2, B.3 | Revisión + Reportes | Reporte PDF descargable |
| 6 | Cierre B, inicio C | — | **Release Beta**: Capa 2 clara |
| 7 | C.1, C.2, C.3 | Auditoría completa | Contador valida trazabilidad |
| 8 | D.1, D.2, D.3 | SaaS + Planes | Primer usuario paga |
| 9 | E.1, E.2 | Importaciones + Exchanges | Binance conectado |
| 10 | E.3 | Seguridad hardening | Pentest aprobado |

---

## Glosario de términos del roadmap

| Término | Significado |
|---------|-------------|
| **DoD** | Definition of Done. Criterios obligatorios para cerrar un bloque. |
| **FIFO** | First In, First Out. Método de cálculo de costo para impuestos. |
| **PnL** | Profit and Loss. Ganancia o pérdida realizada. |
| **Tax Event** | Evento tributario derivado de un movimiento (ej: venta genera ganancia de capital). |
| **DDJJ** | Declaración Jurada. Documento tributario formal. |
| **RTO** | Recovery Time Objective. Tiempo máximo para recuperar servicio tras caída. |
| **RPO** | Recovery Point Objective. Pérdida máxima de datos aceptable. |

---

*Documento generado como especificación de producto. Cada bloque puede convertirse directamente en épica de desarrollo.*
