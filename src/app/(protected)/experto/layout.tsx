"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Resumen", href: "/experto" },
  { label: "Dashboard", href: "/experto/dashboard" },
  { label: "Centro AI", href: "/experto/ai-center" },
  { label: "Decisiones", href: "/experto/decisiones" },
  { label: "Casos", href: "/experto/casos" },
  { label: "Tributario", href: "/experto/tributario" },
  { label: "Auditoría", href: "/experto/auditoria" },
  { label: "Operaciones", href: "/experto/operaciones" },
  { label: "Declaraciones", href: "/experto/declaraciones" },
  { label: "Verificaciones", href: "/experto/verificaciones" },
  { label: "Reportes", href: "/experto/reportes" },
  { label: "Memoria Tributaria", href: "/experto/memoria-tributaria" },
  { label: "Perfiles Adaptativos", href: "/experto/perfiles-adaptativos" },
  { label: "Recomendaciones", href: "/experto/recomendaciones" },
  { label: "Tareas", href: "/experto/tareas" },
  { label: "Expedientes", href: "/experto/expedientes" },
  { label: "Documentos", href: "/experto/documentos" },
];

export default function ExpertoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      <aside
        style={{
          width: "200px",
          flexShrink: 0,
          background: "#0B1D2C",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "10px",
          position: "sticky",
          top: "92px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            padding: "8px 10px 4px",
            margin: 0,
          }}
        >
          Modo Experto
        </p>
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href + l.label}
              href={l.href}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "none",
                background: active ? "rgba(22,163,74,0.18)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: active ? "#4ADE80" : "#94A3B8",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
