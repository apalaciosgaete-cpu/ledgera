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

const baseNavItems: { href: string; label: string }[] = [
  { href: "/panel", label: "Inicio" },
  { href: "/monitor", label: "Monitor" },
  { href: "/casos", label: "Casos" },
  { href: "/decisiones", label: "Decisiones" },
  { href: "/workflows", label: "Workflows" },
  { href: "/multiagente", label: "Multiagente" },
  { href: "/ejecuciones", label: "Ejecuciones" },
  { href: "/ai-center", label: "Centro AI" },
  { href: "/asistente", label: "Asistente" },
  { href: "/simulador", label: "Simulador" },
  { href: "/memoria-tributaria", label: "Memoria" },
  { href: "/mi-perfil-tributario", label: "Perfil AI" },
  { href: "/mi-situacion", label: "Mi Situación" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/integraciones", label: "Conexiones" },
  { href: "/operating-system", label: "LAIOS" },
  { href: "/notificaciones", label: "Alertas" },
];

const navItemsByRole: Record<string, { href: string; label: string }[]> = {
  personal: baseNavItems,
  contador: baseNavItems,
  empresa: baseNavItems,
  admin: baseNavItems,
};

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

const SECONDARY_MENU = [
  { href: "/asistente", label: "Conversaciones" },
  { href: "/documentos", label: "Documentos" },
  { href: "/casos", label: "Casos" },
  { href: "/configuracion", label: "Configuración" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/impuestos", label: "Impuestos" },
  { href: "/monitor", label: "Monitor" },
  { href: "/decisiones", label: "Decisiones" },
  { href: "/workflows", label: "Workflows" },
  { href: "/multiagente", label: "Multiagente" },
  { href: "/simulador", label: "Simulador" },
  { href: "/memoria-tributaria", label: "Memoria" },
  { href: "/mi-perfil-tributario", label: "Perfil AI" },
  { href: "/mi-situacion", label: "Mi Situación" },
  { href: "/integraciones", label: "Conexiones" },
  { href: "/operating-system", label: "LAIOS" },
];

const PRIMARY_LINKS = ["/asistente", "/documentos", "/casos", "/configuracion"];

function SecondaryMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const primary = SECONDARY_MENU.filter(i => PRIMARY_LINKS.includes(i.href));
  const secondary = SECONDARY_MENU.filter(i => !PRIMARY_LINKS.includes(i.href));

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
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
            Menú
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

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {primary.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block", padding: "12px 24px",
                color: "#E2E8F0", fontSize: 15, fontWeight: 700,
                textDecoration: "none", fontFamily: fonts.body,
                transition: "background 0.1s",
              }}
            >
              {item.label}
            </Link>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "12px 24px" }} />

          {secondary.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "block", padding: "9px 24px",
                color: "#64748B", fontSize: 13, fontWeight: 600,
                textDecoration: "none", fontFamily: fonts.body,
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

  const isHome = pathname === "/panel";
  const role = (user as { role?: string })?.role ?? "personal";
  const navItems = navItemsByRole[role] ?? navItemsByRole.personal;
  const token = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";

  async function handleLogout() {
    await logout();
    window.location.href = "/bienvenida";
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: isHome ? "#071B28" : colors.bgApp,
      fontFamily: fonts.body,
    }}>
      <SecondaryMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header style={{
        background: "#071B28",
        borderBottom: isHome ? "none" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isHome ? "none" : "0 10px 30px rgba(2,6,23,0.16)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: isHome ? "60px" : "76px",
        overflowX: isHome ? "visible" : "clip",
      }}>
        <div style={{
          maxWidth: isHome ? "none" : "1400px",
          margin: "0 auto",
          padding: isHome ? "0 28px" : "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "22px",
          minWidth: 0,
        }}>
          <Link
            href="/panel"
            aria-label="Ir al inicio LEDGERA"
            style={{
              alignItems: "center",
              display: "flex",
              flexShrink: 0,
              justifyContent: "center",
              minWidth: isHome ? "auto" : "220px",
              textDecoration: "none",
            }}
          >
            <Logo variant="light" size={isHome ? "md" : "lg"} showSubtitle={isHome} />
          </Link>

          {!isHome && (
            <nav style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flex: 1,
              justifyContent: "center",
              minWidth: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}>
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "38px",
                      padding: "0 16px",
                      borderRadius: "999px",
                      border: active ? "1px solid rgba(74,222,128,0.34)" : "1px solid transparent",
                      fontSize: "14px",
                      fontWeight: active ? 800 : 600,
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
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isHome ? "12px" : "8px",
            flexShrink: 0,
            minWidth: 0,
          }}>
            {isHome && (
              <Link
                href="/configuracion"
                title="Configuración"
                style={{
                  color: "#475569", fontSize: 17, textDecoration: "none",
                  display: "flex", alignItems: "center", lineHeight: 1,
                  padding: 4,
                  transition: "color 0.15s",
                }}
              >
                ⚙
              </Link>
            )}
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
            {isHome && (
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
            )}
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
