// src/app/(protected)/layout.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "@/modules/identity/client/AuthGuard";
import { useAuth } from "@/modules/identity/client/authContext";
import {
  canAccessFeature,
  Feature,
  getPlanLabel,
} from "@/modules/subscription/domain/planFeatures";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";
import { SubscriptionAccessBanner } from "@/components/subscription/SubscriptionAccessBanner";
import { fonts } from "@/styles/tokens";

const roleTokens: Record<string, { label: string; badgeBg: string; badgeColor: string; avatarGradient: string }> = {
  personal: { label: "Personal", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  contador: { label: "Asesor", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  empresa: { label: "Organización", badgeBg: "var(--accent-soft)", badgeColor: "var(--accent)", avatarGradient: "var(--accent)" },
  support: { label: "Soporte", badgeBg: "rgba(75,155,110,0.14)", badgeColor: "var(--gain)", avatarGradient: "var(--accent)" },
  admin: { label: "Admin", badgeBg: "rgba(196,99,74,0.14)", badgeColor: "var(--loss)", avatarGradient: "var(--accent)" },
};

type SidebarLink = { href: string; label: string; feature?: Feature };
type SidebarGroup = { items: SidebarLink[] };

type PendingCheckout = {
  plan?: string;
  billing?: string;
};

const BASE_SIDEBAR_GROUPS: SidebarGroup[] = [
  { items: [{ href: "/panel", label: "Inicio" }] },
  { items: [{ href: "/origen-fondos", label: "Origen de Fondos" }] },
  { items: [{ href: "/cryptoactivos", label: "Activos" }] },
  { items: [{ href: "/obligaciones-tributarias", label: "Obligaciones Tributarias" }] },
  { items: [{ href: "/declaraciones", label: "Declaraciones", feature: Feature.DECLARATIONS }] },
  { items: [{ href: "/accesos-profesionales", label: "Accesos profesionales" }] },
  { items: [{ href: "/configuracion", label: "Configuración" }] },
  { items: [{ href: "/ayuda", label: "Ayuda" }] },
];

const PROFESSIONAL_GROUP: SidebarGroup = {
  items: [{ href: "/profesional/clientes", label: "Clientes", feature: Feature.EXPERT_MODE }],
};

function Sidebar({
  open,
  onClose,
  onLogout,
  plan,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  plan: string | null | undefined;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const allGroups = isAdmin || canAccessFeature(plan, Feature.EXPERT_MODE)
    ? [BASE_SIDEBAR_GROUPS[0], PROFESSIONAL_GROUP, ...BASE_SIDEBAR_GROUPS.slice(1)]
    : BASE_SIDEBAR_GROUPS;
  const sidebarGroups = allGroups
    .map((group) => ({
      items: group.items.filter(
        (item) => !item.feature || isAdmin || canAccessFeature(plan, item.feature),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} />}
      <nav style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: "var(--bg-sunken)", borderRight: "1px solid var(--border)", zIndex: 101, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.26s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-faint)", fontSize: 13, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: fonts.body }}>Menú</span>
          <button onClick={onClose} style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-faint)", cursor: "pointer", fontSize: 14, padding: "4px 9px", lineHeight: 1.4, fontFamily: fonts.body }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {sidebarGroups.map((group) => (
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPanel = pathname === "/panel";

  useEffect(() => {
    if (!user || pathname !== "/panel" || user.role === "support") return;

    const rawPendingCheckout = sessionStorage.getItem("pendingCheckout");
    if (!rawPendingCheckout) return;

    sessionStorage.removeItem("pendingCheckout");

    try {
      const pending = JSON.parse(rawPendingCheckout) as PendingCheckout;
      const plan = pending.plan?.toUpperCase();

      if (plan !== "PERSONAL" && plan !== "PROFESIONAL") return;

      const billing = pending.billing === "annual" ? "annual" : "monthly";
      router.replace(`/checkout?plan=${plan}&billing=${billing}&source=post_auth`);
    } catch {
      // Ignore invalid or stale checkout state.
    }
  }, [pathname, router, user]);

  if (!user || user.role === "support") return null;

  const role = user.role ?? "personal";
  const token = roleTokens[role] ?? roleTokens.personal;
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "??";
  const isAdmin = role === "admin";
  const accountLabel = isAdmin
    ? token.label
    : `${token.label} · ${getPlanLabel(user.subscriptionPlan)}`;

  async function handleLogout() {
    await logout();
    window.location.href = "/bienvenida";
  }

  return (
    <div className="ledgera-protected-shell" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: fonts.body }}>
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
        plan={user.subscriptionPlan}
        isAdmin={isAdmin}
      />
      <header style={{ background: "var(--bg-sunken)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, minHeight: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", minHeight: 60, padding: "0 20px" }}>
          <div style={{ justifySelf: "start" }}>
            <button onClick={() => setMenuOpen(true)} title="Menú" style={{ background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-faint)", cursor: "pointer", fontSize: 18, padding: "9px 13px", display: "flex", alignItems: "center", lineHeight: 1, fontFamily: fonts.body, transition: "background 0.15s" }}>☰</button>
          </div>
          <Link href="/panel" aria-label="Ir al inicio LEDGERA" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Logo variant="light" size="md" showSubtitle />
          </Link>
          <div style={{ justifySelf: "end" }}>
            <UserProfileDropdown name={user.email} initials={initials} avatarGradient={token.avatarGradient} badgeBg={token.badgeBg} badgeColor={token.badgeColor} roleLabel={accountLabel} isAdmin={isAdmin} onLogout={handleLogout} />
          </div>
        </div>
      </header>
      <SubscriptionAccessBanner />
      <main className="ledgera-protected-content" style={{ maxWidth: isPanel ? "none" : "1400px", margin: "0 auto", padding: isPanel ? "0" : "20px 16px", minWidth: 0, minHeight: "calc(100vh - 60px)", overflow: "visible", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard><ProtectedShell>{children}</ProtectedShell></AuthGuard>;
}
