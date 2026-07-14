"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";
import { fonts } from "@/styles/tokens";
import { ALL_SECTIONS } from "./ConfiguracionShell";

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = (user as { role?: string })?.role ?? "personal";
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isIndexPage = normalizedPathname === "/configuracion";

  const sections = ALL_SECTIONS.filter(s => s.roles.includes(role));

  if (isIndexPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <aside style={{ width: "220px", flexShrink: 0, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px", position: "sticky", top: "92px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 10px 4px", margin: 0 }}>Configuración</p>
        {sections.map(s => {
          const active = pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <Link key={s.key} href={s.href}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                border: "none", background: active ? "var(--accent-soft)" : "transparent",
                cursor: "pointer", textAlign: "left", color: active ? "var(--accent)" : "var(--text-soft)",
                textDecoration: "none",
              }}>
              <span style={{ marginTop: "2px", flexShrink: 0 }}>{s.icon}</span>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: active ? 600 : 400, color: active ? "var(--accent)" : "var(--text-soft)", fontFamily: fonts.body }}>{s.label}</span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-faint)", lineHeight: 1.3, marginTop: "2px" }}>{s.description}</span>
              </div>
            </Link>
          );
        })}
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
