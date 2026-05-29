export type TimelineEventType =
  | "IMPORT_SYNCED"
  | "STAGING_NORMALIZED"
  | "STAGING_CONFIRMED"
  | "STAGING_REJECTED"
  | "BANK_IMPORTED"
  | "BANK_REVIEWED"
  | "BANK_MATCH_CONFIRMED"
  | "BANK_MATCH_REJECTED"
  | "BANK_IMPORT_REJECTED"
  | "PORTFOLIO_MOVEMENT_CREATED"
  | "TAX_EVENT_GENERATED"
  | "TAX_PERIOD_CLOSED"
  | "REPORT_ISSUED"
  | "ROLLBACK_APPLIED"
  | "INTEGRITY_VERIFIED";

export type TimelineEvent = {
  at:              string;
  type:            TimelineEventType | string;
  label:           string;
  actor:           string | null;
  metadata?:       Record<string, unknown>;
  validationCode?: string | null;
};

export type EntityTimelineResult = {
  entityId:   string;
  entityType: "STAGING" | "BANK" | "PORTFOLIO";
  events:     TimelineEvent[];
};
