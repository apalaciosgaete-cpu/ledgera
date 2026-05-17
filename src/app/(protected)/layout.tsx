// src/app/(protected)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

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
    { href: "/auditoria",  label: "Auditoría" },
  ],
  empresa: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
    { href: "/auditoria",  label: "Auditoría" },
  ],
  admin: [
    { href: "/portafolio", label: "Portafolio" },
    { href: "/tributario", label: "Tributario" },
    { href: "/panel",      label: "Panel" },
    { href: "/auditoria",  label: "Auditoría" },
    { href: "/admin",      label: "Admin" },
  ],
};

const ROLES_CON_CONFIGURACION = ["admin", "empresa", "contador"];

const roleTokens: Record<string, {
  label:          string;
  badgeBg:        string;
  badgeColor:     string;
  avatarGradient: string;
}> = {
  personal: {
    label:          "Personal",
    badgeBg:        "rgba(59,130,246,0.16)",
    badgeColor:     "#60A5FA",
    avatarGradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  contador: {
    label:          "Contador",
    badgeBg:        "rgba(168,85,247,0.16)",
    badgeColor:     "#C084FC",
    avatarGradient: "linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)",
  },
  empresa: {
    label:          "Empresa",
    badgeBg:        "rgba(245,158,11,0.16)",
    badgeColor:     "#FCD34D",
    avatarGradient: "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)",
  },
  admin: {
    label:          "Admin",
    badgeBg:        "rgba(239,68,68,0.16)",
    badgeColor:     "#F87171",
    avatarGradient: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
  },
};

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname         = usePathname();
  const { user, logout } = useAuth();

  const [gearHover,   setGearHover]   = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);

  // ── Sin usuario — no renderizar ──────────────────────────────────────────
  if (!user) return null;

  const role         = (user as { role?: string })?.role ?? "personal";
  const navItems     = navItemsByRole[role] ?? navItemsByRole.personal;
  const configActive = pathname.startsWith("/configuracion");
  const showConfig   = ROLES_CON_CONFIGURACION.includes(role);

  const token    = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

  // ── Logout — navegación completa evita re-render del AuthGuard ───────────
  async function handleLogout() {
    setLogoutHover(false);
    await logout();
    window.location.href = "/bienvenida";
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bgApp, fontFamily: fonts.body }}>

      <header style={{
        background:   colors.primary,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position:     "sticky",
        top:          0,
        zIndex:       50,
        height:       "64px",
      }}>
        <div style={{
          maxWidth:       "1400px",
          margin:         "0 auto",
          padding:        "0 24px",
          height:         "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            "24px",
        }}>

          <Link href="/portafolio" style={{ textDecoration: "none", flexShrink: 0 }}>
            <Logo variant="light" size="md" showSubtitle />
          </Link>

          <nav style={{
            display:        "flex",
            alignItems:     "center",
            gap:            "4px",
            flex:           1,
            justifyContent: "center",
          }}>
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    height:         "38px",
                    padding:        "0 20px",
                    borderRadius:   "9px",
                    fontSize:       "14px",
                    fontWeight:     active ? 600 : 400,
                    fontFamily:     fonts.body,
                    textDecoration: "none",
                    whiteSpace:     "nowrap",
                    background:     active ? colors.accent : "transparent",
                    color:          active ? "#ffffff" : colors.textMuted,
                    transition:     "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

            {showConfig && (
              <Link
                href="/configuracion"
                title="Configuración"
                onMouseEnter={() => setGearHover(true)}
                onMouseLeave={() => setGearHover(false)}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  width:          "34px",
                  height:         "34px",
                  borderRadius:   "9px",
                  background:     configActive
                    ? "rgba(245,158,11,0.14)"
                    : gearHover ? "rgba(255,255,255,0.06)" : "transparent",
                  border: configActive
                    ? "1px solid rgba(245,158,11,0.32)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: configActive
                    ? colors.warning
                    : gearHover ? "#CBD5E1" : colors.textMuted,
                  textDecoration: "none",
                  transition:     "all 0.15s ease",
                  flexShrink:     0,
                }}
              >
                <GearIcon />
              </Link>
            )}

            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              background:   "rgba(255,255,255,0.04)",
              border:       "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding:      "5px 6px 5px 10px",
            }}>

              <div style={{
                width:          "30px",
                height:         "30px",
                borderRadius:   "50%",
                background:     token.avatarGradient,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}>
                <span style={{
                  fontSize:      "11px",
                  fontWeight:    700,
                  color:         "#fff",
                  fontFamily:    fonts.display,
                  letterSpacing: "0.04em",
                  lineHeight:    1,
                }}>
                  {initials}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{
                  fontSize:     "12px",
                  fontWeight:   500,
                  color:        "#E2E8F0",
                  lineHeight:   1,
                  maxWidth:     "160px",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                }}>
                  {user.email}
                </span>
                <span style={{
                  display:       "inline-flex",
                  alignSelf:     "flex-start",
                  fontSize:      "9px",
                  fontWeight:    700,
                  color:         token.badgeColor,
                  background:    token.badgeBg,
                  borderRadius:  "4px",
                  padding:       "2px 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  lineHeight:    "13px",
                }}>
                  {token.label}
                </span>
              </div>

              <div style={{
                width:      "1px",
                height:     "24px",
                background: "rgba(255,255,255,0.08)",
                flexShrink: 0,
              }} />

              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                onMouseEnter={() => setLogoutHover(true)}
                onMouseLeave={() => setLogoutHover(false)}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  width:          "30px",
                  height:         "30px",
                  borderRadius:   "8px",
                  background:     logoutHover ? "rgba(239,68,68,0.12)" : "transparent",
                  border:         "none",
                  color:          logoutHover ? "#F87171" : colors.textMuted,
                  cursor:         "pointer",
                  transition:     "all 0.15s ease",
                  padding:        0,
                  flexShrink:     0,
                }}
              >
                <LogoutIcon />
              </button>
            </div>
          </div>

        </div>
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
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