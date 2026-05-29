export const STAGING_STATUS = {
  PENDING:     "PENDING",
  REVIEW:      "REVIEW",
  CONFIRMED:   "CONFIRMED",
  REJECTED:    "REJECTED",
  ROLLED_BACK: "ROLLED_BACK",
} as const;

export type StagingStatus = typeof STAGING_STATUS[keyof typeof STAGING_STATUS];
