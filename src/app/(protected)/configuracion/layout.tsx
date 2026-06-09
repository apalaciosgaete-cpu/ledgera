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

  const sections = ALL_SECTIONS.filter(s => s.roles.includes(role));

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <aside style={{ width: "220px", flexShrink: 0, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "8px", position: "sticky", top: "92px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 10px 4px", margin: 0 }}>Configuración</p>
        {sections.map(s => {
          const active = pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <Link key={s.key} href={s.href}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", borderRadius: "8px",
                border: "none", background: active ? "rgba(22,163,74,0.1)" : "transparent",
                cursor: "pointer", textAlign: "left", color: active ? "#4ADE80" : "#64748B",
                textDecoration: "none",
              }}>
              <span style={{ marginTop: "2px", flexShrink: 0 }}>{s.icon}</span>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: active ? 600 : 400, color: active ? "#4ADE80" : "#94A3B8", fontFamily: fonts.body }}>{s.label}</span>
                <span style={{ display: "block", fontSize: "11px", color: "#334155", lineHeight: 1.3, marginTop: "2px" }}>{s.description}</span>
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
