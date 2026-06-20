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

const SIDEBAR_PRIMARY = [
  { href: "/patrimonio-digital", label: "Patrimonio Digital" },
  { href: "/cryptoactivos", label: "Cryptoactivos" },
  { href: "/origen-fondos", label: "Origen de Fondos" },
  { href: "/obligaciones-tributarias", label: "Obligaciones Tributarias" },
  { href: "/documentacion", label: "Documentación" },
];

const SIDEBAR_SECONDARY = [
  { href: "/configuracion", label: "Configuración" },
  { href: "/ayuda", label: "Ayuda" },
];

function Sidebar({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
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
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: "#071B28",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
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
              color: "#475569",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: fonts.body,
            }}
          >
            Menú
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#94A3B8",
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

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {SIDEBAR_PRIMARY.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block",
                padding: "12px 24px",
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: fonts.body,
                transition: "background 0.1s",
              }}
            >
              {item.label}
            </Link>
          ))}

          <div
            style={{
              margin: "12px 24px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          />

          {SIDEBAR_SECONDARY.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block",
                padding: "12px 24px",
                color: "#94A3B8",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                fontFamily: fonts.body,
                transition: "background 0.1s",
              }}
            >
              {item.label}
            </Link>
          ))}

          <button
            onClick={() => { onClose(); onLogout(); }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "12px 24px",
              color: "#94A3B8",
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: fonts.body,
              transition: "background 0.1s",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPanel = pathname === "/panel";

  if (!user) return null;

  const role = (user as { role?: string })?.role ?? "personal";
  const token = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

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
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
      />

      <header
        style={{
          background: "#071B28",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          minHeight: "74px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            minHeight: "74px",
            padding: "0 20px",
          }}
        >
          <div style={{ justifySelf: "start" }}>
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

          <Link
            href="/panel"
            aria-label="Ir al inicio LEDGERA"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <Logo variant="light" size="sm" showSubtitle />
          </Link>

          <div style={{ justifySelf: "end" }}>
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
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: isPanel ? "none" : "1400px",
          margin: "0 auto",
          padding: isPanel ? "0" : "32px 24px",
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
