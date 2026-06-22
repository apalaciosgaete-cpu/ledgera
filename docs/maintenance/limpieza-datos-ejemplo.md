# Limpieza de datos de ejemplo en LEDGERA

Este procedimiento se usa cuando se ingresaron movimientos, importaciones o registros ficticios durante pruebas y deben eliminarse para dejar el sistema sin informacion de ejemplo.

## Alcance

No se deben eliminar usuarios, sesiones, billing ni configuracion de cuenta.

La limpieza aplica solo sobre informacion financiera, tributaria, bancaria, staging e integridad derivada.

## Tablas funcionales afectadas

- portfolio_movements
- tax_events
- tax_ledger_entries
- annual_tax_summaries
- tax_declarations
- tax_declaration_audit_logs
- tax_period_closures
- tax_period_audit_logs
- tax_period_snapshots
- exchange_import_records
- exchange_sync_periods
- bank_movements
- bank_file_uploads
- bank_csv_templates
- bank_reconciliation_audit_logs
- bank_reconciliation_report_validations
- staging_events
- staging_event_sources
- staging_decisions
- integrity_chain_entries
- logical_rollbacks
- portfolios

## Criterio operativo

Toda informacion visible en Consolidado debe derivar desde movimientos reales.

Si aparecen saldos, costos, activos o montos de ejemplo, significa que existen registros reales en base de datos y deben limpiarse desde la base, no desde el frontend.

## Recomendacion

Ejecutar la limpieza primero en desarrollo o staging. En produccion, respaldar la base antes de limpiar.

## Orden conceptual de limpieza

1. Desvincular importaciones de movimientos.
2. Eliminar registros tributarios derivados.
3. Eliminar auditoria derivada.
4. Eliminar importaciones bancarias y de exchanges.
5. Eliminar staging.
6. Eliminar movimientos financieros.
7. Eliminar portfolios de prueba.

## Regla de seguridad

Nunca limpiar tablas de usuarios, sesiones, billing, configuracion, suscripciones o credenciales salvo que el objetivo sea reiniciar completamente el ambiente.
