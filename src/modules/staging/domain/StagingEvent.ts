// Core types for the staging flow.
// "Nothing enters the portfolio without passing through staging."

export type { StagingStatus } from "./StagingStatus";
export { STAGING_STATUS }     from "./StagingStatus";
export type { StagingSource } from "./StagingSource";
export { STAGING_SOURCE }     from "./StagingSource";

export type BankMovementStatus = "IMPORTED" | "REVIEW" | "MATCHED" | "IGNORED";

export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type StagingActor = {
  id:      string;
  email:   string;
  context: RequestContext;
};
