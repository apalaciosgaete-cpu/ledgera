import { cookies } from "next/headers";

import AdminSecurityPolicyPanel from "@/components/security/AdminSecurityPolicyPanel";
import EmailVerificationPanel from "@/components/security/EmailVerificationPanel";
import SecurityCenterPanel from "@/components/security/SecurityCenterPanel";
import { prisma } from "@/lib/prisma";
import { getSessionWithUserByToken } from "@/modules/identity/infrastructure/sessionRepository";
import {
  resolveSecurityPolicySettings,
  SECURITY_POLICY_KEYS,
} from "@/modules/security/domain/securityPolicy";
import { fonts } from "@/styles/tokens";

export const dynamic = "force-dynamic";

async function loadAdminSecurityPolicies() {
  const token = cookies().get("session_token")?.value;
  if (!token) return null;

  const [auth, storedSettings] = await Promise.all([
    getSessionWithUserByToken(token),
    prisma.systemSetting.findMany({
      where: {
        key: { in: [...SECURITY_POLICY_KEYS] },
      },
      select: {
        key: true,
        value: true,
      },
    }),
  ]);

  if (
    !auth ||
    auth.user.role !== "admin" ||
    auth.session.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  return resolveSecurityPolicySettings(storedSettings);
}

export default async function SeguridadPage() {
  const adminSecurityPolicies = await loadAdminSecurityPolicies();

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 4px",
          }}
        >
          Seguridad
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-soft)",
            margin: 0,
          }}
        >
          Sesiones y acceso
        </p>
      </div>

      {adminSecurityPolicies ? (
        <AdminSecurityPolicyPanel initialSettings={adminSecurityPolicies} />
      ) : null}
      <EmailVerificationPanel />
      <SecurityCenterPanel />
    </>
  );
}
