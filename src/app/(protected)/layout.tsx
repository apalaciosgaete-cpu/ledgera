// src/app/(protected)/layout.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";
import { fonts } from "@/styles/tokens";

const roleTokens: Record<string, { label: string; badgeBg: string; badgeColor: string; avatarGradient: string }> = {
  personal: { label: "Personal", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  contador: { label: "Profesional", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  empresa: { label: "Empresa", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  admin: { label: "Admin", badgeBg: "rgba(196,99,74,0.14)", badgeColor: "var(--loss)", avatarGradient: "var(--accent)" },
};

type SidebarLink = { href: string; label: string };
type SidebarGroup = { items: SidebarLink[] };

const SIDEBAR_GROUPS: SidebarGroup[] = [
  { items: [{ href: "/panel", label: "Inicio" }] },
  { items: [{ href: "/origen-fondos", label: "Origen de Fondos" }] },
  { items: [{ href: "/cryptoactivos", label: "Activos" }] },
  { items: [{ href: "/obligaciones-tributarias", label: "Obligaciones Tributarias" }] },
  { items: [{ href: "/declaraciones", label: "Declaraciones" }] },
  { items: [{ href: "/configuracion", label: "Configuración" }] },
  { items: [{ href: "/ayuda", label: "Ayuda" }] },
];

function Sidebar({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} />}
      <nav style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: "var(--bg-sunken)", borderRight: "1px solid var(--border)", zIndex: 101, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.26s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-faint)", fontSize: 13, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: fonts.body }}>Menú</span>
          <button onClick={onClose} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-faint)", cursor: "pointer", fontSize: 14, padding: "4px 9px", lineHeight: 1.4, fontFamily: fonts.body }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.items[0]?.href ?? "unknown"}>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: "block",
                      padding: "10px 24px",
                      color: active ? "var(--accent)" : "var(--text)",
                      background: active ? "var(--accent-soft)" : "transparent",
                      fontSize: 15,
                      fontWeight: active ? 850 : 650,
                      textDecoration: "none",
                      fontFamily: fonts.body,
                      transition: "background 0.1s",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
          <div style={{ marginTop: 4, padding: "8px 12px 12px", borderTop: "1px solid var(--border)" }}>
            <LogoutButton onClick={() => { onClose(); onLogout(); }} />
          </div>
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
    <div className="ledgera-protected-shell" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: fonts.body }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      <header style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, minHeight: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", minHeight: 60, padding: "0 20px" }}>
          <div style={{ justifySelf: "start" }}>
            <button onClick={() => setMenuOpen(true)} title="Menú" style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-faint)", cursor: "pointer", fontSize: 18, padding: "9px 13px", display: "flex", alignItems: "center", lineHeight: 1, fontFamily: fonts.body, transition: "background 0.15s" }}>☰</button>
          </div>
          <Link href="/panel" aria-label="Ir al inicio LEDGERA" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Logo variant="light" size="md" showSubtitle />
          </Link>
          <div style={{ justifySelf: "end" }}>
            <UserProfileDropdown name={user.email} initials={initials} avatarGradient={token.avatarGradient} badgeBg={token.badgeBg} badgeColor={token.badgeColor} roleLabel={token.label} isAdmin={role === "admin"} onLogout={handleLogout} />
          </div>
        </div>
      </header>
      <main className="ledgera-protected-content" style={{ maxWidth: isPanel ? "none" : "1400px", margin: "0 auto", padding: isPanel ? "0" : "20px 16px", minWidth: 0, minHeight: "calc(100vh - 60px)", overflow: "visible", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard><ProtectedShell>{children}</ProtectedShell></AuthGuard>;
}
