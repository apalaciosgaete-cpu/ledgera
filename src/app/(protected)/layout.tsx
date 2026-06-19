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

// CLEANUP 1.2 — OS navigation: no ERP pills, only conversational center + sidebar

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

const SIDEBAR_ITEMS = [
  { href: "/mi-situacion", label: "Expediente" },
  { href: "/documentos", label: "Documentos" },
  { href: "/casos", label: "Casos" },
  { href: "/asistente", label: "Historial" },
  { href: "/configuracion", label: "Configuración" },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 100,
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        />
      )}
      <nav style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 280,
        background: "#071B28",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        zIndex: 101,
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{
            color: "#475569", fontSize: 11, fontWeight: 850,
            letterSpacing: "0.1em", textTransform: "uppercase",
            fontFamily: fonts.body,
          }}>
            Navegación
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, color: "#94A3B8", cursor: "pointer",
              fontSize: 14, padding: "4px 9px", lineHeight: 1.4,
              fontFamily: fonts.body,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {SIDEBAR_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block", padding: "12px 24px",
                color: "#E2E8F0", fontSize: 15, fontWeight: 600,
                textDecoration: "none", fontFamily: fonts.body,
                transition: "background 0.1s",
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

  if (!user) return null;

  const isHome = pathname === "/panel";
  const role = (user as { role?: string })?.role ?? "personal";
  const token = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

  async function handleLogout() {
    await logout();
    window.location.href = "/bienvenida";
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: isHome ? "#071B28" : colors.bgApp,
      fontFamily: fonts.body,
    }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header style={{
        background: "#071B28",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "60px",
      }}>
        <div style={{
          maxWidth: isHome ? "none" : "1400px",
          margin: "0 auto",
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          minWidth: 0,
        }}>
          <Link
            href="/panel"
            aria-label="Ir al inicio LEDGERA"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <Logo variant="light" size="md" showSubtitle={false} />
          </Link>

          <Link
            href="/asistente"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#CBD5E1",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: fonts.body,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Nueva conversación
          </Link>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}>
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
                transition: "background 0.15s",
              }}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: isHome ? "none" : "1400px",
        margin: "0 auto",
        padding: isHome ? "0" : "32px 24px",
        minWidth: 0,
        overflowX: "hidden",
      }}>
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
