# Flujo de Importación y Staging — Arquitectura Operativa

> Documento de referencia. Actualizar cuando cambie el modelo, no cuando cambie la UI.

---

## 1. Principio central

**Nada entra directo al Portafolio.**

Toda fuente de datos — exchange, banco, archivo manual — pasa por una etapa de revisión
antes de generar un `PortfolioMovement`. Este invariante es la garantía de trazabilidad
completa: si un movimiento existe en el portafolio, existe su audit trail.

---

## 2. Flujo general

```
Ingesta externa
    │
    ▼
Staging (revisión)
    │
    ├─ Confirmado ──► PortfolioMovement ──► TaxEvent ──► Reporte
    │
    └─ Rechazado / Ignorado ──► Fin (auditado)
```

La columna izquierda es siempre **fuente externa** (exchange o banco).
La columna derecha es siempre **estado interno** (portafolio, tributario).
El staging es el único puente entre las dos.

---

## 3. Exchange (Binance Spot + Tax)

### Ingesta

- Binance Spot sincroniza operaciones de trading vía API (pares BTC, USDT, etc.).
- Binance Tax sincroniza historial de transferencias, P2P, earn, etc.
- Cada evento crea un `ExchangeImportRecord` con `status = PENDING`.
- El campo `normalizedJson` contiene la versión interpretada por LEDGERA.
- El campo `rawPayload` contiene el payload original de Binance (hasta 1500 chars en la API de detalle).

### Deduplicación Spot / Tax

Un mismo evento económico (e.g., un retiro) puede aparecer en Binance Spot **y** en Binance Tax.
La regla de agrupación:

- Si ya existe un `movementId` compartido → misma operación confirmada.
- Si no → ventana ±5 min + mismo `normalizedEventType` aproxima el grupo antes de confirmar.

El grupo siempre produce **un solo** `PortfolioMovement`. El registro BINANCE es el canónico
(tiene precio de ejecución real); BINANCE_TAX se vincula al mismo `movementId` sin crear un nuevo movimiento.

### Confirmación grupal

`POST /api/imports/staging/confirm`

- Recibe `recordIds[]` (todos los records del grupo).
- Crea `PortfolioMovement` desde el registro canónico (BINANCE preferido).
- Vincula los otros records al mismo `movementId`.
- Escribe `AdminAuditLog` con `BINANCE_IMPORT_CONFIRMED` + `decisionHash`.
- Dispara `rebuildTaxEvents`.

### Rechazo grupal

`POST /api/imports/staging/reject`

- Marca todos los records del grupo como `REJECTED`.
- Guarda `AdminAuditLog` con `BINANCE_IMPORT_REJECTED` + `decisionHash`.
- No crea `PortfolioMovement`.

---

## 4. Banco

### Ingesta

- El usuario sube un archivo CSV bancario o se importa vía integración.
- Cada fila genera un `BankMovement` con `status = IMPORTED`.
- El sistema puede categorizar automáticamente por `bankCategory`.

### Match masivo

`POST /api/imports/staging/bank/match/bulk`

- Escanea todos los movimientos en estado `IMPORTED` o `REVIEW`.
- Para cada uno, busca `PortfolioMovement` candidatos en ventana ±3 días, con monto compatible (±20% tras conversión CLP→USD al tipo del día).
- Scoring: fecha (0.4) + monto (0.3) + dirección (0.3).
- Umbrales:
  - `≥ 0.90` → Alta certeza → promovido a `REVIEW` con `stagingConfidence`.
  - `≥ 0.60` → Media certeza → promovido a `REVIEW`.
  - `< 0.60` → Sin candidato útil → permanece en `IMPORTED`.

### Ignorar sin match

`POST /api/imports/staging/bank/ignore-unmatched`

- Solo actúa sobre movimientos en `IMPORTED` (nunca `REVIEW`).
- Ignora únicamente aquellos con **cero** candidatos tras el scoring completo.
- Movimientos con al menos un candidato se dejan en `REVIEW` para decisión manual.

### Revisión individual

`POST /api/imports/staging/bank/review` — promueve un movimiento a `REVIEW` manualmente.

### Confirmación banco ↔ portafolio

`POST /api/imports/staging/bank/match/confirm`

- Recibe `bankMovementId`, `portfolioMovementId`, `confidence`, `reason`.
- Actualiza `BankMovement.status = MATCHED`, guarda `matchedPortfolioMovementId`.
- Escribe `BankReconciliationAuditLog` con `BANK_MATCH_CONFIRMED` + `decisionHash`.
- Guards: rechaza si ya está `MATCHED` o `IGNORED`.

### Ignorados persistentes

