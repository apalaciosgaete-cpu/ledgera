export const STAGING_SOURCE = {
  EXCHANGE: "EXCHANGE",
  BANK:     "BANK",
  MANUAL:   "MANUAL",
} as const;

export type StagingSource = typeof STAGING_SOURCE[keyof typeof STAGING_SOURCE];
