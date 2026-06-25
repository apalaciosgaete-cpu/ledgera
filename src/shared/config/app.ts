export const APP_CONFIG = {
  name: "LEDGERA",
  subtitle: "FINANZAS SO",
  version: "0.0.0.03",
  environment: process.env.NODE_ENV || "development",
} as const;

export const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ledgera.cl";
export const SITE_MAINTENANCE_MODE = process.env.SITE_MAINTENANCE_MODE === "true";
