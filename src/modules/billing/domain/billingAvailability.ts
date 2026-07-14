export const BILLING_UNAVAILABLE_MESSAGE =
  "La contratación y gestión automática de cobros aún no está habilitada.";

export function isLiveBillingEnabled(): boolean {
  return process.env.BILLING_LIVE_MODE === "true";
}

export function isPlaceholderBillingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.BILLING_ALLOW_PLACEHOLDER_CONFIRM === "true"
  );
}
