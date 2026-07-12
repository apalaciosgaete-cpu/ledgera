"use client";

import AdminSecurityPolicyPanel from "@/components/security/AdminSecurityPolicyPanel";
import EmailVerificationPanel from "@/components/security/EmailVerificationPanel";
import SecurityCenterPanel from "@/components/security/SecurityCenterPanel";
import { fonts } from "@/styles/tokens";

export default function SeguridadPage() {
  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
          Seguridad
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-soft)", margin: 0 }}>
          Sesiones y acceso
        </p>
      </div>

      <AdminSecurityPolicyPanel />
      <EmailVerificationPanel />
      <SecurityCenterPanel />
    </>
  );
}
