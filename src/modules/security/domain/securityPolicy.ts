export const SECURITY_POLICY_KEYS = [
  "SECURITY_SESSION_HOURS",
  "SECURITY_MAX_LOGIN_ATTEMPTS",
] as const;

export type SecurityPolicyKey = (typeof SECURITY_POLICY_KEYS)[number];

export type SecurityPolicySettings = Record<SecurityPolicyKey, string>;

export const DEFAULT_SECURITY_POLICY_SETTINGS: SecurityPolicySettings = {
  SECURITY_SESSION_HOURS: "24",
  SECURITY_MAX_LOGIN_ATTEMPTS: "5",
};

function isSecurityPolicyKey(value: string): value is SecurityPolicyKey {
  return (SECURITY_POLICY_KEYS as readonly string[]).includes(value);
}

export function resolveSecurityPolicySettings(
  rows: ReadonlyArray<{ key: string; value: string }>,
): SecurityPolicySettings {
  const settings: SecurityPolicySettings = {
    ...DEFAULT_SECURITY_POLICY_SETTINGS,
  };

  for (const row of rows) {
    if (isSecurityPolicyKey(row.key)) {
      settings[row.key] = row.value;
    }
  }

  return settings;
}
