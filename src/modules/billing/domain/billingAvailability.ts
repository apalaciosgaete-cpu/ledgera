export const BILLING_UNAVAILABLE_MESSAGE =
  "Las nuevas suscripciones estarán disponibles próximamente. No se realizó ningún cargo.";

export function isLiveBillingEnabled(): boolean {
  return process.env.BILLING_LIVE_MODE === "true";
}

export function isPlaceholderBillingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.BILLING_ALLOW_PLACEHOLDER_CONFIRM === "true"
  );
}