`POST /api/imports/staging/bank/reject` — marca como `IGNORED`.

- Los movimientos ignorados no aparecen en el kanban de staging.
- Permanecen en DB para auditoría futura.
- El `decisionHash` permite verificar que la decisión no fue alterada.

---

## 5. Auditoría y trazabilidad

### Logs

| Acción | Tabla | Campos clave |
|--------|-------|-------------|
| Exchange confirmado | `AdminAuditLog` | `BINANCE_IMPORT_CONFIRMED`, `metadata.importRecordId` |
| Exchange rechazado | `AdminAuditLog` | `BINANCE_IMPORT_REJECTED`, `metadata.importRecordId` |
| Banco ignorado | `BankReconciliationAuditLog` | `BANK_IMPORT_REJECTED`, `metadata.bankMovementIds` |
| Match confirmado | `BankReconciliationAuditLog` | `BANK_MATCH_CONFIRMED`, `portfolioMovementId` |

### Hash de decisión

Cada acción crítica guarda un `decisionHash` en el campo `metadata` del audit log.

```typescript
// src/shared/hash.ts
createStableSha256Hash(decisionPayload)
// Ordena claves antes de serializar → mismo objeto = mismo hash siempre
```

El `decisionPayload` incluye: `action`, `userId`, `ids`, `beforeStatus`, `afterStatus`, `at`.
Esto permite verificar off-chain que la decisión no fue alterada post-escritura.

### Timeline operacional

`GET /api/timeline/entity?id=...&type=STAGING|BANK|PORTFOLIO`

Reconstruye la línea de vida completa de cualquier entidad cruzando:
`ExchangeImportRecord → AdminAuditLog → PortfolioMovement → TaxEvent → TaxPeriodClose → ReportValidation`

Accesible desde el panel de detalle de cualquier card en `/importaciones`.

---

## 6. Modelos de datos relevantes

```
ExchangeImportRecord   status: PENDING | REVIEW | CONFIRMED | REJECTED
BankMovement           status: IMPORTED | REVIEW | MATCHED | IGNORED
PortfolioMovement      source: BINANCE | BINANCE_TAX | MANUAL | BANK_FILE
TaxEvent               movementId (1:1 con PortfolioMovement)
AdminAuditLog          metadata: JSON con decisionHash + beforeStatus + afterStatus
BankReconciliationAuditLog  metadata: JSON con decisionHash + beforeStatuses + afterStatus
```

---

## 7. Rutas API del flujo

```
# Exchange staging
GET  /api/imports/staging                    ← bandeja unificada
POST /api/imports/staging/confirm            ← confirmar grupo exchange
POST /api/imports/staging/reject             ← rechazar grupo exchange

# Banco staging
POST /api/imports/staging/bank/match/bulk   ← buscar matches masivo
POST /api/imports/staging/bank/match/confirm ← confirmar match individual
POST /api/imports/staging/bank/ignore-unmatched ← ignorar sin candidatos
POST /api/imports/staging/bank/review        ← promover a revisión
POST /api/imports/staging/bank/reject        ← ignorar individual

# Detalle y auditoría
GET  /api/imports/staging/detail?id=...     ← datos + audit del item
GET  /api/timeline/entity?id=...&type=...   ← timeline operacional completa
```

---

## 8. UI — `/importaciones`

Kanban de 3 columnas: **Pendientes** | **En revisión** | **Confirmados**

- Pestaña "Todos" o filtro por fuente (Exchange / Banco / Manual).
- Columna "En revisión": ordenada por `stagingConfidence` descendente (Alta certeza primero).
- Barra de acciones masivas banco: "Buscar match todos" / "Ignorar sin match".
- Card → "Ver detalle" → panel estructurado (Resumen, Fuentes, Portafolio, Banco, Auditoría).
- Panel de detalle → "Ver timeline completo" → timeline vertical cronológico.

---

## 9. Reglas de negocio críticas

1. **1 evento económico = 1 PortfolioMovement.** Nunca dos movimientos para la misma operación.
2. **Exchange confirma con rebuildTaxEvents.** La confirmación es atómica con el recálculo tributario.
3. **Banco ignorado ≠ eliminado.** `IGNORED` persiste en DB. Solo `IMPORTED`/`REVIEW` aparecen en el kanban activo.
4. **Match solo si score ≥ 0.60.** Candidatos por debajo no se proponen al usuario.
5. **decisionHash es inmutable.** Una vez escrito en el audit log, no se recalcula ni sobrescribe.
6. **Período tributario cerrado protege confirmaciones.** `assertPeriodOpen` bloquea confirmar eventos en períodos ya cerrados.
