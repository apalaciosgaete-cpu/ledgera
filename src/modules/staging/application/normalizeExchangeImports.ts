// Normalization of exchange imports happens during the Binance sync flow:
//   POST /api/integrations/binance/sync  →  BinanceSyncService  →  normalizeRecord()
//
// Records enter ExchangeImportRecord with status=PENDING and normalizedJson populated.
// The staging bandeja shows them as PENDING until the user confirms or rejects them.
//
// There is no standalone normalization step in staging — this file is a domain boundary
// marker documenting that normalization is upstream of staging, not part of it.
//
// If a future normalization-on-demand flow is needed, implement it here.

export {};
