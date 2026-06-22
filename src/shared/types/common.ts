export type UUID = string;

export type EntityStatus =
  | "active"
  | "inactive"
  | "suspended";

export type UserRole =
  | "owner"
  | "internal_admin"
  | "support_agent"
  | "accountant"
  | "client_admin"
  | "client_operator"
  | "viewer"
  | "auditor_readonly";