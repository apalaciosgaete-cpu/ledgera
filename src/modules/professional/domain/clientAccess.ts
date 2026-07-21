export const PROFESSIONAL_INCLUDED_CLIENTS = 5;

export const ProfessionalAccessStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  DECLINED: "DECLINED",
} as const;

export type ProfessionalAccessStatus =
  (typeof ProfessionalAccessStatus)[keyof typeof ProfessionalAccessStatus];

export const ProfessionalWorkflowStatus = {
  INVITED: "INVITED",
  DATA_PENDING: "DATA_PENDING",
  REVIEWING: "REVIEWING",
  READY_TO_FILE: "READY_TO_FILE",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
} as const;

export type ProfessionalWorkflowStatus =
  (typeof ProfessionalWorkflowStatus)[keyof typeof ProfessionalWorkflowStatus];

const VALID_WORKFLOW_STATUSES = new Set<string>(
  Object.values(ProfessionalWorkflowStatus),
);

export function normalizeProfessionalWorkflowStatus(
  value: unknown,
): ProfessionalWorkflowStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return VALID_WORKFLOW_STATUSES.has(normalized)
    ? (normalized as ProfessionalWorkflowStatus)
    : null;
}

export const ProfessionalPermission = {
  VIEW_TAX_DATA: "VIEW_TAX_DATA",
  MANAGE_IMPORTS: "MANAGE_IMPORTS",
  EDIT_CLASSIFICATIONS: "EDIT_CLASSIFICATIONS",
  EXPORT_REPORTS: "EXPORT_REPORTS",
  MANAGE_DECLARATIONS: "MANAGE_DECLARATIONS",
  VIEW_AUDIT: "VIEW_AUDIT",
} as const;

export type ProfessionalPermission =
  (typeof ProfessionalPermission)[keyof typeof ProfessionalPermission];

export const DEFAULT_PROFESSIONAL_PERMISSIONS: ProfessionalPermission[] = [
  ProfessionalPermission.VIEW_TAX_DATA,
  ProfessionalPermission.MANAGE_IMPORTS,
  ProfessionalPermission.EDIT_CLASSIFICATIONS,
  ProfessionalPermission.EXPORT_REPORTS,
  ProfessionalPermission.MANAGE_DECLARATIONS,
  ProfessionalPermission.VIEW_AUDIT,
];

const VALID_PERMISSIONS = new Set<string>(
  Object.values(ProfessionalPermission),
);

export function normalizeProfessionalPermissions(
  value: unknown,
): ProfessionalPermission[] {
  if (!Array.isArray(value)) return [...DEFAULT_PROFESSIONAL_PERMISSIONS];

  const normalized = value.filter(
    (permission): permission is ProfessionalPermission =>
      typeof permission === "string" && VALID_PERMISSIONS.has(permission),
  );

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DEFAULT_PROFESSIONAL_PERMISSIONS];
}
