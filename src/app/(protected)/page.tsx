"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";

const navItemsByRole: Record<string, { href: string; label: string }[]> = {
  personal: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
  ],
  contador: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
    { href: "/auditoria",  label: "Auditoria" },
  ],
  empresa: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
    { href: "/auditoria",  label: "Auditoria" },
  ],
  admin: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
    { href: "/auditoria",  label: "Auditoria" },
  ],
};

const rolesConConfiguracion = ["empresa", "admin"];

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/bienvenida");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const role = user?.role ?? "personal";
  const navItems = navItemsByRole[role] ?? navItemsByRole.personal;
  const showConfiguracion = rolesConConfiguracion.includes(role);
  const configActive = isActive("/configuracion");

  return (
    <div style={{ minHeight: "100vh", background: "#F6F8FA", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header style={{ background: "#0F2A3D", borderBottom: "1px solid #1e4a6b", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", paddingBottom: "16px" }}>
            <Link href="/portafolio" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <svg width="36" height="36" viewBox="0 0 64 56">
                <rect x="4"  y="44" width="10" height="12" rx="2" fill="#16A34A" fillOpacity="0.4" />
                <rect x="18" y="32" width="10" height="24" rx="2" fill="#16A34A" fillOpacity="0.65" />
                <rect x="32" y="18" width="10" height="38" rx="2" fill="#16A34A" />
                <rect x="46" y="4"  width="10" height="52" rx="2" fill="#F59E0B" />
              </svg>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "26px", fontWeight: 700, color: "#F6F8FA", letterSpacing: "0.04em" }}>
                LEDGERA
              </span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {showConfiguracion && (
                <Link
                  href="/configuracion"
                  title="Configuracion"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: "8px", textDecoration: "none",
                    background: configActive ? "rgba(245,158,11,0.15)" : "transparent",
                    border: configActive ? "1px solid rgba(245,158,11,0.35)" : "1px solid transparent",
                    color: configActive ? "#F59E0B" : "#475569",
                    transition: "all 0.15s ease",
                  }}
                >
                  <GearIcon />
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href="/admin"
                  style={{ fontSize: "13px", color: "#F59E0B", textDecoration: "none", fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Admin
                </Link>
              )}
              {user?.email ? (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>{user.email}</p>
                  <p style={{ fontSize: "12px", color: "#334155", margin: 0, textTransform: "capitalize" }}>{role}</p>
                </div>
              ) : null}
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "1px solid #1e4a6b",
                  borderRadius: "8px",
                  color: "#94A3B8",
                  fontSize: "14px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Cerrar sesion
              </button>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "4px", justifyContent: "center", paddingBottom: "14px" }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "9px 24px",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: active ? 600 : 400,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textDecoration: "none",
                    background: active ? "#16A34A" : "transparent",
                    color: active ? "#ffffff" : "#64748B",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 32px" }}>
        {children}
      </main>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ProtectedShell>{children}</ProtectedShell>
    </AuthGuard>
  );
}