// src/app/(protected)/layout.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";

type NavItem = { href: string; label: string };

const UX3_NAV_ITEMS: NavItem[] = [
  { href: "/panel", label: "Mi situación" },
  { href: "/conversaciones", label: "Conversaciones" },
  { href: "/documentos", label: "Documentos" },
  { href: "/casos", label: "Casos" },
  { href: "/configuracion", label: "Configuración" },
];

const roleTokens: Record<string, {
  label: string;
  badgeBg: string;
  badgeColor: string;
  avatarGradient: string;
}> = {
  personal: {
    label: "Personal",
    badgeBg: "rgba(22,163,74,0.14)",
    badgeColor: "#4ADE80",
    avatarGradient: "linear-gradient(135deg, #16A34A 0%, #0F766E 100%)",
  },
  contador: {
    label: "Profesional",
    badgeBg: "rgba(14,165,233,0.14)",
    badgeColor: "#7DD3FC",
    avatarGradient: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
  },
  empresa: {
    label: "Empresa",
    badgeBg: "rgba(99,102,241,0.14)",
    badgeColor: "#A5B4FC",
    avatarGradient: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
  },
  admin: {
    label: "Admin",
    badgeBg: "rgba(239,68,68,0.16)",
    badgeColor: "#F87171",
    avatarGradient: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
  },
};

function isActivePath(pathname: string, href: string) {
  if (href === "/panel") return pathname === "/panel" || pathname === "/mi-situacion";
  if (href === "/conversaciones") return pathname === "/conversaciones" || pathname.startsWith("/asistente");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DrawerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open ? (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.56)",
            zIndex: 100,
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        />
      ) : null}

      <nav
        aria-label="Menú LEDGERA"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 300,
          maxWidth: "calc(100vw - 32px)",
          background: "#071B28",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span
            style={{
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: fonts.body,
            }}
          >
            LEDGERA
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#CBD5E1",
              cursor: "pointer",
              fontSize: 14,
              padding: "4px 9px",
              lineHeight: 1.4,
              fontFamily: fonts.body,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {UX3_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block",
                padding: "13px 24px",
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 750,
                textDecoration: "none",
                fontFamily: fonts.body,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const role = (user as { role?: string })?.role ?? "personal";
  const token = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";
  const isPanel = pathname === "/panel";

  async function handleLogout() {
    await logout();
    window.location.href = "/bienvenida";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isPanel ? "#071B28" : colors.bgApp,
        fontFamily: fonts.body,
      }}
    >
      <DrawerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header
        style={{
          background: "#071B28",
          borderBottom: isPanel ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isPanel ? "none" : "0 10px 30px rgba(2,6,23,0.16)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          minHeight: 68,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            minHeight: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
            minWidth: 0,
          }}
        >
          <Link
            href="/panel"
            aria-label="Ir al inicio LEDGERA"
            style={{
              alignItems: "center",
              display: "flex",
              flexShrink: 0,
              justifyContent: "center",
              minWidth: 210,
              textDecoration: "none",
            }}
          >
            <Logo variant="light" size="md" showSubtitle />
          </Link>

          <nav
            aria-label="Navegación principal LEDGERA"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flex: 1,
              justifyContent: "center",
              minWidth: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {UX3_NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 38,
                    padding: "0 15px",
                    borderRadius: 999,
                    border: active ? "1px solid rgba(74,222,128,0.34)" : "1px solid transparent",
                    fontSize: 14,
                    fontWeight: active ? 850 : 650,
                    fontFamily: fonts.body,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    background: active ? "rgba(22,163,74,0.18)" : "transparent",
                    color: active ? "#F8FAFC" : "#94A3B8",
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <UserProfileDropdown
              name={user.email}
              initials={initials}
              avatarGradient={token.avatarGradient}
              badgeBg={token.badgeBg}
              badgeColor={token.badgeColor}
              roleLabel={token.label}
              isAdmin={role === "admin"}
              onLogout={handleLogout}
            />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              title="Menú"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#94A3B8",
                cursor: "pointer",
                fontSize: 16,
                padding: "7px 11px",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
                fontFamily: fonts.body,
              }}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: isPanel ? "none" : "1400px",
          margin: "0 auto",
          padding: isPanel ? 0 : "32px 24px",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
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
