export const BILLING_UNAVAILABLE_MESSAGE =
  "La contratación en línea está temporalmente deshabilitada mientras LEDGERA completa su habilitación legal y comercial. No se realizará ningún cargo.";

export function isLiveBillingEnabled(): boolean {
  return process.env.BILLING_LIVE_MODE === "true";
}

export function isPlaceholderBillingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.BILLING_ALLOW_PLACEHOLDER_CONFIRM === "true"
  );
}
