// Stable CI smoke suite.
// Keep this list limited to deterministic tests that do not require network, database, secrets, or Vercel runtime state.
await import("./checkout-consent.test.mjs");
await import("./billing-webhook-domain.test.mjs");
await import("./document-domain.test.mjs");
