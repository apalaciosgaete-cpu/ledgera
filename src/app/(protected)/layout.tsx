// src/app/(protected)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";

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

const baseNavItems: { href: string; label: string }[] = [
  { href: "/panel",         label: "Consolidado" },
  { href: "/integraciones", label: "Conexiones" },
  { href: "/tributario",    label: "Tributario" },
  { href: "/auditoria",     label: "Auditoría" },
  { href: "/seguridad",     label: "Seguridad" },
  { href: "/planes",        label: "Planes" },
];

const navItemsByRole: Record<string, { href: string; label: string }[]> = {
  personal: baseNavItems,
  contador: baseNavItems,
  empresa:  baseNavItems,
  admin:    [...baseNavItems, { href: "/admin", label: "Admin" }],
};

const ROLES_CON_CONFIGURACION = ["admin", "empresa", "contador", "personal"];

const roleTokens: Record<string, {
  label:          string;
  badgeBg:        string;
  badgeColor:     string;
  avatarGradient: string;
}> = {
  personal: {
    label:          "Personal",
    badgeBg:        "rgba(22,163,74,0.14)",
    badgeColor:     "#4ADE80",
    avatarGradient: "linear-gradient(135deg, #16A34A 0%, #0F766E 100%)",
  },
  contador: {
    label:          "Profesional",
    badgeBg:        "rgba(14,165,233,0.14)",
    badgeColor:     "#7DD3FC",
    avatarGradient: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
  },
  empresa: {
    label:          "Empresa",
    badgeBg:        "rgba(99,102,241,0.14)",
    badgeColor:     "#A5B4FC",
    avatarGradient: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
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

  if (!user) return null;

  const role         = (user as { role?: string })?.role ?? "personal";
  const navItems     = navItemsByRole[role] ?? navItemsByRole.personal;
  const configActive = pathname.startsWith("/configuracion");
  const showConfig   = ROLES_CON_CONFIGURACION.includes(role);

  const token    = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

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
        background:   "#071B28",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow:    "0 10px 30px rgba(2,6,23,0.16)",
        position:     "sticky",
        top:          0,
        zIndex:       50,
        height:       "76px",
        overflowX:    "clip",
      }}>
        <div style={{
          maxWidth:       "1400px",
          margin:         "0 auto",
          padding:        "0 24px",
          height:         "100%",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            "22px",
          minWidth:       0,
        }}>
          <Link
            href="/panel"
            aria-label="Ir al consolidado LEDGERA"
            style={{
              alignItems:     "center",
              display:        "flex",
              flexShrink:     0,
              justifyContent: "center",
              minWidth:       "220px",
              textDecoration: "none",
            }}
          >
            <Logo variant="light" size="lg" showSubtitle />
          </Link>

          <nav style={{
            display:        "flex",
            alignItems:     "center",
            gap:            "6px",
            flex:           1,
            justifyContent: "center",
            minWidth:       0,
            overflowX:      "auto",
            scrollbarWidth: "none",
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
                    padding:        "0 16px",
                    borderRadius:   "999px",
                    border:         active ? "1px solid rgba(74,222,128,0.34)" : "1px solid transparent",
                    fontSize:       "14px",
                    fontWeight:     active ? 800 : 600,
                    fontFamily:     fonts.body,
                    textDecoration: "none",
                    whiteSpace:     "nowrap",
                    background:     active ? "rgba(22,163,74,0.18)" : "transparent",
                    color:          active ? "#F8FAFC" : "#94A3B8",
                    transition:     "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, minWidth: 0 }}>
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
                  width:          "36px",
                  height:         "36px",
                  borderRadius:   "11px",
                  background:     configActive
                    ? "rgba(22,163,74,0.16)"
                    : gearHover ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.035)",
                  border: configActive
                    ? "1px solid rgba(74,222,128,0.32)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: configActive
                    ? "#4ADE80"
                    : gearHover ? "#CBD5E1" : colors.textMuted,
                  textDecoration: "none",
                  transition:     "all 0.15s ease",
                  flexShrink:     0,
                }}
              >
                <GearIcon />
              </Link>
            )}

            <UserProfileDropdown
              email={user.email}
              initials={initials}
              avatarGradient={token.avatarGradient}
              badgeBg={token.badgeBg}
              badgeColor={token.badgeColor}
              roleLabel={token.label}
            />

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                width:          "36px",
                height:         "36px",
                minWidth:       "36px",
                borderRadius:   "11px",
                background:     logoutHover ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.035)",
                border:         "1px solid rgba(255,255,255,0.08)",
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
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px", minWidth: 0, overflowX: "hidden" }}>
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
